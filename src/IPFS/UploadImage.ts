export async function uploadImage(file: File): Promise<string> {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
      pinata_secret_api_key: import.meta.env.VITE_PINATA_API_SECRET
    },
    body: formData
  });

  if (!res.ok) {
    throw new Error("Image upload failed");
  }

  const data = await res.json();
  

  return data.IpfsHash; // CID
}
