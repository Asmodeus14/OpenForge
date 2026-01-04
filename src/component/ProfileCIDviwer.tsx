import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getProfileFlow } from "../Flows/GetProfile";

export default function ProfileCIDViewer() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

  useEffect(() => {
    detectWalletAndFetch();
  }, []);

  async function detectWalletAndFetch() {
    if (!window.ethereum) {
      setError("Wallet not found");
      return;
    }

    try {
      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWallet(address);

      // 🔗 Uses your existing flow
      const profileCid = await getProfileFlow(address);

      if (!profileCid) {
        setCid(null);
        return;
      }

      setCid(profileCid);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border p-4 max-w-md">
      <h3 className="font-semibold mb-3">Profile On-Chain Info</h3>

      {wallet && (
        <p className="text-sm text-gray-700 mb-2">
          <strong>Wallet:</strong>{" "}
          {wallet.slice(0, 6)}...{wallet.slice(-4)}
        </p>
      )}

      {loading && (
        <p className="text-sm text-gray-500">Loading profile…</p>
      )}

      {!loading && cid && (
        <p className="text-sm">
          <strong>Profile CID:</strong>{" "}
          <a
            href={`${IPFS_GATEWAY}${cid}`}
            target="_blank"
            rel="noreferrer"
            className="text-pink-600 underline"
          >
            View Metadata
          </a>
        </p>
      )}

      {!loading && wallet && !cid && (
        <p className="text-sm text-gray-500">
          No profile found for this wallet
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
