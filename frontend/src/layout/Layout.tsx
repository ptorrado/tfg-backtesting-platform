// src/layout/Layout.tsx
import React from "react"
import { Link, useLocation } from "react-router-dom"
import { createPageUrl } from "../utils"
import { History, PlayCircle, BarChart3, Menu, X } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "../components/ui/sidebar"

const APP_NAME = "Backtest Lab"
const APP_TAGLINE = "Educational Backtesting Sandbox"

const navigationItems = [
  {
    title: "New Simulation",
    url: createPageUrl("Simulator"),
    icon: PlayCircle,
  },
  {
    title: "History",
    url: createPageUrl("History"),
    icon: History,
  },
]

function SidebarCloseButton() {
  const { isMobile, setOpenMobile } = useSidebar()

  if (!isMobile) return null

  return (
    <button
      onClick={() => setOpenMobile(false)}
      className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-gray-200 lg:hidden"
    >
      <X className="w-5 h-5" strokeWidth={2} />
    </button>
  )
}

interface LayoutProps {
  children: React.ReactNode
  currentPageName?: string
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: 0 0% 90%;
          --primary-foreground: 0 0% 10%;
          --sidebar-background: 15 20 25;
          --sidebar-foreground: 240 10% 80%;
          --sidebar-primary: 240 10% 90%;
          --sidebar-primary-foreground: 0 0% 10%;
          --sidebar-accent: 240 5% 20%;
          --sidebar-accent-foreground: 240 10% 90%;
          --sidebar-border: 240 5% 20%;
        }

        body {
          background: #0f1419;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
        }

        .glass-card {
          background: rgba(21, 26, 33, 0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .glass-sidebar {
          background: rgba(15, 20, 25, 0.98) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
        }

        [data-sidebar="sidebar"] {
          background: rgba(15, 20, 25, 0.98) !important;
        }

        [data-sidebar="sidebar"] * {
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
      `}</style>

      <div className="min-h-screen flex w-full bg-[#0f1419]">
        <Sidebar className="glass-sidebar border-r border-white/8 !bg-[#0f1419]">
          <SidebarCloseButton />

          <SidebarHeader className="border-b border-white/8 p-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5 text-slate-100" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-100 text-base">
                  {APP_NAME}
                </h2>
                <p className="text-xs text-gray-500">{APP_TAGLINE}</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2 mb-1">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`transition-all duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url
                            ? "bg-white/15 text-white border border-white/30"
                            : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                        }`}
                      >
                        <Link
                          to={item.url}
                          className="flex items-center gap-3 px-3 py-2.5"
                        >
                          <item.icon className="w-4 h-4" strokeWidth={2} />
                          <span className="font-medium text-sm">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-white/8 p-4">
            <div className="text-xs text-gray-500">
              <div className="flex items-center justify-between mb-1">
                <span>Version</span>
                <span className="text-gray-400">0.1.0</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-[#0f1419]">
          <header className="glass-card border-b border-white/5 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-white/10 p-2 rounded-xl transition-colors duration-200 text-gray-300 hover:text-gray-100">
                <Menu className="w-5 h-5" strokeWidth={2} />
              </SidebarTrigger>
              <h1 className="text-base font-semibold text-gray-100">
                {APP_NAME}
              </h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
