// src/layout/Layout.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "../utils";
import { History, PlayCircle, BarChart3, Menu, X } from "lucide-react";

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
} from "../components/ui/sidebar";

const APP_NAME = "Backtest Lab";
const APP_TAGLINE = "Educational Backtesting Sandbox";

const navigationItems = [
  { title: "New Simulation", url: createPageUrl("Simulator"), icon: PlayCircle },
  { title: "History", url: createPageUrl("History"), icon: History },
];

function SidebarCloseButton() {
  const { isMobile, setOpenMobile } = useSidebar();
  if (!isMobile) return null;

  return (
    <button
      onClick={() => setOpenMobile(false)}
      className="absolute top-4 right-4 p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground lg:hidden"
    >
      <X className="w-5 h-5" strokeWidth={2} />
    </button>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

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
          background: hsl(var(--background));
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
        }

        .glass-card {
          background: hsl(var(--card) / 0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid hsl(var(--border) / 0.5);
        }

        .glass-sidebar {
          background: hsl(var(--card) / 0.98) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid hsl(var(--border) / 0.5) !important;
        }

        [data-sidebar="sidebar"] {
          background: hsl(var(--card) / 0.98) !important;
        }

        [data-sidebar="sidebar"] * {
          border-color: hsl(var(--border) / 0.5) !important;
        }
      `}</style>

      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="glass-sidebar border-r border-border !bg-background sticky top-0 h-screen z-30">
          <SidebarCloseButton />

          <SidebarHeader className="border-b border-border p-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-base">
                  {APP_NAME}
                </h2>
                <p className="text-xs text-muted-foreground">{APP_TAGLINE}</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 mb-1">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`transition-all duration-200 rounded-xl mb-1 ${location.pathname === item.url
                          ? "bg-accent text-accent-foreground font-medium border border-border"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          }`}
                      >
                        <Link
                          to={item.url}
                          className="flex items-center gap-3 px-3 py-2.5"
                        >
                          <item.icon className="w-4 h-4" strokeWidth={2} />
                          <span className="text-sm">
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

          <SidebarFooter className="border-t border-border p-4 mt-auto">
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center justify-between mb-1">
                <span>Version</span>
                <span>0.1.0</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-background">
          <header className="glass-card border-b border-border px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-accent p-2 rounded-xl transition-colors duration-200 text-muted-foreground hover:text-foreground">
                <Menu className="w-5 h-5" strokeWidth={2} />
              </SidebarTrigger>
              <h1 className="text-base font-semibold text-foreground">
                {APP_NAME}
              </h1>
            </div>
          </header>
          <div className="flex-1 overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
