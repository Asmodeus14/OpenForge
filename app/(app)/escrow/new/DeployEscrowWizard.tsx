'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDeferredValue, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatUnits, isAddress } from 'ethers';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Divider, Page, PageHeader } from '@/components/ui/Layout';
import { Alert } from '@/components/ui/States';
import { AddressDisplay, DisclosureNote, FactList } from '@/components/trust/Trust';
import { TransactionFlow } from '@/components/trust/TransactionFlow';
import { TagInput } from '@/components/ui/TagInput';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import {
  queryKeys,
  useDeployGasPreflight,
  useTokenAllowance,
  useTokenBalance,
} from '@/hooks/queries';
import { GasPreflight } from '@/components/escrow/GasPreflight';
import { ApprovalGate, useEscrowApproval } from '@/components/escrow/ApprovalGate';
import { PersonName } from '@/components/trust/Identity';
import {
  encodePayload,
  termsFrom,
  CREATED_MARKER,
  type CreatedPayload,
  type ProposalPayload,
} from '@/chain/approval';
import * as chat from '@/lib/chat/api';
import { useTransaction } from '@/hooks/useTransaction';
import { deployEscrowIntent, totalFeeFor } from '@/components/escrow/intents';
import { RecipientCheck, type LinkedProject } from '@/components/escrow/RecipientCheck';
import {
  CUSTOM_TOKEN,
  DEFAULT_TOKEN_CHOICE,
  findListedToken,
  TokenSelect,
  useTokenSelection,
  type TokenSelection,
} from '@/components/escrow/TokenSelect';
import { PROTOCOL } from '@/chain/config';
import { formatTokenAmount, parseTokenAmount, isAddressEqual } from '@/lib/format';
import { cn } from '@/lib/cn';

/**
 * Create an escrow.
 *
 * A funder is about to lock real value in a contract they cannot amend, so
 * the whole configuration stays on one screen with a running summary beside
 * it. A multi-page wizard would hide the total behind a "next" button, which
 * is exactly the figure that must never be out of sight.
 *
 * The four transactions this produces — deploy, register, approve, deposit —
 * are named before anything is signed, so the number of wallet prompts is
 * never a surprise.
 *
 * When reached from a project page the developer field arrives pre-filled with
 * that project's registered builder, and `RecipientCheck` states whether the
 * address in the field still matches it. Typing a payment address by hand is
 * the single least recoverable step in the flow.
 */

const MILESTONE_DESCRIPTION_MAX = 200;
const DEFAULT_DEADLINE_DAYS = 30;

interface MilestoneDraft {
  id: string;
  description: string;
  amount: string;
  /** Days from now. Empty means no deadline. */
  days: string;
}

function newMilestone(): MilestoneDraft {
  return {
    id: crypto.randomUUID(),
    description: '',
    amount: '',
    days: String(DEFAULT_DEADLINE_DAYS),
  };
}

/**
 * Base units back to the figure a person typed.
 *
 * `formatTokenAmount` is for display and groups thousands, which this field
 * would then reject — so the plain form is used and its trailing zeros
 * trimmed. The value is exact either way; no rounding happens here.
 */
function amountField(amount: bigint, decimals: number): string {
  const text = formatUnits(amount, decimals);
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
}

function milestonesFromProposal(proposal: ProposalPayload): MilestoneDraft[] {
  return proposal.terms.milestones.map((milestone) => ({
    id: crypto.randomUUID(),
    description: milestone.description,
    amount: amountField(BigInt(milestone.amount), proposal.tokenDecimals),
    // Zero is how "no deadline" is signed; the field expresses that as blank.
    days: milestone.deadlineDays === '0' ? '' : milestone.deadlineDays,
  }));
}

function tokenSelectionFrom(address: string): TokenSelection {
  const listed = findListedToken(address);
  return listed
    ? { choice: listed.address, customAddress: '' }
    : { choice: CUSTOM_TOKEN, customAddress: address };
}

