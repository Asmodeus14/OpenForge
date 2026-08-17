'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { isAddress } from 'ethers';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Divider, Page, PageHeader } from '@/components/ui/Layout';
import { Alert } from '@/components/ui/States';
import { AddressDisplay, DisclosureNote, FactList } from '@/components/trust/Trust';
import { TransactionFlow } from '@/components/trust/TransactionFlow';
import { TagInput } from '@/components/ui/TagInput';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import { useTokenAllowance, useTokenBalance } from '@/hooks/queries';
import { useTransaction } from '@/hooks/useTransaction';
import { deployEscrowIntent, totalFeeFor } from '@/components/escrow/intents';
import { DEFAULT_CHAIN, PROTOCOL } from '@/chain/config';
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
 */

const TOKEN = DEFAULT_CHAIN.tokens[0];
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

export function DeployEscrowWizard() {
  const router = useRouter();
  const wallet = useWalletContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [developer, setDeveloper] = useState('');
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([newMilestone()]);
  const [submitted, setSubmitted] = useState(false);

  const balance = useTokenBalance(TOKEN.address, wallet.account);

  /* ------------------------------------------------------------ validation */

  // Parsed once and reused, so the figure validated is the figure displayed
  // and the figure sent to the contract.
  const parsed = useMemo(
    () =>
      milestones.map((milestone) => ({
        ...milestone,
        value: parseTokenAmount(milestone.amount, TOKEN.decimals),
      })),
    [milestones],
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

  const milestoneErrors = parsed.map((milestone) => {
    if (!milestone.description.trim()) return 'Describe what this milestone pays for.';
    if (!milestone.amount.trim()) return 'Enter an amount.';
    if (milestone.value === null)
      return `Enter a number with at most ${TOKEN.decimals} decimal places.`;
    if (milestone.value <= 0n) return 'The amount must be greater than zero.';
    if (milestone.days.trim() && Number(milestone.days) <= 0)
      return 'A deadline must be at least one day away.';
    return '';
  });

  const valid =
    Object.keys(errors).length === 0 &&
    milestoneErrors.every((error) => !error) &&
    parsed.length > 0;

  const insufficient =
    balance.data !== undefined && total > 0n && balance.data < total;

  /* ---------------------------------------------------------------- submit */

  const tx = useTransaction({
    onSuccess: () => router.push('/escrow'),
  });

  // Captured so the user can still reach a contract that deployed before a
  // later step failed — otherwise the address would be lost with the dialog.
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

  const allowance = useTokenAllowance(TOKEN.address, wallet.account, deployedAddress);

  function submit() {
    setSubmitted(true);
    if (!valid || !wallet.account) return;

    const nowSeconds = Math.floor(Date.now() / 1000);

    tx.start(
      deployEscrowIntent({
        params: {
          funder: wallet.account,
          developer: developer.trim(),
          token: TOKEN.address,
          milestones: parsed.map((milestone) => ({
            amount: milestone.value!,
            deadline: milestone.days.trim()
              ? BigInt(nowSeconds + Number(milestone.days) * 86_400)
              : 0n,
            description: milestone.description.trim(),
          })),
        },
        token: TOKEN,
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
          </div>

          {/* --------------------------------------------------- milestones */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-section text-fg">Milestones</h2>
              <span className="text-meta text-fg-muted">
                Paid in {TOKEN.symbol} · {TOKEN.decimals} decimals
              </span>
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
                      label={`Amount (${TOKEN.symbol})`}
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

          <FactList
            className="mt-4"
            facts={[
              { label: 'Milestones', value: String(milestones.length) },
              { label: 'Token', value: TOKEN.symbol },
              {
                label: 'You deposit',
                value: `${formatTokenAmount(total, TOKEN.decimals)} ${TOKEN.symbol}`,
                emphasis: true,
                mono: true,
              },
              {
                label: `Fee if all released (${Number(PROTOCOL.feeBasisPoints) / 100}%)`,
                value: `${formatTokenAmount(fee, TOKEN.decimals)} ${TOKEN.symbol}`,
                mono: true,
              },
              {
                label: 'Developer receives',
                value: `${formatTokenAmount(total - fee, TOKEN.decimals)} ${TOKEN.symbol}`,
                mono: true,
              },
              {
                label: 'Your balance',
                value:
                  balance.data === undefined
                    ? '—'
                    : `${formatTokenAmount(balance.data, TOKEN.decimals)} ${TOKEN.symbol}`,
                mono: true,
              },
            ]}
          />

          {insufficient && (
            <Alert tone="warning" title="Not enough tokens" className="mt-5">
              Your wallet holds less {TOKEN.symbol} than this escrow requires. The deposit
              would fail after you had already paid to deploy the contract.
            </Alert>
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
