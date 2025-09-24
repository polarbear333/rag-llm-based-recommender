// pages/api/scrape-image.ts
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Image scraping functionality removed. Keep this route for backwards compatibility.
  res.status(410).json({ error: 'Image scraping endpoint removed' });
}