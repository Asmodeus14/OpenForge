'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Divider, Page, PageHeader, Section } from '@/components/ui/Layout';
import { Alert, ErrorState } from '@/components/ui/States';
import { DisclosureNote } from '@/components/trust/Trust';
import { TransactionFlow } from '@/components/trust/TransactionFlow';
import { TagInput } from '@/components/ui/TagInput';
import { useWalletContext } from '@/components/wallet/WalletProvider';
import { useTransaction } from '@/hooks/useTransaction';
import { uploadFileToIpfs, uploadJsonToIpfs } from '@/lib/ipfs-upload';
import {
  ACCEPTED_IMAGE_TYPES,
  PROJECT_LIMITS,
  buildProjectMetadata,
  validateProjectDraft,
} from '@/lib/project';
import { registerProject } from '@/chain/projectRegistry';
import { DEFAULT_CHAIN } from '@/chain/config';

/**
 * Create a project.
 *
 * Uploads go through the server route, so pinning credentials never reach
 * the browser. There is deliberately no fallback when pinning fails: the
 * previous implementation silently fabricated a `bafybeimock…` CID, stored
 * the document in localStorage, wrote that fake identifier to the
 * blockchain, and reported success — leaving an on-chain project whose
 * metadata no other browser could ever resolve.
 */
export function CreateProjectForm() {
  const router = useRouter();
  const wallet = useWalletContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<unknown>(null);

  const tx = useTransaction({
    onSuccess: () => {
      // Discover is cached on the server; refresh so the new project appears.
      router.refresh();
      router.push('/projects');
    },
  });

  function onPickCover(file: File | null) {
    setErrors((prev) => ({ ...prev, cover: '' }));
    if (!file) {
      setCover(null);
      setCoverPreview(null);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setErrors((prev) => ({ ...prev, cover: 'Use a JPEG, PNG, WebP or GIF image.' }));
      return;
    }
    if (file.size > PROJECT_LIMITS.imageBytesMax) {
      setErrors((prev) => ({ ...prev, cover: 'Images must be 5 MB or smaller.' }));
      return;
    }
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function submit() {
    const draft = { title, description, tags };
    const found = validateProjectDraft(draft);
    setErrors(found);
    setUploadError(null);
    if (Object.keys(found).length > 0) return;

    // The upload is its own visible step. It happens before the wallet
    // opens, so a pinning failure never leaves a signed transaction
    // pointing at content that was never stored.
    let metadataCid = '';

    tx.start({
      title: 'Create project',
      actionLabel: 'Publish project',
      facts: [
        { label: 'Title', value: title.trim() },
        { label: 'Tags', value: tags.length > 0 ? tags.join(', ') : 'None' },
        { label: 'Cover image', value: cover ? cover.name : 'None' },
        { label: 'Network', value: DEFAULT_CHAIN.label },
        { label: 'Registered to', value: wallet.account ?? '', mono: true },
      ],
      disclosures: [
        'Project details are stored on IPFS and referenced on chain. They are public and cannot be deleted.',
        'Details can be edited only while the project is a Draft. Once it moves to Funding they are permanent.',
      ],
      failureReassurance: 'The project was not created.',
      successSummary: 'Your project is registered and now visible in Discover.',
      steps: [
        {
          label: 'Store project details on IPFS',
          kind: 'sign',
          description: 'Uploads the title, description, tags and cover image. No wallet prompt.',
          run: async () => {
            const coverCid = cover ? await uploadFileToIpfs(cover) : undefined;
            metadataCid = await uploadJsonToIpfs(
              buildProjectMetadata({ title, description, tags, coverCid }),
              `openforge-project-${Date.now()}`,
            );
          },
        },
        {
          label: 'Register the project on chain',
          kind: 'send',
          description: 'Records the project against your wallet address.',
          run: (signer) => registerProject(signer, metadataCid),
        },
      ],
    });
  }

  if (!wallet.account) {
    return (
      <Page width="content">
        <PageHeader
          title="New project"
          description="Register a project on the OpenForge project registry."
        />
        <Divider />
        <div className="py-12">
          <Alert tone="info" title="Connect a wallet first">
            A project is registered against your wallet address, so you need to connect
            before creating one.
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
    <Page width="content">
      <PageHeader
        title="New project"
        description="Describe what you are building. Details are stored on IPFS and referenced on chain."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex flex-col gap-8 border-t border-line py-10"
      >
        <Input
          label="Title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          maxLength={PROJECT_LIMITS.titleMax}
          placeholder="Milestone escrow for open source work"
        />

        <Textarea
          label="Description"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
          maxLength={PROJECT_LIMITS.descriptionMax}
          showCount
          rows={7}
          placeholder="What are you building, and what would a contributor be helping with?"
        />

        <TagInput tags={tags} onChange={setTags} error={errors.tags} />

        <div className="flex flex-col gap-2">
          <span className="text-secondary font-medium text-fg">Cover image</span>

          {coverPreview ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-line">
              <Image src={coverPreview} alt="Cover preview" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => onPickCover(null)}
                aria-label="Remove cover image"
                className="absolute right-2 top-2 rounded-md bg-canvas/90 p-1.5 text-fg-secondary backdrop-blur transition-colors hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : (
            <label
              className={`flex aspect-[16/9] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors hover:border-line-strong hover:bg-subtle ${
                errors.cover ? 'border-danger-line' : 'border-line'
              }`}
            >
              <ImagePlus className="size-5 text-fg-muted" aria-hidden />
              <span className="text-secondary text-fg-secondary">Choose an image</span>
              <span className="text-meta text-fg-muted">JPEG, PNG, WebP or GIF, up to 5 MB</span>
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                className="sr-only"
                onChange={(event) => onPickCover(event.target.files?.[0] ?? null)}
              />
            </label>
          )}

          {errors.cover && (
            <p role="alert" className="text-meta text-danger-text">
              {errors.cover}
            </p>
          )}
        </div>

        {uploadError !== null && (
          <ErrorState error={uploadError} context="The project was not created" />
        )}

        <DisclosureNote>
          Creating a project costs a small network fee in {DEFAULT_CHAIN.nativeSymbol}. Your
          project starts as a Draft, and its details stay editable until you move it to
          Funding.
        </DisclosureNote>

        <Section divided={false} className="flex flex-wrap gap-3 py-0">
          <Button type="submit" variant="primary" size="lg">
            Review and publish
          </Button>
          <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </Section>
      </form>

      <TransactionFlow tx={tx} />
    </Page>
  );
}
