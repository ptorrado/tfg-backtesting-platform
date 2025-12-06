// src/api/marketData.ts
import { API_BASE_URL } from "./config";

export type MarketCandle = {
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketDataParams = {
  asset: string;
  start_date: string;
  end_date: string;
};

export async function getMarketData(
  params: MarketDataParams
): Promise<MarketCandle[]> {
  const query = new URLSearchParams({
    asset: params.asset,
    start_date: params.start_date,
    end_date: params.end_date,
  });

  const res = await fetch(`${API_BASE_URL}/market-data?${query.toString()}`);

  if (res.status === 404) {
    // Sin datos -> el front genera serie sintética
    return [];
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch market data: ${res.status}`);
  }

  return (await res.json()) as MarketCandle[];
}
