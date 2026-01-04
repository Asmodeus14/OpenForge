// flows/updateProfileFlow.ts
import { validateImage } from "../Validation/ValidateImage";
import { uploadImage } from "../IPFS/UploadImage";
import { buildProfileMetadata } from "../Format/Profile-data";
import { uploadMetadata } from "../IPFS/UploadMetaData";
import { getProfileRegistry } from "../contracts/getprofileRegistry";

export async function updateProfileFlow({
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
  if (!name || !bio || skills.length === 0) {
    throw new Error("Missing required fields");
  }

  let avatarCID: string | undefined;

  if (avatarFile) {
    validateImage(avatarFile, "avatar");
    avatarCID = await uploadImage(avatarFile);
  }

  const metadata = buildProfileMetadata({
    name,
    bio,
    skills,
    avatarCID,
    isUpdate: true
  });

  const metadataCID = await uploadMetadata(metadata);

  const registry = await getProfileRegistry();
  const tx = await registry.updateProfile(metadataCID);
  await tx.wait();

  return metadataCID;
}