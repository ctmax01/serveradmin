import { useState } from 'react'
import { toast } from 'sonner'
import {
  Database,
  Users,
  Code,
  FileText,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useLocation, useNavigate, useRouterState } from '@tanstack/react-router'

const navItems = [
  { key: '/dbconn', icon: Database, label: 'Базы данных' },
  { key: '/users', icon: Users, label: 'Пользователи' },
  { key: '/dbsql', icon: Code, label: 'DB SQL' },
  { key: '/reports', icon: FileText, label: 'Reports' },
  { key: '/settings', icon: Settings, label: 'Settings' },
]

const AppSidebar = () => {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn')
    toast.success('Logged out successfully.')
    navigate({ to: '/login' })
  }

  const navBtn = (key: string, Icon: React.ElementType, label: string) => {
    const active = pathname === key
    return (
      <button
        onClick={() => navigate({ to: key })}
        className={cn(
          'flex items-center gap-2.5 rounded-md py-2 text-sm transition-colors',
          active && 'bg-white text-black',
          open ? 'w-[calc(100%-8px)] mx-1 px-2' : 'w-8 justify-center mx-auto',
        )}
      >
        <Icon className="size-4 shrink-0" />
        {open && (
          <span
            className={cn(
              'truncate transition-opacity duration-150',
              open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden',
            )}
          >
            {label}
          </span>
        )}
      </button>
    )
  }

  return (
    <aside
      className={cn(
        'flex flex-col shrink-0 bg-sidebar text-sidebar-foreground',
        'border-r border-sidebar-border overflow-hidden',
        'transition-[width] duration-200 ease-linear',
        open ? 'w-56' : 'w-12',
      )}
    >
      {/* Logo + toggle */}
      <div
        className={cn(
          'flex h-12 shrink-0 items-center border-b border-sidebar-border overflow-hidden',
          open ? 'gap-2 px-3' : 'justify-center',
        )}
      >
        {open && <span className="flex-1 font-semibold text-sm truncate">Admin Panel</span>}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-1">
        {navItems.map(({ key, icon: Icon, label }) =>
          open ? (
            <div key={key}>{navBtn(key, Icon, label)}</div>
          ) : (
            <Tooltip key={key}>
              <TooltipTrigger asChild>{navBtn(key, Icon, label)}</TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          ),
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 py-2 border-t border-sidebar-border">
        {open ? (
          <button
            onClick={handleLogout}
            className="flex w-[calc(100%-8px)] items-center gap-2.5 rounded-md mx-1 px-2 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            <span className="truncate">Выйти</span>
          </button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex w-8 items-center justify-center rounded-md mx-auto py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <LogOut className="size-4 shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Выйти</TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  )
}

export default AppSidebar
