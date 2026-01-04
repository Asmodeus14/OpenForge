// metadata/buildProfile.ts
// metadata/buildProfile.ts
import type { ProfileMetadata } from "../contracts/ProfileRegistryABI";

export function buildProfileMetadata({
  name,
  bio,
  skills,
  avatarCID,
  isUpdate = false
}: {
  name: string;
  bio: string;
  skills: string[];
  avatarCID?: string;
  isUpdate?: boolean;
}): ProfileMetadata {
  const now = Date.now();

  return {
    type: "profile",
    version: "1.0",
    name,
    bio,
    skills,
    avatar: avatarCID
      ? { cid: avatarCID, type: "avatar" }
      : undefined,
    createdAt: isUpdate ? undefined! : now,
    updatedAt: isUpdate ? now : undefined
  };
}
