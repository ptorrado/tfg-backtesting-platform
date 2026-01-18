// src/utils.ts
const routes = {
  Simulator: "/simulator",
  Results: "/results",
  History: "/history",
} as const;

export type PageName = keyof typeof routes;

export function createPageUrl(page: PageName) {
  return routes[page];
}

export function formatDate(date: string | number | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);

  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}
