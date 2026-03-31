import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CountryFlag } from 'react-country-flags-lazyload'
import { ADMIN_LOCALE_OPTIONS, ADMIN_LOCALES } from '@/components/admin/AdminLocaleTabs'

function slugifyFromPtName(title: string) {
  return String(title || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function firstMissingLocaleLabel(names: Record<string, string>) {
  for (const opt of ADMIN_LOCALE_OPTIONS) {
    if (!String(names[opt.locale] ?? '').trim()) return opt.label
  }
  return null
}

type CatRow = {
  id: string
  slug: string
  sortOrder: number
  isActive: boolean
  translations: { locale: string; name: string }[]
}

function namesForLocales(translations: { locale: string; name: string }[]): {
  locale: string
  name: string
}[] {
  const m = new Map(translations.map((t) => [t.locale, t.name]))
  return ADMIN_LOCALES.map((locale) => ({ locale, name: m.get(locale) ?? '' }))
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CatRow[]>([])
  const [catDialog, setCatDialog] = useState<'new' | 'edit' | null>(null)
  const [editingCat, setEditingCat] = useState<CatRow | null>(null)
  const [catSlug, setCatSlug] = useState('')
  const [catSort, setCatSort] = useState(0)
  const [catActive, setCatActive] = useState(true)
  const [catNames, setCatNames] = useState<Record<string, string>>({})

  const loadCats = useCallback(async () => {
    const r = await fetch('/api/admin/categories', { credentials: 'include' })
    if (!r.ok) return
    const data = (await r.json()) as CatRow[]
    setCategories(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    void loadCats()
  }, [loadCats])

  const openNewCat = () => {
    setEditingCat(null)
    setCatSlug('')
    setCatSort(0)
    setCatActive(true)
    setCatNames(Object.fromEntries(ADMIN_LOCALES.map((l) => [l, ''])))
    setCatDialog('new')
  }

  const openEditCat = (c: CatRow) => {
    setEditingCat(c)
    setCatSlug(c.slug)
    setCatSort(c.sortOrder)
    setCatActive(c.isActive)
    const m = new Map(c.translations.map((t) => [t.locale, t.name]))
    setCatNames(Object.fromEntries(ADMIN_LOCALES.map((l) => [l, m.get(l) ?? ''])))
    setCatDialog('edit')
  }

  const saveCat = async () => {
    const missing = firstMissingLocaleLabel(catNames)
    if (missing) {
      toast.warning(`Preencha o nome (${missing}).`)
      return
    }
    const slugToSend =
      catDialog === 'new' ? slugifyFromPtName(catNames['pt-Br'] ?? '') : catSlug
    if (!slugToSend) {
      toast.warning('Indique o nome em Português para gerar o identificador da categoria.')
      return
    }
    const translations = ADMIN_LOCALES.map((locale) => ({
      locale,
      name: catNames[locale] ?? '',
    }))
    const body = {
      slug: slugToSend,
      sortOrder: catSort,
      isActive: catActive,
      translations,
    }
    const url =
      catDialog === 'edit' && editingCat
        ? `/api/admin/categories/${encodeURIComponent(editingCat.id)}`
        : '/api/admin/categories'
    const method = catDialog === 'edit' ? 'PUT' : 'POST'
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      toast.error((err as { error?: string }).error || 'Erro ao guardar.')
      return
    }
    toast.success(catDialog === 'edit' ? 'Categoria atualizada.' : 'Categoria criada.')
    setCatDialog(null)
    void loadCats()
  }

  const deleteCat = async (c: CatRow) => {
    if (!window.confirm('Eliminar categoria e subcategorias?')) return
    const r = await fetch(`/api/admin/categories/${encodeURIComponent(c.id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (r.ok) {
      toast.success('Eliminada.')
      void loadCats()
    } else {
      toast.error('Não foi possível eliminar.')
    }
  }

  return (
    <section className="page-content admin-page">
      <div className="admin-toolbar admin-toolbar--table">
        <h1 className="page-title admin-page-heading">Categorias</h1>
        <Button type="button" onClick={openNewCat}>
          Nova categoria
        </Button>
      </div>
      <div className="admin-table-wrap border-border bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <span className="inline-flex items-center gap-2">
                  <span className="locale-flag shrink-0" aria-hidden>
                    <CountryFlag countryCode="BR" />
                  </span>
                  Nome
                </span>
              </TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  {namesForLocales(c.translations).find((t) => t.locale === 'pt-Br')?.name || c.slug}
                </TableCell>
                <TableCell>{c.sortOrder}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditCat(c)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => void deleteCat(c)}
                    >
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={catDialog !== null} onOpenChange={(o) => !o && setCatDialog(null)}>
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>{catDialog === 'edit' ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {ADMIN_LOCALE_OPTIONS.map((opt) => (
              <div key={opt.locale} className="grid gap-2">
                <Label htmlFor={`cat-name-${opt.locale}`} className="inline-flex items-center gap-2">
                  <span className="locale-flag shrink-0" aria-hidden>
                    <CountryFlag countryCode={opt.countryCode} />
                  </span>
                  <span className="sr-only">{opt.label}</span>
                  Nome
                </Label>
                <Input
                  id={`cat-name-${opt.locale}`}
                  value={catNames[opt.locale] ?? ''}
                  onChange={(e) =>
                    setCatNames((s) => ({ ...s, [opt.locale]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="grid gap-2">
              <Label htmlFor="cat-sort">Ordem</Label>
              <Input
                id="cat-sort"
                type="number"
                value={catSort}
                onChange={(e) => setCatSort(Number(e.target.value) || 0)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={catActive}
                onChange={(e) => setCatActive(e.target.checked)}
                className="size-4 rounded border"
              />
              Ativa
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCatDialog(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveCat()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
