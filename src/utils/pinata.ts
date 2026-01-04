const PINATA_API = "https://api.pinata.cloud/pinning";

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET;

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  throw new Error("Pinata API key/secret missing");
}

// ---------------- JSON upload ----------------
export async function uploadJSONToPinata(data: object): Promise<string> {
  const res = await fetch(`${PINATA_API}/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata JSON upload failed: ${err}`);
  }

  const json = await res.json();
  return json.IpfsHash;
}

// ---------------- File upload ----------------
export async function uploadFileToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${PINATA_API}/pinFileToIPFS`, {
    method: "POST",
    headers: {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_API_SECRET
    },
    body: formData
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata file upload failed: ${err}`);
  }

  const json = await res.json();
  return json.IpfsHash;
}
