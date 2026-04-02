import { useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, useLocation, useNavigate, Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn('admin-sidebar-link block rounded-md px-3 py-2 text-sm', isActive && 'bg-muted font-medium')

const subNavClass = (active: boolean) =>
  cn('admin-sidebar-link block rounded-md px-3 py-1.5 text-sm', active && 'bg-muted font-medium')

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [auth, setAuth] = useState<'unknown' | 'in' | 'out'>('unknown')
  const [catNavOpen, setCatNavOpen] = useState(true)
  const onCategoriesSection =
    location.pathname === '/admin/categorias' || location.pathname === '/admin/subcategorias'
  const listSubActive = location.pathname === '/admin/categorias'
  const subNavItemActive = location.pathname === '/admin/subcategorias'

  useEffect(() => {
    if (onCategoriesSection) setCatNavOpen(true)
  }, [onCategoriesSection])

  useEffect(() => {
    void fetch('/api/admin/me', { credentials: 'include' }).then(async (r) => {
      try {
        if (!r.headers.get('content-type')?.includes('application/json')) {
          setAuth('out')
          return
        }
        const j = (await r.json()) as { ok?: boolean }
        setAuth(r.ok && j?.ok === true ? 'in' : 'out')
      } catch {
        setAuth('out')
      }
    })
  }, [location.pathname])

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    setAuth('out')
    void navigate('/admin', { replace: true })
  }

  if (auth === 'unknown') {
    return (
      <div
        className="admin-shell-loading flex min-h-[50vh] w-full flex-col md:flex-row"
        aria-busy="true"
      >
        <aside className="border-border flex w-full shrink-0 flex-col gap-4 border-b p-4 md:w-56 md:border-r md:border-b-0">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3 w-16" />
          <div className="mt-2 flex flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="mt-auto flex flex-col gap-2 border-t pt-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-4 p-4 md:p-8">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-64 w-full max-w-3xl" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-2/3 max-w-lg" />
        </main>
      </div>
    )
  }

  if (auth === 'out') {
    if (location.pathname !== '/admin') {
      return <Navigate to="/admin" replace />
    }
    return <Outlet />
  }

  if (location.pathname === '/admin') {
    return <Navigate to="/admin/obras" replace />
  }

  return (
    <div className="admin-shell flex min-h-[calc(100vh-0px)] w-full max-w-none flex-col md:flex-row">
      <aside className="border-border bg-card flex w-full shrink-0 flex-col border-b md:w-56 md:border-r md:border-b-0">
        <div className="border-border border-b px-4 py-4">
          <span className="text-base font-semibold">Victória Maria</span>
          <p className="text-muted-foreground text-xs">CMS</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-3">
          <NavLink to="/admin/obras" className={navClass} end>
            Obras
          </NavLink>
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              className={cn(
                'hover:bg-muted/80 flex w-full items-center justify-between gap-1 rounded-md px-3 py-2 text-left text-sm',
                onCategoriesSection && 'font-medium'
              )}
              onClick={() => setCatNavOpen((o) => !o)}
              aria-expanded={catNavOpen}
            >
              <span>Categorias</span>
              <ChevronDown
                className={cn('size-4 shrink-0 opacity-60 transition-transform', catNavOpen && 'rotate-180')}
                aria-hidden
              />
            </button>
            {catNavOpen ? (
              <div className="border-border ml-2 flex flex-col gap-0.5 border-l pl-2">
                <Link to="/admin/categorias" className={subNavClass(listSubActive)}>
                  Lista
                </Link>
                <Link to="/admin/subcategorias" className={subNavClass(subNavItemActive)}>
                  Subcategorias
                </Link>
              </div>
            ) : null}
          </div>
          <NavLink to="/admin/bio" className={navClass}>
            Bio
          </NavLink>
          <NavLink to="/admin/redes" className={navClass}>
            Redes sociais
          </NavLink>
          <NavLink to="/admin/curriculo" className={navClass}>
            Currículo
          </NavLink>
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">Tema</span>
            <ThemeToggle />
          </div>
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void logout()}>
            Sair
          </Button>
        </div>
      </aside>
      <main className="admin-main min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
