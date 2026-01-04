// flows/createProfileFlow.ts

import { validateImage } from "../Validation/ValidateImage";
import { uploadImage } from "../IPFS/UploadImage";
import { buildProfileMetadata } from "../Format/Profile-data";
import { uploadMetadata } from "../IPFS/UploadMetaData";
import { getProfileRegistry } from "../contracts/getprofileRegistry";

export async function createProfileFlow({
  name,
  bio,
  skills,
  avatarFile
}: {
  name: string;
  bio: string;
  skills: string[];
  avatarFile?: File;
}) {
  // ---------- basic validation ----------
  if (!name || !bio || skills.length === 0) {
    throw new Error("Name, bio, and at least one skill are required");
  }

  // ---------- optional avatar ----------
  let avatarCID: string | undefined;

  if (avatarFile) {
    validateImage(avatarFile, "avatar");
    avatarCID = await uploadImage(avatarFile);
  }

  // ---------- build metadata ----------
  const metadata = buildProfileMetadata({
    name,
    bio,
    skills,
    avatarCID,
    isUpdate: false
  });

  // ---------- upload metadata ----------
  const metadataCID = await uploadMetadata(metadata);

  // ---------- blockchain call ----------
  const registry = await getProfileRegistry();

  const hasProfile = await registry.hasProfile(
    await registry.runner.getAddress()
  );

  if (hasProfile) {
    throw new Error("Profile already exists");
  }

  const tx = await registry.createProfile(metadataCID);
  await tx.wait();

  return metadataCID;
}
