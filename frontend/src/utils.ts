const routes = {
  Simulator: "/simulator",
  Results: "/results",
  History: "/history",
} as const

export type PageName = keyof typeof routes

export function createPageUrl(page: PageName) {
  return routes[page]
}
