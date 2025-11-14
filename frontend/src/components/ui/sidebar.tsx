import * as React from "react"
import { cn } from "../../lib/utils"

type SidebarContextValue = {
  isMobile: boolean
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = React.useState(false)
  const [openMobile, setOpenMobile] = React.useState(false)

  React.useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <SidebarContext.Provider value={{ isMobile, openMobile, setOpenMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within <SidebarProvider>")
  return ctx
}

export function Sidebar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isMobile, openMobile } = useSidebar()

  const base =
    "flex flex-col w-64 shrink-0 bg-[#0f1419] text-foreground data-[sidebar=sidebar]"
  const layout = isMobile
    ? openMobile
      ? "fixed inset-y-0 left-0 z-40"
      : "hidden"
    : "relative"

  return (
    <aside
      data-sidebar="sidebar"
      className={cn(base, layout, className)}
      {...props}
    />
  )
}

export function SidebarHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />
}

export function SidebarFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />
}

export function SidebarContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />
}

export function SidebarGroup(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />
}

export function SidebarGroupLabel(
  props: React.HTMLAttributes<HTMLDivElement>
) {
  return <div {...props} />
}

export function SidebarGroupContent(
  props: React.HTMLAttributes<HTMLDivElement>
) {
  return <div {...props} />
}

export function SidebarMenu(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />
}

export function SidebarMenuItem(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />
}

export function SidebarMenuButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
) {
  const { asChild, className, children, ...rest } = props
  if (asChild) {
    // Usamos un span contenedor si se pasa `asChild`
    return (
      <span className={cn("block", className)} {...(rest as any)}>
        {children}
      </span>
    )
  }
  return (
    <button className={cn("w-full text-left", className)} {...rest}>
      {children}
    </button>
  )
}

export function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isMobile, setOpenMobile } = useSidebar()
  if (!isMobile) return null
  return (
    <button
      className={cn("inline-flex items-center justify-center", className)}
      onClick={() => setOpenMobile(true)}
      {...props}
    />
  )
}
