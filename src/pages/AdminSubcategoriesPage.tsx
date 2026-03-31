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

const selectClass =
  'border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

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

type SubAdminRow = {
  id: string
  categoryId: string
  categorySlug: string
  categoryNamePt: string
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

function categoryLabelPt(c: CatRow) {
  return (
    namesForLocales(c.translations).find((t) => t.locale === 'pt-Br')?.name || c.slug
  )
}

export function AdminSubcategoriesPage() {
  const [categories, setCategories] = useState<CatRow[]>([])
  const [rows, setRows] = useState<SubAdminRow[]>([])
  const [subDialog, setSubDialog] = useState<'new' | 'edit' | null>(null)
  const [editingSub, setEditingSub] = useState<SubAdminRow | null>(null)
  const [modalCategoryId, setModalCategoryId] = useState('')
  const [subSlug, setSubSlug] = useState('')
  const [subSort, setSubSort] = useState(0)
  const [subActive, setSubActive] = useState(true)
  const [subNames, setSubNames] = useState<Record<string, string>>({})

  const loadCategories = useCallback(async () => {
    const r = await fetch('/api/admin/categories', { credentials: 'include' })
    if (!r.ok) return
    const data = (await r.json()) as CatRow[]
    setCategories(Array.isArray(data) ? data : [])
  }, [])

  const loadSubs = useCallback(async () => {
    const r = await fetch('/api/admin/subcategories', { credentials: 'include' })
    if (!r.ok) return
    const data = (await r.json()) as SubAdminRow[]
    setRows(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    void loadCategories()
    void loadSubs()
  }, [loadCategories, loadSubs])

  const openNew = () => {
    setEditingSub(null)
    setModalCategoryId('')
    setSubSlug('')
    setSubSort(0)
    setSubActive(true)
    setSubNames(Object.fromEntries(ADMIN_LOCALES.map((l) => [l, ''])))
    setSubDialog('new')
  }

  const openEdit = (s: SubAdminRow) => {
    setEditingSub(s)
    setModalCategoryId(s.categoryId)
    setSubSlug(s.slug)
    setSubSort(s.sortOrder)
    setSubActive(s.isActive)
    const m = new Map(s.translations.map((t) => [t.locale, t.name]))
    setSubNames(Object.fromEntries(ADMIN_LOCALES.map((l) => [l, m.get(l) ?? ''])))
    setSubDialog('edit')
  }

  const saveSub = async () => {
    if (!modalCategoryId.trim()) {
      toast.warning('Selecione uma categoria.')
      return
    }
    const missing = firstMissingLocaleLabel(subNames)
    if (missing) {
      toast.warning(`Preencha o nome (${missing}).`)
      return
    }
    const slugToSend =
      subDialog === 'new' ? slugifyFromPtName(subNames['pt-Br'] ?? '') : subSlug
    if (!slugToSend) {
      toast.warning('Indique o nome em Português para gerar o identificador da subcategoria.')
      return
    }
    const translations = ADMIN_LOCALES.map((locale) => ({
      locale,
      name: subNames[locale] ?? '',
    }))
    const body = {
      categoryId: modalCategoryId,
      slug: slugToSend,
      sortOrder: subSort,
      isActive: subActive,
      translations,
    }
    const url =
      subDialog === 'edit' && editingSub
        ? `/api/admin/subcategories/${encodeURIComponent(editingSub.id)}`
        : '/api/admin/subcategories'
    const method = subDialog === 'edit' ? 'PUT' : 'POST'
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
    toast.success(subDialog === 'edit' ? 'Subcategoria atualizada.' : 'Subcategoria criada.')
    setSubDialog(null)
    void loadSubs()
  }

  const deleteSub = async (s: SubAdminRow) => {
    if (!window.confirm('Eliminar subcategoria?')) return
    const r = await fetch(`/api/admin/subcategories/${encodeURIComponent(s.id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (r.ok) {
      toast.success('Eliminada.')
      void loadSubs()
    } else {
      toast.error('Não foi possível eliminar.')
    }
  }

  return (
    <section className="page-content admin-page">
      <div className="admin-toolbar admin-toolbar--table">
        <h1 className="page-title admin-page-heading">Subcategorias</h1>
        <Button type="button" onClick={openNew} disabled={categories.length === 0}>
          Nova subcategoria
        </Button>
      </div>
      {categories.length === 0 ? (
        <p className="text-muted-foreground mb-3 text-sm">
          Crie primeiro pelo menos uma categoria em Lista → Categorias.
        </p>
      ) : null}
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
              <TableHead>Categoria vinculada</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                  Nenhuma subcategoria. Use «Nova subcategoria» e escolha a categoria no modal.
                </TableCell>
              </TableRow>
            ) : null}
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  {namesForLocales(s.translations).find((t) => t.locale === 'pt-Br')?.name ||
                    s.slug}
                </TableCell>
                <TableCell>{s.categoryNamePt}</TableCell>
                <TableCell>{s.sortOrder}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(s)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => void deleteSub(s)}
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

      <Dialog open={subDialog !== null} onOpenChange={(o) => !o && setSubDialog(null)}>
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>{subDialog === 'edit' ? 'Editar subcategoria' : 'Nova subcategoria'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sub-modal-category">Categoria</Label>
              <select
                id="sub-modal-category"
                className={selectClass}
                value={modalCategoryId}
                onChange={(e) => setModalCategoryId(e.target.value)}
                disabled={categories.length === 0}
              >
                <option value="">Selecione a categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {categoryLabelPt(c)}
                  </option>
                ))}
              </select>
            </div>
            {ADMIN_LOCALE_OPTIONS.map((opt) => (
              <div key={opt.locale} className="grid gap-2">
                <Label htmlFor={`sub-modal-name-${opt.locale}`} className="inline-flex items-center gap-2">
                  <span className="locale-flag shrink-0" aria-hidden>
                    <CountryFlag countryCode={opt.countryCode} />
                  </span>
                  <span className="sr-only">{opt.label}</span>
                  Nome
                </Label>
                <Input
                  id={`sub-modal-name-${opt.locale}`}
                  value={subNames[opt.locale] ?? ''}
                  onChange={(e) =>
                    setSubNames((prev) => ({ ...prev, [opt.locale]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="grid gap-2">
              <Label htmlFor="sub-modal-sort">Ordem</Label>
              <Input
                id="sub-modal-sort"
                type="number"
                value={subSort}
                onChange={(e) => setSubSort(Number(e.target.value) || 0)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={subActive}
                onChange={(e) => setSubActive(e.target.checked)}
                className="size-4 rounded border"
              />
              Ativa
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSubDialog(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveSub()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
