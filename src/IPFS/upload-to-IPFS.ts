// pages/api/upload-to-ipfs.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { create } from 'ipfs-http-client';

const ipfs = create({ 
  host: 'ipfs.infura.io', 
  port: 5001, 
  protocol: 'https' 
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const metadata = req.body;
    const result = await ipfs.add(JSON.stringify(metadata));
    
    return res.status(200).json({ cid: result.path });
  } catch (error) {
    console.error('IPFS upload error:', error);
    return res.status(500).json({ error: 'Failed to upload to IPFS' });
  }
}