export function DeployEscrowWizard({
  linkedProject,
  proposal,
}: {
  /** Present when the flow was entered from a specific project. */
  linkedProject?: (LinkedProject & { description: string | null; tags: string[] }) | null;
  /**
   * Terms carried in from a conversation, so agreeing an escrow over several
   * days does not end with someone retyping every amount from memory into a
   * contract that can never be edited. Only ever a starting point: the funder
   * is the connected wallet, and the developer's signature is re-verified
   * against what is on screen — see `lib/proposalLink.ts`.
   */
  proposal?: ProposalPayload | null;
}) {
  const router = useRouter();
  const wallet = useWalletContext();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState(proposal?.title || linkedProject?.title || '');
  const [description, setDescription] = useState(linkedProject?.description ?? '');
  const [tags, setTags] = useState<string[]>(linkedProject?.tags ?? []);
  const [developer, setDeveloper] = useState(
    proposal?.terms.developer ?? linkedProject?.builder ?? '',
  );
  const [milestones, setMilestones] = useState<MilestoneDraft[]>(() =>
    proposal ? milestonesFromProposal(proposal) : [newMilestone()],
  );
  const [submitted, setSubmitted] = useState(false);

  // Which currency. The selection is the state; the token itself is derived
  // from it, so the amounts below always parse against the decimals actually
  // in force rather than the previous token's.
  const [tokenSelection, setTokenSelection] = useState<TokenSelection>(() =>
    proposal
      ? tokenSelectionFrom(proposal.terms.token)
      : { choice: DEFAULT_TOKEN_CHOICE, customAddress: '' },
  );
  const tokenResolution = useTokenSelection(tokenSelection);
  const token = tokenResolution.token;

  const balance = useTokenBalance(token?.address, wallet.account);

  /* ------------------------------------------------------------ validation */

  // Parsed once and reused, so the figure validated is the figure displayed
  // and the figure sent to the contract.
  //
  // Re-parsed whenever the token changes: "0.123456" is a valid tUSDC amount
  // at 6 decimals and an invalid one at 2, and switching currency must
  // re-judge every field rather than leave a stale verdict on screen.
  const parsed = useMemo(
    () =>
      milestones.map((milestone) => ({
        ...milestone,
        value: token ? parseTokenAmount(milestone.amount, token.decimals) : null,
      })),
    [milestones, token],
  );

  const total = parsed.reduce((sum, m) => sum + (m.value ?? 0n), 0n);
  const fee = totalFeeFor(parsed.map((m) => m.value ?? 0n));

  const errors: Record<string, string> = {};

  if (!title.trim()) errors.title = 'Give the project a name so it can be found again.';

  if (!developer.trim()) {
    errors.developer = 'Enter the wallet address that will be paid.';
  } else if (!isAddress(developer.trim())) {
    errors.developer = 'That is not a valid Ethereum address.';
  } else if (isAddressEqual(developer, wallet.account)) {
    // The constructor rejects this outright — catching it here saves a
    // deployment that would revert after the gas was spent.
    errors.developer = 'The developer must be a different wallet from yours.';
  }

  if (!token) {
    errors.token = tokenResolution.isCustom
      ? 'Enter a token address that can be read from the chain.'
      : 'Choose the currency this escrow pays in.';
  }

  const milestoneErrors = parsed.map((milestone) => {
    if (!milestone.description.trim()) return 'Describe what this milestone pays for.';
    if (!milestone.amount.trim()) return 'Enter an amount.';
    // Until the currency resolves there is no correct precision to judge an
    // amount against, so the field is left alone rather than marked wrong.
    if (!token) return '';
    if (milestone.value === null)
      return `Enter a number with at most ${token.decimals} decimal places.`;
    if (milestone.value <= 0n) return 'The amount must be greater than zero.';
    if (milestone.days.trim() && Number(milestone.days) <= 0)
      return 'A deadline must be at least one day away.';
    return '';
  });

  const valid =
    Object.keys(errors).length === 0 &&
    milestoneErrors.every((error) => !error) &&
    parsed.length > 0;

  // The recipient panel needs a resolvable address, and there is nothing
  // useful to say about your own wallet.
  const recipientCheckable = !errors.developer && isAddress(developer.trim());

  const insufficient =
    balance.data !== undefined && total > 0n && balance.data < total;

  /* ------------------------------------------------------------ gas preflight */

  // The configuration the deploy would send, so the estimate prices the real
  // transaction rather than an approximation of it. Deadlines stay as days
  // here — converting them needs the clock, which cannot be read during
  // render without the value drifting on every pass.
  const deploySpec = useMemo(() => {
    if (!valid || !wallet.account || !token) return null;
    return {
      funder: wallet.account,
      developer: developer.trim(),
      token: token.address,
      milestones: parsed.map((milestone) => ({
        amount: milestone.value!,
        days: milestone.days.trim() ? Number(milestone.days) : 0,
        description: milestone.description.trim(),
      })),
    };
    // `parsed` already carries every field the estimate depends on.
  }, [valid, wallet.account, token, developer, parsed]);

  // Deferred so a burst of typing collapses into one estimate. Each distinct
  // configuration is two RPC calls, and re-running them per keystroke would
  // be both slow and rude to a public endpoint.
  const deferredSpec = useDeferredValue(deploySpec);

  const gas = useDeployGasPreflight({
    account: wallet.account,
    spec: deferredSpec,
    totalAmount: total,
    enabled: Boolean(deferredSpec),
  });

  /* -------------------------------------------------------- developer sign-off */

  // The canonical terms the developer signs. Derived from the same parsed
  // values the deploy uses, so an approval can never cover something subtly
  // different from what gets sent.
  const terms = useMemo(() => (deploySpec ? termsFrom(deploySpec) : null), [deploySpec]);

  const approval = useEscrowApproval(
    terms ?? { funder: '', developer: '', token: '', milestones: [] },
  );

  /* ---------------------------------------------------------------- submit */

  // Captured so the user can still reach a contract that deployed before a
  // later step failed — otherwise the address would be lost with the dialog.
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  const tx = useTransaction({
    onSuccess: () => {
      // Close the loop in the conversation the terms were agreed in. Without
      // this the room ends on a proposal, and neither party can tell from it
      // whether the escrow was ever created — least of all the developer, who
      // has no way to create one themselves.
      //
      // Best-effort and after the fact: the escrow is deployed and funded by
      // this point, and a chat failure must not be reported as if it were not.
      if (approval.auth.token && approval.room && deployedAddress && terms && token) {
        const announcement: CreatedPayload = {
          kind: CREATED_MARKER,
          terms,
          escrowAddress: deployedAddress,
          tokenSymbol: token.symbol,
          tokenDecimals: token.decimals,
          title: title.trim(),
        };
        void chat
          .postMessage(approval.auth.token, approval.room, encodePayload(announcement))
          .catch(() => {});
      }

      // The list this lands on is served from cache, so without this the
      // escrow just created is missing from it until something else happens
      // to refetch.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.escrowProjects(wallet.account),
      });

      router.push('/escrow');
    },
  });

  const allowance = useTokenAllowance(token?.address, wallet.account, deployedAddress);

  function submit() {
    setSubmitted(true);
    if (!valid || !wallet.account || !token) return;

    const nowSeconds = Math.floor(Date.now() / 1000);

    tx.start(
      deployEscrowIntent({
        params: {
          funder: wallet.account,
          developer: developer.trim(),
          token: token.address,
          milestones: parsed.map((milestone) => ({
            amount: milestone.value!,
            deadline: milestone.days.trim()
              ? BigInt(nowSeconds + Number(milestone.days) * 86_400)
              : 0n,
            description: milestone.description.trim(),
          })),
        },
        token,
        title: title.trim(),
        description: description.trim(),
        tags,
        // A freshly deployed contract has no allowance, so the approval step
        // is always required for a new escrow.
        existingAllowance: allowance.data ?? 0n,
        onDeployed: setDeployedAddress,
      }),
    );
  }

  /* ----------------------------------------------------------- no wallet */

  if (!wallet.account) {
    return (
      <Page width="content">
        <PageHeader
          title="New escrow"
          description="Lock funds in a contract that pays out milestone by milestone."
        />
        <Divider />
        <div className="py-12">
          <Alert tone="info" title="Connect a wallet first">
            You will be the funder of this escrow, so it has to be created from the wallet
            that holds the tokens.
          </Alert>

          {/* Without this, arriving from a project page and hitting the wallet
              gate loses every trace of which project was being funded. */}
          {linkedProject && (
            <div className="mt-6">
              <p className="text-secondary text-fg-secondary">
                Once connected, this form opens pre-filled for{' '}
                <Link
                  href={`/projects/${linkedProject.projectId}`}
                  className="text-accent-text hover:underline underline-offset-4"
                >
                  {linkedProject.title ?? `project #${linkedProject.projectId}`}
                </Link>
                , paying its registered builder:
              </p>
              <div className="mt-3">
                <AddressDisplay address={linkedProject.builder} chars={6} />
              </div>
            </div>
          )}
          <Button
            variant="primary"
            className="mt-6"
            loading={wallet.isConnecting}
            onClick={wallet.connect}
            leadingIcon={<Wallet className="size-4" aria-hidden />}
          >
            Connect wallet
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title="New escrow"
        description="Lock funds in a contract that pays out milestone by milestone, only when you approve each one."
      />

      {linkedProject && (
        <Alert
          tone="info"
          title={`Funding project #${linkedProject.projectId}`}
          className="mb-2"
        >
          The details below were copied from{' '}
          <Link
            href={`/projects/${linkedProject.projectId}`}
            className="text-accent-text hover:underline underline-offset-4"
          >
            that project&rsquo;s registry entry
          </Link>
          , and the developer wallet is its registered builder. Everything is still yours
          to edit — the escrow you create is a separate contract and is not linked back to
          the project.
        </Alert>
      )}

      {proposal && (
        <Alert tone="info" title="Terms restored from your conversation" className="mb-2">
          These are the figures you sent <PersonName address={proposal.terms.developer} />.
          Nothing has been sent to the chain — review them, change anything you need to,
          and confirm below. Editing an amount invalidates any signature already given.
        </Alert>
      )}

      {/* Decimals come from the token contract, not from the message. If the
          two disagree the restored amounts mean something different from what
          was signed — the signature check below would catch it, but silence
          until then would be a poor way to find out. */}
      {proposal && token && token.decimals !== proposal.tokenDecimals && (
        <Alert tone="warning" title="Check every amount" className="mb-2">
          The proposal was written for a token with {proposal.tokenDecimals} decimals, and{' '}
          {token.symbol} reports {token.decimals}. The amounts above were restored at the
          proposal&rsquo;s precision and may not be the numbers you agreed.
        </Alert>
      )}

      {approval.alreadyCreated && (
        <Alert tone="warning" title="These exact terms already exist" className="mb-2">
          An escrow for this configuration was created earlier and posted to your
          conversation. Deploying again would produce a second contract and a second
          deposit.{' '}
          <Link
            href={`/escrow/${approval.alreadyCreated}`}
            className="text-accent-text hover:underline underline-offset-4"
          >
            Open the existing escrow
          </Link>
          .
        </Alert>
      )}

      <div className="grid gap-12 border-t border-line py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="flex min-w-0 flex-col gap-10"
        >
          {/* ------------------------------------------------------ project */}
          <div className="flex flex-col gap-6">
            <h2 className="text-section text-fg">Project</h2>

            <Input
              label="Name"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              error={submitted ? errors.title : undefined}
              maxLength={120}
              placeholder="Rewrite the payments dashboard"
            />

            <Textarea
              label="What is being built"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              showCount
              hint="Stored on chain in the project registry, and readable by anyone."
            />

            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* ------------------------------------------------------ parties */}
          <div className="flex flex-col gap-6">
            <h2 className="text-section text-fg">Parties</h2>

            <div>
              <p className="text-secondary font-medium text-fg">Funder — you</p>
              <div className="mt-2">
                <AddressDisplay address={wallet.account} chars={6} />
              </div>
              <p className="mt-2 text-meta text-fg-muted">
                Your wallet deposits the funds and is the only one that can release them.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Input
                label="Developer wallet"
                required
                mono
                value={developer}
                onChange={(event) => setDeveloper(event.target.value)}
                error={submitted ? errors.developer : undefined}
                placeholder="0x…"
                hint="Payments go here. Check it carefully — it cannot be changed after deployment."
              />

              {/* Rendered only for a well-formed address that is not the
                  funder's own — anything else already has a field error, and
                  stacking a second verdict underneath it just adds noise. */}
              {recipientCheckable && (
                <RecipientCheck address={developer.trim()} linkedProject={linkedProject} />
              )}
            </div>
          </div>

          {/* ----------------------------------------------------- currency */}
          <div className="flex flex-col gap-6">
            <h2 className="text-section text-fg">Currency</h2>

            <TokenSelect
              selection={tokenSelection}
              onSelectionChange={setTokenSelection}
              resolution={tokenResolution}
            />

            {submitted && errors.token && (
              <p role="alert" className="text-meta text-danger-text">
                {errors.token}
              </p>
            )}
          </div>

          {/* --------------------------------------------------- milestones */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-section text-fg">Milestones</h2>
              {token && (
                <span className="text-meta text-fg-muted">
                  Paid in {token.symbol} · {token.decimals}{' '}
                  {token.decimals === 1 ? 'decimal' : 'decimals'}
                </span>
              )}
            </div>

            <ol className="flex flex-col">
              {milestones.map((milestone, index) => (
                <li
                  key={milestone.id}
                  className={cn(
                    'flex flex-col gap-4 py-6',
                    index > 0 && 'border-t border-line',
                    index === 0 && 'pt-0',
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-code text-fg-muted tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {milestones.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        leadingIcon={<Trash2 className="size-3.5" aria-hidden />}
                        onClick={() =>
                          setMilestones((prev) => prev.filter((m) => m.id !== milestone.id))
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Input
                    label="What this pays for"
                    required
                    value={milestone.description}
                    maxLength={MILESTONE_DESCRIPTION_MAX}
                    onChange={(event) =>
                      setMilestones((prev) =>
                        prev.map((m) =>
                          m.id === milestone.id
                            ? { ...m, description: event.target.value }
                            : m,
                        ),
                      )
                    }
                    placeholder="Working prototype deployed to staging"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label={token ? `Amount (${token.symbol})` : 'Amount'}
                      required
                      mono
                      inputMode="decimal"
                      value={milestone.amount}
                      onChange={(event) =>
                        setMilestones((prev) =>
                          prev.map((m) =>
                            m.id === milestone.id ? { ...m, amount: event.target.value } : m,
                          ),
                        )
                      }
                      placeholder="1200"
                    />

                    <Input
                      label="Deadline (days from now)"
                      mono
                      inputMode="numeric"
                      value={milestone.days}
                      onChange={(event) =>
                        setMilestones((prev) =>
                          prev.map((m) =>
                            m.id === milestone.id ? { ...m, days: event.target.value } : m,
                          ),
                        )
                      }
                      placeholder="30"
                      hint="Leave blank for no deadline."
                    />
                  </div>

                  {submitted && milestoneErrors[index] && (
                    <p role="alert" className="text-meta text-danger-text">
                      {milestoneErrors[index]}
                    </p>
                  )}
                </li>
              ))}
            </ol>

            <div>
              <Button
                type="button"
                variant="secondary"
                leadingIcon={<Plus className="size-4" aria-hidden />}
                onClick={() => setMilestones((prev) => [...prev, newMilestone()])}
              >
                Add milestone
              </Button>
            </div>

            <DisclosureNote>
              A deadline does not block payment — you can release a milestone at any time,
              before or after it. It only unlocks your ability to cancel that milestone and
              take the money back. A milestone with no deadline can never be cancelled on
              its own.
            </DisclosureNote>
          </div>

          {/* Sign-off sits immediately before the deploy button, because it is
              the last thing that should happen before money is committed. */}
          {terms && token && (
            <ApprovalGate
              terms={terms}
              token={token}
              title={title.trim()}
              resolution={approval}
            />
          )}

          <Divider />

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" size="lg" disabled={insufficient}>
              Review escrow
            </Button>
            <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>

          {submitted && !valid && (
            <p role="alert" className="text-secondary text-danger-text">
              Fix the highlighted fields before continuing.
            </p>
          )}
        </form>

        {/* --------------------------------------------------------- summary */}

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-section text-fg">Summary</h2>

          {/* Every figure carries the selected token's symbol and decimals.
              An amount rendered at the wrong precision is not a cosmetic bug
              — it is a different number. */}
          <FactList
            className="mt-4"
            facts={[
              { label: 'Milestones', value: String(milestones.length) },
              { label: 'Currency', value: token?.symbol ?? 'Not chosen' },
              {
                label: 'You deposit',
                value: token
                  ? `${formatTokenAmount(total, token.decimals)} ${token.symbol}`
                  : '—',
                emphasis: true,
                mono: true,
              },
              {
                label: `Fee if all released (${Number(PROTOCOL.feeBasisPoints) / 100}%)`,
                value: token
                  ? `${formatTokenAmount(fee, token.decimals)} ${token.symbol}`
                  : '—',
                mono: true,
              },
              {
                label: 'Developer receives',
                value: token
                  ? `${formatTokenAmount(total - fee, token.decimals)} ${token.symbol}`
                  : '—',
                mono: true,
              },
              {
                label: 'Your balance',
                value:
                  token && balance.data !== undefined
                    ? `${formatTokenAmount(balance.data, token.decimals)} ${token.symbol}`
                    : '—',
                mono: true,
              },
            ]}
          />

          {insufficient && token && (
            <Alert tone="warning" title="Not enough tokens" className="mt-5">
              Your wallet holds less {token.symbol} than this escrow requires. The deposit
              would fail after you had already paid to deploy the contract.
            </Alert>
          )}

          {/* Appears only once the configuration is complete enough to price —
              estimating an invalid one means asking the node to simulate a
              transaction that would revert. */}
          {deferredSpec && (
            <GasPreflight
              data={gas.data}
              isPending={gas.isPending}
              isError={gas.isError}
            />
          )}

          <DisclosureNote className="mt-5">
            Creating this escrow takes four wallet confirmations: deploy the contract, list
            it in the registry, approve the tokens, then deposit them.
          </DisclosureNote>

          <DisclosureNote className="mt-3" tone="caution">
            Milestones, amounts, the developer and the token are fixed at deployment and can
            never be edited. To change any of them you would have to cancel and start again.
          </DisclosureNote>
        </aside>
      </div>

      <TransactionFlow tx={tx} />
    </Page>
  );
}
