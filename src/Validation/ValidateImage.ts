export function validateImage(
  file: File,
  type: "avatar" | "project"
) {
  const MAX_SIZE_KB =
    type === "avatar" ? 512 : 2048;

  const ALLOWED_TYPES = [
    "image/png",
    "image/svg+xml"
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only PNG or SVG images are allowed");
  }

  const sizeKB = file.size / 1024;
  if (sizeKB > MAX_SIZE_KB) {
    throw new Error(
      `Image too large. Max allowed is ${MAX_SIZE_KB} KB`
    );
  }
}
