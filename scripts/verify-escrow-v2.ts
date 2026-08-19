/**
 * Exercises the v2 escrow decoding path against a real contract.
 *
 * `fetchEscrowDetail` destructures nine named return values out of `summary()`
 * and reads a packed struct array out of `milestones()`. Both are decoded by
 * ethers from the generated ABI, and a mistake in either is invisible to
 * TypeScript — the compiler believes whatever the cast claims. This runs the
 * real function against a real contract and checks the values.
 *
 * Against a local node, so it costs nothing and needs no testnet funds:
 *   npx hardhat node                                        (in OpenForge-Contracts)
 *   npx hardhat run scripts/local-fixture.js --network localhost
 *   npx tsx scripts/verify-escrow-v2.ts <escrowAddress>
 */
import { JsonRpcProvider, Wallet } from 'ethers';
import { fetchEscrowDetail, permissionsFor, roleFor, isReclaimable } from '../chain/escrow';
import { signPermit, supportsPermit } from '../chain/erc20';
import { milestoneStatus, EscrowState, OnChainMilestoneStatus } from '../lib/status';

const RPC = 'http://127.0.0.1:8545';
const LOCAL_CHAIN_ID = 31337;

// Hardhat's first two deterministic accounts.
const FUNDER_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const DEVELOPER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

let failures = 0;

function check(label: string, condition: boolean, got?: unknown) {
  const suffix = got === undefined ? '' : `  (got ${String(got)})`;
  console.log(`  ${condition ? 'ok  ' : 'FAIL'}  ${label}${suffix}`);
  if (!condition) failures += 1;
}

async function main() {
  const escrowAddress = process.argv[2];
  if (!escrowAddress) throw new Error('Pass the escrow address from local-fixture.js.');

  const provider = new JsonRpcProvider(RPC);
  const funder = new Wallet(FUNDER_KEY, provider);

  console.log('== fetchEscrowDetail ==');
  const detail = await fetchEscrowDetail(escrowAddress, provider, LOCAL_CHAIN_ID);

  check('state decodes to Funded', detail.state === EscrowState.Funded, detail.state);
  check('funder matches', detail.funder.toLowerCase() === funder.address.toLowerCase());
  check('developer matches', detail.developer.toLowerCase() === DEVELOPER.toLowerCase());
  check('totalAmount is the sum of milestones', detail.totalAmount === 2_500_000_000n, detail.totalAmount);
  check('releasedGross is the released milestone, GROSS', detail.releasedGross === 1_200_000_000n, detail.releasedGross);
  check('reclaimedTotal is zero', detail.reclaimedTotal === 0n, detail.reclaimedTotal);
  check('feeBps read from the escrow', detail.feeBps === 150n, detail.feeBps);
  check('resolvedCount counts the release', detail.resolvedCount === 1, detail.resolvedCount);

  // The balance must be the deposit minus the gross release: 2500 - 1200.
  check('contractBalance from summary()', detail.contractBalance === 1_300_000_000n, detail.contractBalance);

  console.log('\n== milestones ==');
  check('three milestones decoded', detail.milestones.length === 3, detail.milestones.length);
  check('milestone 0 is Released', detail.milestones[0].status === OnChainMilestoneStatus.Released);
  check('milestone 1 is Pending', detail.milestones[1].status === OnChainMilestoneStatus.Pending);
  check('deadlines are non-zero (mandatory)', detail.milestones.every((m) => m.deadline > 0n));
  check(
    'status descriptor maps Released',
    milestoneStatus(detail.milestones[0]).key === 'released',
    milestoneStatus(detail.milestones[0]).key,
  );
  check(
    'nothing is reclaimable before its deadline',
    detail.milestones.every((m) => !isReclaimable(m)),
  );

  console.log('\n== dispute (raised by the developer in the fixture) ==');
  check('frozen is true', detail.frozen === true, detail.frozen);
  check('developerRaisedDispute', detail.developerRaisedDispute === true);
  check('funderRaisedDispute is false', detail.funderRaisedDispute === false);
  check('disputeExpiresAt is set', detail.disputeExpiresAt > 0n, detail.disputeExpiresAt);

  console.log('\n== permissions ==');
  const funderRole = roleFor(detail, funder.address);
  const devRole = roleFor(detail, DEVELOPER);
  check('funder role resolves', funderRole === 'funder', funderRole);
  check('developer role resolves', devRole === 'developer', devRole);

  const funderPerms = permissionsFor(detail, funderRole);
  const devPerms = permissionsFor(detail, devRole);
  check('funder may release', funderPerms.canRelease === true);
  check('funder may NOT reclaim while frozen', funderPerms.canReclaim === false);
  check('funder may still raise their own dispute', funderPerms.canRaiseDispute === true);
  check('developer may NOT raise a second dispute', devPerms.canRaiseDispute === false);
  check('developer may withdraw their dispute', devPerms.canWithdrawDispute === true);
  check('funder may NOT withdraw the developer’s dispute', funderPerms.canWithdrawDispute === false);
  check('developer may not release', devPerms.canRelease === false);
  check('sweep is not yet available', funderPerms.canSweep === false);

  console.log('\n== EIP-2612 permit ==');
  const hasPermit = await supportsPermit(detail.paymentToken, funder.address, provider);
  check('tUSDC reports permit support', hasPermit === true);

  if (hasPermit) {
    const signature = await signPermit(funder, detail.paymentToken, escrowAddress, 1_000n);
    check('signature has a valid v', signature.v === 27 || signature.v === 28, signature.v);
    check('r is 32 bytes', /^0x[0-9a-f]{64}$/i.test(signature.r));
    check('s is 32 bytes', /^0x[0-9a-f]{64}$/i.test(signature.s));
    check('deadline is in the future', signature.deadline > BigInt(Math.floor(Date.now() / 1000)));
  }

  console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILED`);
  if (failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
