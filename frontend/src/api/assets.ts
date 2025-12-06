// src/api/assets.ts
import { API_BASE_URL } from "./config";

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  asset_type: string;
}

export async function listAssets(): Promise<Asset[]> {
  const res = await fetch(`${API_BASE_URL}/assets`);

  if (!res.ok) {
    throw new Error("Failed to load assets");
  }

  return (await res.json()) as Asset[];
}
