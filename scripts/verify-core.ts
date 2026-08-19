/**
 * Verifies the ported chain + IPFS layer against live Sepolia.
 * Run with: npx tsx scripts/verify-core.ts
 */
import { getReadProvider } from '../chain/clients';
import { DEFAULT_CHAIN, calculateFee, calculateNetAmount, PROTOCOL } from '../chain/config';
import { getNextProjectId, getRecentProjects } from '../chain/projectRegistry';
import { getTotalProjects } from '../chain/escrowFactory';
import { getProfileCid } from '../chain/profileRegistry';
import { fetchIpfsJson } from '../lib/ipfs';
import { formatTokenAmount } from '../lib/format';

let failures = 0;

async function step<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  const t0 = Date.now();
  try {
    const value = await fn();
    console.log(`  ${String(Date.now() - t0).padStart(6)}ms  ok    ${label}`);
    return value;
  } catch (error) {
    failures += 1;
    console.log(
      `  ${String(Date.now() - t0).padStart(6)}ms  FAIL  ${label} -> ${(error as Error).message.slice(0, 80)}`,
    );
    return null;
  }
}

function check(label: string, actual: unknown, expected: unknown) {
  const ok = String(actual) === String(expected);
  if (!ok) failures += 1;
  console.log(`          ${ok ? 'ok  ' : 'FAIL'}  ${label}  (got ${actual})`);
}

async function main() {
  console.log('\n== chain reads (no wallet) ==');
  const provider = getReadProvider();
  const network = await step('getNetwork', () => provider.getNetwork());
  check('chainId is Sepolia', network?.chainId, DEFAULT_CHAIN.chainId);

  const total = await step('projectRegistry.nextProjectId', () => getNextProjectId(provider));
  const recent = await step('projectRegistry.getRecentProjects', () =>
    getRecentProjects(provider, 0, 5),
  );
  console.log(`          ${total} project(s) on chain`);

  const escrowTotal = await step('escrowRegistry.getTotalProjects', () =>
    getTotalProjects(provider),
  );
  console.log(`          ${escrowTotal} escrow project(s) on chain`);

  const builder = recent?.projects[0]?.builder;
  if (builder) {
    const cid = await step(`profileRegistry.getProfileCid(${builder.slice(0, 8)}…)`, () =>
      getProfileCid(builder, provider),
    );
    console.log(`          profile cid: ${cid ?? 'none'}`);
  }

  console.log('\n== ipfs read via dedicated gateway ==');
  const metadataCid = recent?.projects[0]?.metadataCid;
  if (metadataCid) {
    const meta = await step('fetchIpfsJson', () =>
      fetchIpfsJson<Record<string, unknown>>(metadataCid),
    );
    if (meta) console.log(`          keys: ${Object.keys(meta).join(', ')}`);
  } else {
    console.log('          (no CID on chain to test)');
  }

  console.log('\n== fee math vs Solidity ==');
  const k = (n: number) => BigInt(n) * 10n ** 6n;
  check('fee bps', PROTOCOL.feeBasisPoints, 150n);
  check('1200 tUSDC fee = 18', formatTokenAmount(calculateFee(k(1200)), 6), '18');
  check('1200 tUSDC net = 1,182', formatTokenAmount(calculateNetAmount(k(1200)), 6), '1,182');
  check('no value created', calculateFee(k(1200)) + calculateNetAmount(k(1200)), k(1200));

  console.log(`\n${failures === 0 ? 'ALL PASSED' : `${failures} FAILURE(S)`}\n`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
