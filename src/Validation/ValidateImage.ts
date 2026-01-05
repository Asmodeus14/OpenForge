export function validateImage(file: File) {
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("Image too large. Max allowed size is 5 MB");
  }
}
