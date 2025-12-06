// src/api/algorithms.ts
import { API_BASE_URL } from "./config";

export type AlgoParam = {
  name: string;
  label: string;
  type: "int" | "float";
  min: number;
  max: number;
  step: number;
  default: number;
  description?: string | null;
};

export type AlgorithmInfo = {
  id: string;
  name: string;
  category: string;
  description: string;
  params: AlgoParam[];
};

export async function listAlgorithms(): Promise<AlgorithmInfo[]> {
  const res = await fetch(`${API_BASE_URL}/algorithms`);

  if (!res.ok) {
    throw new Error(`Failed to fetch algorithms: ${res.status}`);
  }

  return (await res.json()) as AlgorithmInfo[];
}
