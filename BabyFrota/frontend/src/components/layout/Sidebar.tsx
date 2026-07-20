import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navGroups } from './nav-items'

const STORAGE_KEY = 'bf_sidebar_colapsada'

export function Sidebar() {
  const [colapsada, setColapsada] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, colapsada ? '1' : '0')
  }, [colapsada])

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex',
        colapsada ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center gap-2 overflow-hidden border-b border-sidebar-border px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground">
          BF
        </div>
        {!colapsada && <span className="truncate text-lg font-semibold">Baby Frota</span>}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-2 py-4">
        {navGroups.map((group) => (
          <div key={group.label ?? 'fixo'}>
            {group.label && !colapsada && (
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  title={colapsada ? item.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      colapsada && 'justify-center px-0',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                    )
                  }
                >
                  <item.icon className="size-4 shrink-0" />
                  {!colapsada && item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <button
          type="button"
          onClick={() => setColapsada((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          title={colapsada ? 'Expandir menu' : 'Recolher menu'}
        >
          {colapsada ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!colapsada && 'Recolher menu'}
        </button>
      </div>
    </aside>
  )
}
