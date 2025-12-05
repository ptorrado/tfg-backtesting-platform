// frontend/src/api/algorithms.ts

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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function listAlgorithms(): Promise<AlgorithmInfo[]> {
  const res = await fetch(`${API_BASE_URL}/algorithms`);
  if (!res.ok) {
    throw new Error(`Failed to fetch algorithms: ${res.status}`);
  }
  return res.json();
}
