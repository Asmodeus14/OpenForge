export async function uploadMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>
): Promise<string> {
  const res = await fetch(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
        pinata_secret_api_key: import.meta.env.VITE_PINATA_API_SECRET
      },
      body: JSON.stringify(metadata)
    }
  );

  if (!res.ok) {
    throw new Error("Metadata upload failed");
  }

  const data = await res.json();
  return data.IpfsHash;
}
