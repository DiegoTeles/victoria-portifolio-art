import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { toast } from 'react-toastify'
import { upload } from '@vercel/blob/client'
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ArtworkLazyImage } from '@/components/ArtworkLazyImage'
import { ArtworkDateField } from '@/components/admin/ArtworkDateField'
import { ADMIN_LOCALE_OPTIONS } from '@/components/admin/AdminLocaleTabs'
import { CountryFlag } from 'react-country-flags-lazyload'
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { Tooltip } from 'react-tooltip'
import type {
  Artwork,
  ArtworkCategoryAssignment,
  GroupDisplayType,
  LocalizedText,
} from '../data/artworks'
import type { Locale } from '../data/artworks'
import { getLocalized } from '../data/artworks'
import { cn } from '@/lib/utils'
import { getArtworkImageSrc } from '@/lib/artworkImageUrl'
import { measureMainMediaFile } from '@/utils/measureMediaFile'

const selectTriggerClass =
  'border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

type GroupDisplayChoice = {
  value: GroupDisplayType
  title: string
  hint: string
}

const GROUP_DISPLAY_CHOICES: GroupDisplayChoice[] = [
  {
    value: 'single-caption',
    title: 'Fileira com legenda única',
    hint: 'Imagens em linha; uma legenda comum abaixo de todas.',
  },
  {
    value: 'per-image-caption',
    title: 'Legenda por imagem',
    hint: 'Cada imagem com a sua própria legenda.',
  },
  {
    value: 'caption-in-grid',
    title: 'Grelha com célula de texto',
    hint: 'Para 5 ou 6 imagens; o texto fica numa célula da grelha.',
  },
  {
    value: 'asymmetric-5',
    title: 'Mosaico assimétrico',
    hint: 'Apenas com 5 imagens; layout em blocos desalinhados.',
  },
]

function groupDisplayAllowedForCount(n: number, value: GroupDisplayType): boolean {
  if (n < 2) return false
  if (value === 'asymmetric-5') return n === 5
  if (value === 'caption-in-grid') return n === 5 || n === 6
  if (n > 6) {
    return value === 'single-caption' || value === 'per-image-caption'
  }
  return true
}

function groupDisplayChoicesForCount(n: number): GroupDisplayChoice[] {
  return GROUP_DISPLAY_CHOICES.filter((c) => groupDisplayAllowedForCount(n, c.value))
}

function resolveGroupDisplay(
  n: number,
  current: GroupDisplayType | undefined
): GroupDisplayType | undefined {
  const opts = groupDisplayChoicesForCount(n)
  if (!opts.length) return undefined
  if (current && opts.some((o) => o.value === current)) return current
  return opts[0].value
}

function emptyLocales(): LocalizedText {
  return { 'pt-Br': '', en: '', fr: '', it: '', de: '' }
}

function padExtraDescriptions(urls: string[], descs: LocalizedText[]): LocalizedText[] {
  return urls.map((_, i) => ({
    'pt-Br': descs[i]?.['pt-Br'] ?? '',
    en: descs[i]?.en ?? '',
    fr: descs[i]?.fr ?? '',
    it: descs[i]?.it ?? '',
    de: descs[i]?.de ?? '',
  }))
}

function alignExtraResolutionsForSave(
  urls: string[],
  list: (Artwork['resolution'] | undefined | null)[]
): (Artwork['resolution'] | null)[] {
  return urls.map((_, i) => {
    const r = list[i]
    if (r && r.width > 0 && r.height > 0) return r
    return null
  })
}

function alignExtraMediaBytesForSave(
  urls: string[],
  list: (number | undefined | null)[]
): (number | null)[] {
  return urls.map((_, i) => {
    const b = list[i]
    if (b != null && Number.isFinite(Number(b))) return Math.max(0, Math.floor(Number(b)))
    return null
  })
}

function slugId(title: string) {
  const base = title
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || 'obra'}-${Date.now()}`
}

const emptyForm = (): Partial<Artwork> & { order_index: number } => ({
  id: '',
  order_index: 1,
  title: '',
  date: new Date().toISOString().slice(0, 10),
  description: { 'pt-Br': '', en: '', fr: '', it: '', de: '' },
  captionMedium: { 'pt-Br': '', en: '', fr: '', it: '', de: '' },
  physicalDimensions: { 'pt-Br': '', en: '', fr: '', it: '', de: '' },
  image: '',
  video: '',
  group: null,
  groupDisplay: undefined,
  types: ['painting'],
  extra_images: [],
  extra_descriptions: [],
  extraTitles: [],
  extraCaptionMedia: [],
  extraPhysicalDimensions: [],
  extraResolutions: [],
  extraMediaBytes: [],
})

type CreateDraft = {
  title: string
  date: string
  description: LocalizedText
  captionMedium: LocalizedText
  physicalDimensions: LocalizedText
  image: string
  resolution?: Artwork['resolution']
  mainMediaBytes?: number
  hasGroup: boolean
  group: string
  groupDisplay: GroupDisplayType | undefined
  extra_images: string[]
  extra_descriptions: LocalizedText[]
  extraTitles: LocalizedText[]
  extraCaptionMedia: LocalizedText[]
  extraPhysicalDimensions: LocalizedText[]
  extraResolutions: (Artwork['resolution'] | undefined)[]
  extraMediaBytes: (number | undefined)[]
}

const emptyCreate = (): CreateDraft => ({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  description: { 'pt-Br': '', en: '', fr: '', it: '', de: '' },
  captionMedium: { 'pt-Br': '', en: '', fr: '', it: '', de: '' },
  physicalDimensions: { 'pt-Br': '', en: '', fr: '', it: '', de: '' },
  image: '',
  resolution: undefined,
  mainMediaBytes: undefined,
  hasGroup: false,
  group: '',
  groupDisplay: undefined,
  extra_images: [],
  extra_descriptions: [],
  extraTitles: [],
  extraCaptionMedia: [],
  extraPhysicalDimensions: [],
  extraResolutions: [],
  extraMediaBytes: [],
})

type PendingExtra = { id: string; preview: string; name: string }

function revokePendingList(list: PendingExtra[]) {
  for (const p of list) {
    URL.revokeObjectURL(p.preview)
  }
}

function formatResolutionObject(r: Artwork['resolution'] | null | undefined): string {
  if (!r?.width || !r?.height) return '—'
  const mp =
    r.megapixels != null && Number.isFinite(r.megapixels)
      ? ` (${r.megapixels} MP)`
      : ''
  return `${r.width}×${r.height}${mp}`
}

function formatResolution(a: Artwork): string {
  return formatResolutionObject(a.resolution)
}

const ADMIN_TABLE_COL_COUNT = 11

const ROW_ACTIONS_TOOLTIP_DELAY_SHOW = 400
const ROW_ACTIONS_TOOLTIP_DELAY_HIDE = 150

function artworkHasMultipleImages(a: Artwork): boolean {
  return (a.extra_images?.length ?? 0) > 0
}

function groupColumnLabel(a: Artwork): string {
  const n = 1 + (a.extra_images?.length ?? 0)
  const g = a.group?.trim()
  if ((a.extra_images?.length ?? 0) === 0) return g || '—'
  return g || `${n} imagens`
}

function artworkMediaFileCount(a: Artwork): number {
  const main = a.image?.trim() || a.video?.trim() ? 1 : 0
  return main + (a.extra_images?.length ?? 0)
}

type AdminGroupImageRow = {
  key: string
  imageUrl: string
  isVideo: boolean
  imageTitle: string
  legenda: string
  year: string
  dimensions: string
  resolution: string
}

function rowTitleForLocale(
  mainTitle: string,
  extraLocales: LocalizedText | undefined,
  loc: Locale
): string {
  const fromExtra = getLocalized(extraLocales, loc).trim()
  if (fromExtra) return fromExtra
  const t = mainTitle.trim()
  return t || '—'
}

function adminLegendaSubRowExtra(a: Artwork, index: number, loc: Locale): string {
  const xcm = a.extraCaptionMedia ?? []
  const eds = a.extra_descriptions ?? []
  const m = getLocalized(xcm[index], loc).trim()
  if (m) return m
  const d = getLocalized(eds[index], loc).trim()
  return d || '—'
}

function buildAdminGroupImageRows(a: Artwork): AdminGroupImageRow[] {
  const rows: AdminGroupImageRow[] = []
  const extras = a.extra_images ?? []
  const loc: Locale = 'pt-Br'
  const year = a.date.slice(0, 4)
  const xt = a.extraTitles ?? []
  const xpd = a.extraPhysicalDimensions ?? []
  const xr = a.extraResolutions ?? []
  if (a.image || a.video) {
    rows.push({
      key: `${a.id}__main`,
      imageUrl: (a.image || a.video) as string,
      isVideo: Boolean(a.video && !a.image),
      imageTitle: a.title.trim() || '—',
      legenda: adminMediumColumn(a),
      year,
      dimensions: getLocalized(a.physicalDimensions, loc).trim() || '—',
      resolution: formatResolution(a),
    })
  }
  for (let i = 0; i < extras.length; i++) {
    const imageUrl = extras[i]!
    rows.push({
      key: `${a.id}__extra_${i}`,
      imageUrl,
      isVideo: false,
      imageTitle: rowTitleForLocale(a.title, xt[i], loc),
      legenda: adminLegendaSubRowExtra(a, i, loc),
      year,
      dimensions: getLocalized(xpd[i], loc).trim() || '—',
      resolution: formatResolutionObject(xr[i]),
    })
  }
  return rows
}

function formatCategorySubColumns(
  a: Artwork,
  categories: AdminCategoryRow[],
  subsCache: Record<string, AdminSubRow[]>
): { cat: string; sub: string } {
  const assigns = a.categoryAssignments ?? []
  if (!assigns.length) return { cat: '—', sub: '—' }
  const catParts: string[] = []
  const subParts: string[] = []
  for (const as of assigns) {
    const c = categories.find((x) => x.id === as.categoryId)
    catParts.push(c ? catLabel(c) : as.categoryId || '—')
    if (!as.subcategoryId) {
      subParts.push('—')
    } else {
      const subs = subsCache[as.categoryId] ?? []
      const s = subs.find((x) => x.id === as.subcategoryId)
      subParts.push(s ? subLabel(s) : as.subcategoryId)
    }
  }
  return { cat: catParts.join('; '), sub: subParts.join('; ') }
}

function adminMediumColumn(a: Artwork): string {
  const m = getLocalized(a.captionMedium, 'pt-Br').trim()
  if (m) return m
  return getLocalized(a.description, 'pt-Br').trim() || '—'
}

function adminDimensionsColumn(a: Artwork): string {
  const d = getLocalized(a.physicalDimensions, 'pt-Br').trim()
  return d || '—'
}

type AdminCategoryRow = {
  id: string
  slug: string
  translations: { locale: string; name: string }[]
}

type AdminSubRow = {
  id: string
  categoryId: string
  slug: string
  translations: { locale: string; name: string }[]
}

function catLabel(c: AdminCategoryRow) {
  return c.translations.find((t) => t.locale === 'pt-Br')?.name || c.slug
}

function subLabel(s: AdminSubRow) {
  return s.translations.find((t) => t.locale === 'pt-Br')?.name || s.slug
}

function GroupDisplayRulesCard({ imageCount }: { imageCount: number }) {
  return (
    <div className="bg-muted/50 border-border rounded-md border px-3 py-2 text-xs">
      <p className="text-foreground mb-2 font-medium">Regras dos modos (galeria pública)</p>
      <ul className="text-muted-foreground list-inside list-disc space-y-1">
        <li>Mínimo 2 imagens no total (principal + extras) para escolher um modo.</li>
        <li>Grelha com célula de texto: só com 5 ou 6 imagens no total.</li>
        <li>Mosaico assimétrico: só com exatamente 5 imagens no total.</li>
        <li>Mais de 6 imagens: apenas legenda única ou legenda por imagem.</li>
      </ul>
      <p className="text-muted-foreground mt-2 border-border border-t pt-2">
        Total neste grupo:{' '}
        <span className="text-foreground font-semibold tabular-nums">{imageCount}</span> imagem(ns)
        (principal + extras).
      </p>
    </div>
  )
}

function GroupDisplayModeRadios({
  choices,
  resolved,
  onPick,
  radioName,
}: {
  choices: GroupDisplayChoice[]
  resolved: GroupDisplayType | undefined
  onPick: (v: GroupDisplayType) => void
  radioName: string
}) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">Modo de exibição na galeria</legend>
      <div className="grid gap-3" role="radiogroup" aria-label="Modo de exibição na galeria">
        {choices.map((opt) => (
          <label
            key={opt.value}
            className="border-input has-[:checked]:border-primary flex cursor-pointer gap-4 rounded-md border p-3 has-[:checked]:bg-accent/40"
          >
            <input
              type="radio"
              name={radioName}
              className="mt-1 size-4 shrink-0"
              checked={resolved === opt.value}
              onChange={() => onPick(opt.value)}
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{opt.title}</span>
              <span className="text-muted-foreground block text-xs">{opt.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function AdminArtworksPage() {
  const titleId = useId()
  const rowActionsTooltipId = useId()
  const [list, setList] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createDraft, setCreateDraft] = useState<CreateDraft>(emptyCreate())
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [editHasGroup, setEditHasGroup] = useState(false)
  const [editCaptionLocale, setEditCaptionLocale] = useState<Locale>('pt-Br')
  const [createCaptionLocale, setCreateCaptionLocale] = useState<Locale>('pt-Br')
  const [createPendingExtras, setCreatePendingExtras] = useState<PendingExtra[]>([])
  const [editPendingExtras, setEditPendingExtras] = useState<PendingExtra[]>([])
  const [createMainUploading, setCreateMainUploading] = useState(false)
  const [editMainUploading, setEditMainUploading] = useState(false)
  const [createCarouselIndex, setCreateCarouselIndex] = useState(0)
  const [editCarouselIndex, setEditCarouselIndex] = useState(0)
  const [createTouchX, setCreateTouchX] = useState<number | null>(null)
  const [editTouchX, setEditTouchX] = useState<number | null>(null)
  const [adminCategories, setAdminCategories] = useState<AdminCategoryRow[]>([])
  const [subsCache, setSubsCache] = useState<Record<string, AdminSubRow[]>>({})
  const [createCategoryAssignments, setCreateCategoryAssignments] = useState<ArtworkCategoryAssignment[]>([])
  const [editCategoryAssignments, setEditCategoryAssignments] = useState<ArtworkCategoryAssignment[]>([])
  const [openGroupAccordions, setOpenGroupAccordions] = useState<Record<string, boolean>>({})
  const [deleteTarget, setDeleteTarget] = useState<Artwork | null>(null)
  const [deletePending, setDeletePending] = useState(false)

  const refreshList = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/artworks', { credentials: 'include', cache: 'no-store' })
      if (r.ok) {
        const data = (await r.json()) as Artwork[]
        setList(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshList()
  }, [refreshList])

  useEffect(() => {
    void fetch('/api/admin/categories', { credentials: 'include' }).then(async (r) => {
      if (!r.ok) return
      const data = (await r.json()) as AdminCategoryRow[]
      setAdminCategories(Array.isArray(data) ? data : [])
    })
  }, [])

  const ensureSubs = useCallback(async (categoryId: string) => {
    if (subsCache[categoryId] !== undefined) return
    const r = await fetch(
      `/api/admin/subcategories?categoryId=${encodeURIComponent(categoryId)}`,
      { credentials: 'include' }
    )
    if (!r.ok) return
    const data = (await r.json()) as AdminSubRow[]
    setSubsCache((prev) => ({ ...prev, [categoryId]: Array.isArray(data) ? data : [] }))
  }, [subsCache])

  useEffect(() => {
    const ids = new Set<string>()
    for (const art of list) {
      for (const row of art.categoryAssignments ?? []) {
        if (row.categoryId) ids.add(row.categoryId)
      }
    }
    for (const cid of ids) void ensureSubs(cid)
  }, [list, ensureSubs])

  const openCreate = () => {
    setCreatePendingExtras((prev) => {
      revokePendingList(prev)
      return []
    })
    setCreateDraft(emptyCreate())
    setCreateCaptionLocale('pt-Br')
    setCreateCategoryAssignments([])
    setCreateCarouselIndex(0)
    setCreateOpen(true)
  }

  const closeCreate = () => {
    setCreatePendingExtras((prev) => {
      revokePendingList(prev)
      return []
    })
    setCreateOpen(false)
    setCreateCarouselIndex(0)
  }

  const uploadFile = async (file: File, target: 'create' | 'edit') => {
    const tid = toast.loading('A enviar…')
    if (target === 'create') setCreateMainUploading(true)
    else setEditMainUploading(true)
    const pathname = `portfolio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    let measured: Awaited<ReturnType<typeof measureMainMediaFile>> = null
    try {
      measured = await measureMainMediaFile(file)
    } catch {
      measured = null
    }
    try {
      const blob = await upload(pathname, file, {
        access: 'private',
        handleUploadUrl: '/api/admin/blob',
        multipart: file.size > 4 * 1024 * 1024,
      })
      if (target === 'create') {
        setCreateDraft((d) => ({
          ...d,
          image: blob.url,
          resolution: measured ?? undefined,
          mainMediaBytes: file.size,
        }))
      } else {
        setForm((f) => ({
          ...f,
          image: blob.url,
          video: '',
          resolution: measured ?? undefined,
          mainMediaBytes: file.size,
        }))
      }
      toast.update(tid, {
        render: 'Imagem enviada.',
        type: 'success',
        isLoading: false,
        autoClose: 3500,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha no upload'
      toast.update(tid, { render: msg, type: 'error', isLoading: false, autoClose: 6000 })
      throw e
    } finally {
      if (target === 'create') setCreateMainUploading(false)
      else setEditMainUploading(false)
    }
  }

  const uploadExtraGroupFile = async (file: File) => {
    let measured: Awaited<ReturnType<typeof measureMainMediaFile>> = null
    try {
      measured = await measureMainMediaFile(file)
    } catch {
      measured = null
    }
    const pathname = `portfolio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const blob = await upload(pathname, file, {
      access: 'private',
      handleUploadUrl: '/api/admin/blob',
      multipart: file.size > 4 * 1024 * 1024,
    })
    return {
      url: blob.url,
      resolution: measured ?? undefined,
      bytes: file.size,
    }
  }

  const handleCreateGroupFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (!files?.length) return
    for (const file of files) {
      const id = crypto.randomUUID()
      const preview = URL.createObjectURL(file)
      setCreatePendingExtras((prev) => [...prev, { id, preview, name: file.name }])
      void (async () => {
        try {
          const { url, resolution, bytes } = await uploadExtraGroupFile(file)
          setCreateDraft((d) => ({
            ...d,
            extra_images: [...d.extra_images, url],
            extra_descriptions: [...d.extra_descriptions, emptyLocales()],
            extraTitles: [...d.extraTitles, emptyLocales()],
            extraCaptionMedia: [...d.extraCaptionMedia, emptyLocales()],
            extraPhysicalDimensions: [...d.extraPhysicalDimensions, emptyLocales()],
            extraResolutions: [...d.extraResolutions, resolution],
            extraMediaBytes: [...d.extraMediaBytes, bytes],
          }))
          toast.success('Imagem adicionada ao grupo.')
        } catch {
          toast.error('Falha ao enviar uma imagem.')
        } finally {
          URL.revokeObjectURL(preview)
          setCreatePendingExtras((prev) => prev.filter((x) => x.id !== id))
        }
      })()
    }
    e.target.value = ''
  }

  const handleEditGroupFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (!files?.length) return
    for (const file of files) {
      const id = crypto.randomUUID()
      const preview = URL.createObjectURL(file)
      setEditPendingExtras((prev) => [...prev, { id, preview, name: file.name }])
      void (async () => {
        try {
          const { url, resolution, bytes } = await uploadExtraGroupFile(file)
          setForm((f) => ({
            ...f,
            extra_images: [...(f.extra_images ?? []), url],
            extra_descriptions: [...(f.extra_descriptions ?? []), emptyLocales()],
            extraTitles: [...(f.extraTitles ?? []), emptyLocales()],
            extraCaptionMedia: [...(f.extraCaptionMedia ?? []), emptyLocales()],
            extraPhysicalDimensions: [...(f.extraPhysicalDimensions ?? []), emptyLocales()],
            extraResolutions: [...(f.extraResolutions ?? []), resolution],
            extraMediaBytes: [...(f.extraMediaBytes ?? []), bytes],
          }))
          toast.success('Imagem adicionada ao grupo.')
        } catch {
          toast.error('Falha ao enviar uma imagem.')
        } finally {
          URL.revokeObjectURL(preview)
          setEditPendingExtras((prev) => prev.filter((x) => x.id !== id))
        }
      })()
    }
    e.target.value = ''
  }

  const saveCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!createDraft.date) {
      toast.warning('Indique a data.')
      return
    }
    if (!createDraft.image) {
      toast.warning('Envie a imagem principal antes de salvar.')
      return
    }
    const id = slugId(createDraft.title)
    const nextOrder =
      list.length === 0
        ? 1
        : Math.max(...list.map((x) => x.order_index ?? 0), 0) + 1
    const createGroupImageCount =
      (createDraft.image ? 1 : 0) +
      createDraft.extra_images.length +
      createPendingExtras.length
    const resolvedCreateGroupDisplay =
      createDraft.hasGroup && createGroupImageCount >= 2
        ? resolveGroupDisplay(createGroupImageCount, createDraft.groupDisplay)
        : undefined
    setSaving(true)
    try {
      const ex = createDraft.hasGroup ? createDraft.extra_images : []
      const payload = {
        id,
        order_index: nextOrder,
        title: createDraft.title,
        date: createDraft.date,
        description: createDraft.description,
        captionMedium: createDraft.captionMedium,
        physicalDimensions: createDraft.physicalDimensions,
        image: createDraft.image || undefined,
        group: createDraft.hasGroup ? createDraft.group.trim() || null : null,
        groupDisplay: resolvedCreateGroupDisplay,
        types: ['painting'],
        extra_images: ex,
        extra_descriptions: createDraft.hasGroup
          ? padExtraDescriptions(ex, createDraft.extra_descriptions)
          : [],
        extraTitles: createDraft.hasGroup ? padExtraDescriptions(ex, createDraft.extraTitles) : [],
        extraCaptionMedia: createDraft.hasGroup
          ? padExtraDescriptions(ex, createDraft.extraCaptionMedia)
          : [],
        extraPhysicalDimensions: createDraft.hasGroup
          ? padExtraDescriptions(ex, createDraft.extraPhysicalDimensions)
          : [],
        extraResolutions: createDraft.hasGroup
          ? alignExtraResolutionsForSave(ex, createDraft.extraResolutions)
          : [],
        extraMediaBytes: createDraft.hasGroup
          ? alignExtraMediaBytesForSave(ex, createDraft.extraMediaBytes)
          : [],
        categoryAssignments: createCategoryAssignments.filter((x) => x.categoryId.trim()),
        resolution: createDraft.resolution,
        mainMediaBytes: createDraft.mainMediaBytes,
      }
      const r = await fetch('/api/admin/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        toast.error((err as { error?: string }).error || 'Erro ao salvar')
        return
      }
      const created = (await r.json().catch(() => null)) as Artwork | null
      if (created?.id) {
        setList((prev) => [...prev.filter((x) => x.id !== created.id), created])
      }
      toast.success('Obra criada.')
      closeCreate()
      setCreateDraft(emptyCreate())
      void refreshList()
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (a: Artwork) => {
    setEditingId(a.id)
    const idx = list.findIndex((x) => x.id === a.id)
    const ex = a.extra_images ?? []
    setForm({
      id: a.id,
      order_index: a.order_index ?? (idx >= 0 ? idx + 1 : 1),
      title: a.title,
      date: a.date,
      description: {
        'pt-Br': a.description?.['pt-Br'] ?? '',
        en: a.description?.en ?? '',
        fr: a.description?.fr ?? '',
        it: a.description?.it ?? '',
        de: a.description?.de ?? '',
      },
      captionMedium: {
        'pt-Br': a.captionMedium?.['pt-Br'] ?? '',
        en: a.captionMedium?.en ?? '',
        fr: a.captionMedium?.fr ?? '',
        it: a.captionMedium?.it ?? '',
        de: a.captionMedium?.de ?? '',
      },
      physicalDimensions: {
        'pt-Br': a.physicalDimensions?.['pt-Br'] ?? '',
        en: a.physicalDimensions?.en ?? '',
        fr: a.physicalDimensions?.fr ?? '',
        it: a.physicalDimensions?.it ?? '',
        de: a.physicalDimensions?.de ?? '',
      },
      image: a.image ?? '',
      video: a.video ?? '',
      group: a.group,
      groupDisplay: a.groupDisplay,
      types: [...a.types],
      info: a.info ?? undefined,
      resolution: a.resolution,
      mainMediaBytes: a.mainMediaBytes,
      extra_images: [...ex],
      extra_descriptions: padExtraDescriptions(ex, a.extra_descriptions ?? []),
      extraTitles: padExtraDescriptions(ex, a.extraTitles ?? []),
      extraCaptionMedia: padExtraDescriptions(ex, a.extraCaptionMedia ?? []),
      extraPhysicalDimensions: padExtraDescriptions(ex, a.extraPhysicalDimensions ?? []),
      extraResolutions: ex.map((_, i) => a.extraResolutions?.[i]),
      extraMediaBytes: ex.map((_, i) => a.extraMediaBytes?.[i]),
    })
    const assigns = (a.categoryAssignments ?? []).map((x) => ({
      categoryId: x.categoryId,
      subcategoryId: x.subcategoryId,
    }))
    setEditCategoryAssignments(assigns)
    for (const as of assigns) {
      if (as.categoryId) void ensureSubs(as.categoryId)
    }
    setEditHasGroup(Boolean(a.group) || (a.extra_images?.length ?? 0) > 0)
    setEditCaptionLocale('pt-Br')
    setEditCarouselIndex(0)
    setEditPendingExtras([])
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditPendingExtras((prev) => {
      revokePendingList(prev)
      return []
    })
    setEditOpen(false)
    setEditingId(null)
    setEditCarouselIndex(0)
  }

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.id?.trim() || !form.date) {
      toast.warning('Preencha a data.')
      return
    }
    setSaving(true)
    try {
      const ex = editHasGroup ? (form.extra_images ?? []) : []
      const payload = {
        id: form.id.trim(),
        order_index: form.order_index,
        title: form.title ?? '',
        date: form.date,
        description: form.description,
        captionMedium: form.captionMedium,
        physicalDimensions: form.physicalDimensions,
        image: form.image || undefined,
        video: form.video || undefined,
        group: editHasGroup ? (form.group?.trim() || null) : null,
        groupDisplay:
          editHasGroup && editGroupImageCount >= 2
            ? resolveGroupDisplay(editGroupImageCount, form.groupDisplay)
            : undefined,
        types: form.types,
        info: form.info,
        resolution: form.resolution,
        mainMediaBytes: form.mainMediaBytes,
        extra_images: ex,
        extra_descriptions: editHasGroup
          ? padExtraDescriptions(ex, form.extra_descriptions ?? [])
          : [],
        extraTitles: editHasGroup ? padExtraDescriptions(ex, form.extraTitles ?? []) : [],
        extraCaptionMedia: editHasGroup
          ? padExtraDescriptions(ex, form.extraCaptionMedia ?? [])
          : [],
        extraPhysicalDimensions: editHasGroup
          ? padExtraDescriptions(ex, form.extraPhysicalDimensions ?? [])
          : [],
        extraResolutions: editHasGroup
          ? alignExtraResolutionsForSave(ex, form.extraResolutions ?? [])
          : [],
        extraMediaBytes: editHasGroup
          ? alignExtraMediaBytesForSave(ex, form.extraMediaBytes ?? [])
          : [],
        categoryAssignments: editCategoryAssignments.filter((x) => x.categoryId.trim()),
      }
      const r = await fetch(`/api/admin/artworks/${encodeURIComponent(form.id.trim())}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        toast.error((err as { error?: string }).error || 'Erro ao salvar')
        return
      }
      const updated = (await r.json().catch(() => null)) as Artwork | null
      if (updated?.id) {
        setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      }
      toast.success('Guardado.')
      closeEdit()
      void refreshList()
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteArtwork = async () => {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeletePending(true)
    try {
      const r = await fetch(`/api/admin/artworks/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (r.ok) {
        setList((prev) => prev.filter((x) => x.id !== id))
        toast.success('Obra e mídias removidas.')
        if (editingId === id) closeEdit()
        setDeleteTarget(null)
        void refreshList()
      } else {
        const err = await r.json().catch(() => ({}))
        toast.error((err as { error?: string }).error || 'Erro ao apagar')
      }
    } finally {
      setDeletePending(false)
    }
  }

  const createMedia = [
    ...(createDraft.image ? [createDraft.image] : []),
    ...(createDraft.extra_images ?? []),
  ]
  const editMedia = [
    ...(form.image ? [form.image] : []),
    ...(form.extra_images ?? []),
  ]

  useEffect(() => {
    if (createCarouselIndex >= createMedia.length) setCreateCarouselIndex(0)
  }, [createCarouselIndex, createMedia.length])

  useEffect(() => {
    if (editCarouselIndex >= editMedia.length) setEditCarouselIndex(0)
  }, [editCarouselIndex, editMedia.length])

  const swipeThreshold = 40
  const createGroupImageCount =
    (createDraft.image ? 1 : 0) +
    createDraft.extra_images.length +
    createPendingExtras.length
  const editGroupImageCount =
    (form.image ? 1 : 0) + (form.extra_images?.length ?? 0) + editPendingExtras.length
  const createGroupDisplayChoices =
    createDraft.hasGroup && createGroupImageCount >= 2
      ? groupDisplayChoicesForCount(createGroupImageCount)
      : []
  const editGroupDisplayChoices =
    editHasGroup && editGroupImageCount >= 2
      ? groupDisplayChoicesForCount(editGroupImageCount)
      : []
  const createShowPerImageCaptions =
    createDraft.hasGroup &&
    createGroupImageCount >= 2 &&
    resolveGroupDisplay(createGroupImageCount, createDraft.groupDisplay) === 'per-image-caption'
  const editShowPerImageCaptions =
    editHasGroup &&
    editGroupImageCount >= 2 &&
    resolveGroupDisplay(editGroupImageCount, form.groupDisplay) === 'per-image-caption'
  const prevCreateMedia = () =>
    setCreateCarouselIndex((i) => (i === 0 ? createMedia.length - 1 : i - 1))
  const nextCreateMedia = () =>
    setCreateCarouselIndex((i) => (i === createMedia.length - 1 ? 0 : i + 1))
  const prevEditMedia = () =>
    setEditCarouselIndex((i) => (i === 0 ? editMedia.length - 1 : i - 1))
  const nextEditMedia = () =>
    setEditCarouselIndex((i) => (i === editMedia.length - 1 ? 0 : i + 1))

  useEffect(() => {
    if (!createDraft.hasGroup || createGroupImageCount < 2) return
    const next = resolveGroupDisplay(createGroupImageCount, createDraft.groupDisplay)
    setCreateDraft((d) => (d.groupDisplay === next ? d : { ...d, groupDisplay: next }))
  }, [createDraft.hasGroup, createGroupImageCount])

  useEffect(() => {
    if (!editOpen || !editHasGroup || editGroupImageCount < 2) return
    const next = resolveGroupDisplay(editGroupImageCount, form.groupDisplay)
    setForm((f) => (f.groupDisplay === next ? f : { ...f, groupDisplay: next }))
  }, [editOpen, editHasGroup, editGroupImageCount])

  return (
    <section className="page-content admin-page" aria-labelledby={titleId}>
      <div className="admin-toolbar admin-toolbar--table">
        <h1 className="page-title admin-page-heading" id={titleId}>
          Obras
        </h1>
        <div className="admin-toolbar-actions">
          <Button type="button" onClick={openCreate}>
            Adicionar nova
          </Button>
        </div>
      </div>
      <div className="admin-table-wrap border-border bg-card rounded-lg border [&_table]:border-collapse [&_td]:text-left [&_th]:text-left">
        {loading ? (
          <Table aria-busy="true" className="table-fixed">
            <colgroup>
              <col style={{ width: 40 }} />
              <col style={{ width: 72 }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: 52 }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: 92 }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-1" aria-label="Expandir grupo" />
                <TableHead className="w-[72px]">Imagem</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Legenda</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Subcategoria</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Dimensões</TableHead>
                <TableHead>Resolução</TableHead>
                <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell className="w-10 p-1">
                    <Skeleton className="mx-auto size-8 rounded-md" />
                  </TableCell>
                  <TableCell className="w-[72px] min-w-0">
                    <Skeleton className="size-14 shrink-0 rounded-md" />
                  </TableCell>
                  <TableCell className="min-w-0 whitespace-normal break-words">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="min-w-0 whitespace-normal break-words">
                    <Skeleton className="h-4 w-full max-w-full" />
                  </TableCell>
                  <TableCell className="min-w-0 whitespace-normal break-words">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="min-w-0 whitespace-normal break-words">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="min-w-0 whitespace-normal break-words">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="min-w-0 tabular-nums">
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
                  <TableCell className="min-w-0 whitespace-normal break-words">
                    <Skeleton className="h-4 w-full max-w-full" />
                  </TableCell>
                  <TableCell className="min-w-0 whitespace-normal break-words">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-1.5">
                      <Skeleton className="size-9 shrink-0 rounded-full" />
                      <Skeleton className="size-9 shrink-0 rounded-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
        {!loading && list.length > 0 ? (
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: 40 }} />
              <col style={{ width: 72 }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: 52 }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: 92 }} />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 px-1" aria-label="Expandir grupo" />
                <TableHead className="w-[72px]">Imagem</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Legenda</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Subcategoria</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Dimensões</TableHead>
                <TableHead>Resolução</TableHead>
                <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((a) => {
                const { cat, sub } = formatCategorySubColumns(a, adminCategories, subsCache)
                const multi = artworkHasMultipleImages(a)
                const expanded = openGroupAccordions[a.id] ?? false
                const groupRows = multi ? buildAdminGroupImageRows(a) : []
                return (
                  <Fragment key={a.id}>
                    <TableRow className={cn(multi && expanded && 'bg-muted/25')}>
                      <TableCell className="w-10 p-1 align-middle">
                        {multi ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground size-8 shrink-0"
                            aria-expanded={expanded}
                            aria-controls={`admin-group-detail-${a.id}`}
                            id={`admin-group-trigger-${a.id}`}
                            onClick={() =>
                              setOpenGroupAccordions((prev) => ({
                                ...prev,
                                [a.id]: !prev[a.id],
                              }))
                            }
                          >
                            <ChevronDown
                              className={cn('size-4 transition-transform', expanded && 'rotate-180')}
                              aria-hidden
                            />
                          </Button>
                        ) : null}
                      </TableCell>
                      <TableCell className="w-[72px] min-w-0">
                        {a.image ? (
                          <span className="relative block size-14 shrink-0">
                            <ArtworkLazyImage
                              className="border-border size-14 rounded object-cover"
                              skeletonClassName="pointer-events-none absolute inset-0 z-[1] size-full rounded-md"
                              src={getArtworkImageSrc(a)}
                              alt=""
                              width={56}
                              height={56}
                              loading="lazy"
                            />
                          </span>
                        ) : a.video ? (
                          <span className="text-muted-foreground flex size-14 items-center justify-center rounded border text-[10px]">
                            vídeo
                          </span>
                        ) : (
                          <span
                            className="border-border bg-muted block size-14 rounded border"
                            aria-hidden
                          />
                        )}
                      </TableCell>
                      <TableCell className="min-w-0 whitespace-normal break-words font-medium">
                        {a.title || a.id}
                      </TableCell>
                      <TableCell className="text-muted-foreground min-w-0 whitespace-normal break-words text-sm">
                        {adminMediumColumn(a)}
                      </TableCell>
                      <TableCell className="min-w-0 whitespace-normal break-words text-sm">
                        {groupColumnLabel(a)}
                      </TableCell>
                      <TableCell className="min-w-0 whitespace-normal break-words text-sm">
                        {cat}
                      </TableCell>
                      <TableCell className="min-w-0 whitespace-normal break-words text-sm">
                        {sub}
                      </TableCell>
                      <TableCell className="min-w-0 tabular-nums">{a.date.slice(0, 4)}</TableCell>
                      <TableCell className="text-muted-foreground min-w-0 whitespace-normal break-words text-sm">
                        {adminDimensionsColumn(a)}
                      </TableCell>
                      <TableCell className="min-w-0 whitespace-normal break-words text-sm">
                        {formatResolution(a)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right align-middle">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 shrink-0 rounded-full"
                            aria-label="Editar"
                            data-tooltip-id={rowActionsTooltipId}
                            data-tooltip-content="Editar"
                            onClick={() => openEdit(a)}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="size-9 shrink-0 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
                            aria-label="Excluir"
                            data-tooltip-id={rowActionsTooltipId}
                            data-tooltip-content="Excluir"
                            onClick={() => setDeleteTarget(a)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {multi && expanded ? (
                      <TableRow className="bg-muted/15 hover:bg-muted/15">
                        <TableCell colSpan={ADMIN_TABLE_COL_COUNT} className="p-0 sm:p-2">
                          <div
                            id={`admin-group-detail-${a.id}`}
                            role="region"
                            aria-labelledby={`admin-group-trigger-${a.id}`}
                            className="border-border mx-2 my-2 overflow-x-auto rounded-md border"
                          >
                            <Table className="table-fixed min-w-[640px]">
                              <colgroup>
                                <col style={{ width: 56 }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '32%' }} />
                                <col style={{ width: 56 }} />
                                <col style={{ width: '19%' }} />
                                <col style={{ width: '19%' }} />
                              </colgroup>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-14">Imagem</TableHead>
                                  <TableHead>Título</TableHead>
                                  <TableHead>Legenda</TableHead>
                                  <TableHead>Ano</TableHead>
                                  <TableHead>Dimensões</TableHead>
                                  <TableHead>Resolução</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {groupRows.map((row) => (
                                  <TableRow key={row.key}>
                                    <TableCell className="w-14 min-w-0 align-middle">
                                      {row.isVideo ? (
                                        <span className="text-muted-foreground flex size-12 items-center justify-center rounded border text-[9px]">
                                          vídeo
                                        </span>
                                      ) : (
                                        <span className="relative block size-12 shrink-0">
                                          <ArtworkLazyImage
                                            className="border-border size-12 rounded object-cover"
                                            skeletonClassName="pointer-events-none absolute inset-0 z-[1] size-full rounded-md"
                                            src={getArtworkImageSrc({ image: row.imageUrl })}
                                            alt=""
                                            width={48}
                                            height={48}
                                            loading="lazy"
                                          />
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell className="min-w-0 whitespace-normal break-words text-sm font-medium">
                                      {row.imageTitle}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground min-w-0 whitespace-normal break-words text-sm">
                                      {row.legenda}
                                    </TableCell>
                                    <TableCell className="min-w-0 whitespace-normal break-words text-sm tabular-nums">
                                      {row.year}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground min-w-0 whitespace-normal break-words text-sm">
                                      {row.dimensions}
                                    </TableCell>
                                    <TableCell className="min-w-0 whitespace-normal break-words text-sm">
                                      {row.resolution}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        ) : null}
        {!loading && list.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Nenhuma obra. Use «Adicionar nova».
          </p>
        ) : null}
      </div>

      <Tooltip
        id={rowActionsTooltipId}
        className="z-[200] rounded-md px-2 py-1 text-xs"
        delayShow={ROW_ACTIONS_TOOLTIP_DELAY_SHOW}
        delayHide={ROW_ACTIONS_TOOLTIP_DELAY_HIDE}
      />

      <Dialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open && !deletePending) setDeleteTarget(null)
        }}
      >
        <DialogContent showCloseButton={!deletePending} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir obra e todas as mídias</DialogTitle>
          </DialogHeader>
          {deleteTarget ? (
            <div className="text-muted-foreground space-y-3 text-sm">
              <p>Esta ação não pode ser desfeita.</p>
              <ul className="list-disc space-y-2 pl-4">
                <li>
                  Serão eliminados{' '}
                  <strong className="text-foreground">{artworkMediaFileCount(deleteTarget)}</strong> ficheiro(s)
                  de mídia (principal e extras) no armazenamento e na base de dados.
                </li>
                <li>
                  Grupo (chave):{' '}
                  <strong className="text-foreground">
                    {deleteTarget.group?.trim() || '— (nenhuma; só esta obra)'}
                  </strong>
                </li>
                <li>
                  Rótulo na tabela:{' '}
                  <strong className="text-foreground">{groupColumnLabel(deleteTarget)}</strong>
                </li>
                <li>
                  Título:{' '}
                  <strong className="text-foreground">
                    {deleteTarget.title?.trim() || deleteTarget.id}
                  </strong>
                </li>
              </ul>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deletePending}
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletePending}
              onClick={() => void confirmDeleteArtwork()}
            >
              {deletePending ? 'A apagar…' : 'Excluir tudo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) closeCreate()
        }}
      >
        <DialogContent
          className="max-h-[min(92vh,100dvh-1rem)] min-h-0 flex flex-col overflow-hidden sm:max-w-[92vw] lg:max-w-6xl"
          showCloseButton
        >
          <DialogHeader className="shrink-0">
            <DialogTitle>Nova obra</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:grid lg:grid-cols-[minmax(320px,46%)_1fr] lg:items-stretch">
            <div
              className="bg-muted/40 border-border relative max-h-[min(42vh,22rem)] min-h-[200px] shrink-0 overflow-hidden rounded-lg border lg:max-h-[min(78vh,calc(100dvh-14rem))] lg:min-h-0 lg:shrink"
              onTouchStart={(e) => setCreateTouchX(e.touches[0]?.clientX ?? null)}
              onTouchEnd={(e) => {
                const endX = e.changedTouches[0]?.clientX ?? null
                if (createMedia.length < 2 || createTouchX == null || endX == null) return
                const delta = endX - createTouchX
                if (delta > swipeThreshold) prevCreateMedia()
                if (delta < -swipeThreshold) nextCreateMedia()
                setCreateTouchX(null)
              }}
            >
              {createMedia.length > 0 ? (
                <>
                  <ArtworkLazyImage
                    src={getArtworkImageSrc({ image: createMedia[createCarouselIndex] })}
                    alt=""
                    className="h-full w-full object-cover"
                    skeletonClassName="pointer-events-none absolute inset-0 z-[1] size-full rounded-none"
                  />
                  {createMedia.length > 1 ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-1/2 left-3 z-[2] -translate-y-1/2"
                        onClick={prevCreateMedia}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-1/2 right-3 z-[2] -translate-y-1/2"
                        onClick={nextCreateMedia}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                      <div className="absolute right-2 bottom-2 z-[2] rounded bg-black/60 px-2 py-1 text-xs text-white">
                        {createCarouselIndex + 1}/{createMedia.length}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                  Sem imagem
                </div>
              )}
            </div>
            <form
              onSubmit={saveCreate}
              className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden lg:min-h-0"
            >
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
            <div className="grid gap-4">
              <Label htmlFor="create-title">Título</Label>
              <Input
                id="create-title"
                value={createDraft.title}
                onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid gap-4">
              <span className="text-sm leading-none font-medium">Legenda</span>
              <div
                role="tablist"
                aria-label="Idioma da legenda"
                className="flex flex-wrap gap-4"
              >
                {ADMIN_LOCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.locale}
                    type="button"
                    role="tab"
                    aria-selected={createCaptionLocale === opt.locale}
                    aria-label={opt.label}
                    onClick={() => setCreateCaptionLocale(opt.locale)}
                    className={cn(
                      'inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border transition-colors',
                      createCaptionLocale === opt.locale
                        ? 'border-primary bg-accent'
                        : 'border-transparent hover:bg-muted/80'
                    )}
                  >
                    <span className="locale-flag shrink-0" aria-hidden>
                      <CountryFlag countryCode={opt.countryCode} />
                    </span>
                  </button>
                ))}
              </div>
              <Textarea
                id={`create-desc-${createCaptionLocale}`}
                rows={4}
                value={createDraft.description?.[createCaptionLocale] ?? ''}
                onChange={(e) =>
                  setCreateDraft((d) => ({
                    ...d,
                    description: {
                      ...d.description,
                      [createCaptionLocale]: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="grid gap-4">
              <span className="text-sm leading-none font-medium">Meio / técnica</span>
              <Textarea
                rows={3}
                value={createDraft.captionMedium?.[createCaptionLocale] ?? ''}
                onChange={(e) =>
                  setCreateDraft((d) => ({
                    ...d,
                    captionMedium: {
                      ...d.captionMedium,
                      [createCaptionLocale]: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="grid gap-4">
              <span className="text-sm leading-none font-medium">Dimensões físicas</span>
              <Textarea
                rows={2}
                value={createDraft.physicalDimensions?.[createCaptionLocale] ?? ''}
                onChange={(e) =>
                  setCreateDraft((d) => ({
                    ...d,
                    physicalDimensions: {
                      ...d.physicalDimensions,
                      [createCaptionLocale]: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="grid gap-4">
              <Label htmlFor="create-date">Data</Label>
              <ArtworkDateField
                id="create-date"
                value={createDraft.date}
                onChange={(date) => setCreateDraft((d) => ({ ...d, date }))}
                required
              />
            </div>
            <div className="grid gap-4">
              <span className="text-sm font-medium">Categorias</span>
              {createCategoryAssignments.map((row, idx) => (
                <div key={idx} className="flex flex-wrap items-end gap-4">
                  <div className="grid min-w-[140px] flex-1 gap-4">
                    <Label>Categoria</Label>
                    <select
                      className={selectTriggerClass}
                      value={row.categoryId}
                      onChange={(e) => {
                        const categoryId = e.target.value
                        if (categoryId) void ensureSubs(categoryId)
                        setCreateCategoryAssignments((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { categoryId, subcategoryId: null } : r
                          )
                        )
                      }}
                    >
                      <option value="">—</option>
                      {adminCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {catLabel(c)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid min-w-[140px] flex-1 gap-4">
                    <Label>Subcategoria</Label>
                    <select
                      className={selectTriggerClass}
                      value={row.subcategoryId ?? ''}
                      disabled={!row.categoryId}
                      onChange={(e) => {
                        const v = e.target.value
                        setCreateCategoryAssignments((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, subcategoryId: v || null } : r
                          )
                        )
                      }}
                    >
                      <option value="">—</option>
                      {(row.categoryId ? subsCache[row.categoryId] ?? [] : []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {subLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCreateCategoryAssignments((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Remover
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-fit"
                onClick={() => {
                  const first = adminCategories[0]?.id ?? ''
                  if (first) void ensureSubs(first)
                  setCreateCategoryAssignments((prev) => [
                    ...prev,
                    { categoryId: first, subcategoryId: null },
                  ])
                }}
              >
                Adicionar categoria
              </Button>
            </div>
            <div className="grid gap-4">
              <Label htmlFor="create-file">Upload da imagem</Label>
              <Input
                id="create-file"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void uploadFile(f, 'create')
                }}
                className="h-auto min-h-9 cursor-pointer py-1.5 file:cursor-pointer"
              />
              {createDraft.image ? (
                <span className="text-muted-foreground text-xs">URL definida após envio.</span>
              ) : null}
            </div>
            <label className="flex cursor-pointer items-center gap-4 text-sm">
              <input
                type="checkbox"
                checked={createDraft.hasGroup}
                onChange={(e) => {
                  const checked = e.target.checked
                  if (!checked) {
                    setCreatePendingExtras((prev) => {
                      revokePendingList(prev)
                      return []
                    })
                  }
                  setCreateDraft((d) => ({
                    ...d,
                    hasGroup: checked,
                    group: checked ? d.group : '',
                    extra_images: checked ? d.extra_images : [],
                    extra_descriptions: checked ? d.extra_descriptions : [],
                    extraTitles: checked ? d.extraTitles : [],
                    extraCaptionMedia: checked ? d.extraCaptionMedia : [],
                    extraPhysicalDimensions: checked ? d.extraPhysicalDimensions : [],
                    extraResolutions: checked ? d.extraResolutions : [],
                    extraMediaBytes: checked ? d.extraMediaBytes : [],
                    groupDisplay: checked ? d.groupDisplay : undefined,
                  }))
                }}
                className="size-4 rounded border"
              />
              Possui grupo
            </label>
            {createDraft.hasGroup ? (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4">
                  <Label htmlFor="create-group">Nome do grupo</Label>
                  <Input
                    id="create-group"
                    value={createDraft.group}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, group: e.target.value }))}
                    placeholder="Identificador do grupo"
                  />
                </div>
                <div className="grid gap-4">
                  <span className="text-sm font-medium">Imagens do grupo</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => document.getElementById('create-extra-files')?.click()}
                  >
                    Inserir mais imagens
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    Pode escolher várias imagens de uma vez (Ctrl ou Shift ao clicar nos ficheiros).
                  </p>
                <input
                  id="create-extra-files"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="sr-only"
                  onChange={handleCreateGroupFiles}
                />
                {createPendingExtras.length > 0 || createDraft.extra_images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {createDraft.extra_images.map((url, idx) => (
                      <div key={url} className="flex min-w-0 flex-col gap-2">
                        <div className="group relative aspect-square overflow-hidden rounded-lg border">
                          <ArtworkLazyImage
                            src={getArtworkImageSrc({ image: url })}
                            alt=""
                            className="size-full object-cover"
                            skeletonClassName="pointer-events-none absolute inset-0 z-[1] size-full rounded-lg"
                          />
                          <div className="absolute inset-0 z-[2] flex items-start justify-end bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="shrink-0 text-xs"
                              onClick={() =>
                                setCreateDraft((d) => ({
                                  ...d,
                                  extra_images: d.extra_images.filter((_, i) => i !== idx),
                                  extra_descriptions: d.extra_descriptions.filter((_, i) => i !== idx),
                                  extraTitles: d.extraTitles.filter((_, i) => i !== idx),
                                  extraCaptionMedia: d.extraCaptionMedia.filter((_, i) => i !== idx),
                                  extraPhysicalDimensions: d.extraPhysicalDimensions.filter(
                                    (_, i) => i !== idx
                                  ),
                                  extraResolutions: d.extraResolutions.filter((_, i) => i !== idx),
                                  extraMediaBytes: d.extraMediaBytes.filter((_, i) => i !== idx),
                                }))
                              }
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                        {createShowPerImageCaptions ? (
                          <div className="flex min-w-0 flex-col gap-2">
                            <Input
                              className="text-sm"
                              placeholder="Título"
                              value={createDraft.extraTitles[idx]?.[createCaptionLocale] ?? ''}
                              onChange={(e) =>
                                setCreateDraft((d) => {
                                  const urls = d.extra_images
                                  const next = padExtraDescriptions(urls, d.extraTitles)
                                  const cur = { ...(next[idx] ?? emptyLocales()) }
                                  cur[createCaptionLocale] = e.target.value
                                  next[idx] = cur
                                  return { ...d, extraTitles: next }
                                })
                              }
                            />
                            <Textarea
                              rows={2}
                              className="min-h-0 text-sm"
                              placeholder="Meio / técnica"
                              value={createDraft.extraCaptionMedia[idx]?.[createCaptionLocale] ?? ''}
                              onChange={(e) =>
                                setCreateDraft((d) => {
                                  const urls = d.extra_images
                                  const next = padExtraDescriptions(urls, d.extraCaptionMedia)
                                  const cur = { ...(next[idx] ?? emptyLocales()) }
                                  cur[createCaptionLocale] = e.target.value
                                  next[idx] = cur
                                  return { ...d, extraCaptionMedia: next }
                                })
                              }
                            />
                            <Textarea
                              rows={2}
                              className="min-h-0 text-sm"
                              placeholder="Dimensões"
                              value={
                                createDraft.extraPhysicalDimensions[idx]?.[createCaptionLocale] ?? ''
                              }
                              onChange={(e) =>
                                setCreateDraft((d) => {
                                  const urls = d.extra_images
                                  const next = padExtraDescriptions(
                                    urls,
                                    d.extraPhysicalDimensions
                                  )
                                  const cur = { ...(next[idx] ?? emptyLocales()) }
                                  cur[createCaptionLocale] = e.target.value
                                  next[idx] = cur
                                  return { ...d, extraPhysicalDimensions: next }
                                })
                              }
                            />
                            <Textarea
                              rows={3}
                              className="min-h-0 text-sm"
                              value={createDraft.extra_descriptions[idx]?.[createCaptionLocale] ?? ''}
                              onChange={(e) =>
                                setCreateDraft((d) => {
                                  const next = [...d.extra_descriptions]
                                  const cur = { ...(next[idx] ?? emptyLocales()) }
                                  cur[createCaptionLocale] = e.target.value
                                  next[idx] = cur
                                  return { ...d, extra_descriptions: next }
                                })
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {createPendingExtras.map((p) => (
                      <div
                        key={p.id}
                        className="relative aspect-square overflow-hidden rounded-lg border"
                      >
                        <ArtworkLazyImage
                          src={p.preview}
                          alt=""
                          className="size-full object-cover"
                          skeletonClassName="pointer-events-none absolute inset-0 z-[1] size-full rounded-lg"
                        />
                        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-1 bg-background/70 p-2 text-center">
                          <span className="text-xs font-medium">A enviar…</span>
                          <span className="text-muted-foreground line-clamp-2 text-[10px]">{p.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                </div>
                <GroupDisplayRulesCard imageCount={createGroupImageCount} />
                {createGroupImageCount < 2 ? (
                  <p className="text-muted-foreground text-sm">
                    Envie a imagem principal e pelo menos uma imagem extra para escolher o modo de
                    exibição (as opções dependem do número total de imagens).
                  </p>
                ) : createGroupDisplayChoices.length > 0 ? (
                  <GroupDisplayModeRadios
                    choices={createGroupDisplayChoices}
                    resolved={resolveGroupDisplay(
                      createGroupImageCount,
                      createDraft.groupDisplay
                    )}
                    onPick={(v) => setCreateDraft((d) => ({ ...d, groupDisplay: v }))}
                    radioName="create-group-display"
                  />
                ) : null}
              </div>
            ) : null}
            </div>
              <DialogFooter className="bg-background shrink-0 border-t pt-4">
                <Button type="button" variant="outline" onClick={closeCreate}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || createPendingExtras.length > 0 || createMainUploading}>
                  {saving ? 'A guardar…' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen && Boolean(editingId)}
        onOpenChange={(open) => {
          if (!open) closeEdit()
        }}
      >
        <DialogContent
          className={cn(
            'max-h-[min(92vh,100dvh-1rem)] min-h-0 flex flex-col overflow-hidden sm:max-w-[92vw] lg:max-w-6xl'
          )}
          showCloseButton
        >
          <DialogHeader className="shrink-0">
            <DialogTitle>Editar obra</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden lg:grid lg:grid-cols-[minmax(320px,46%)_1fr] lg:items-stretch">
            <div
              className="bg-muted/40 border-border relative max-h-[min(42vh,22rem)] min-h-[200px] shrink-0 overflow-hidden rounded-lg border lg:max-h-[min(78vh,calc(100dvh-14rem))] lg:min-h-0 lg:shrink"
              onTouchStart={(e) => setEditTouchX(e.touches[0]?.clientX ?? null)}
              onTouchEnd={(e) => {
                const endX = e.changedTouches[0]?.clientX ?? null
                if (editMedia.length < 2 || editTouchX == null || endX == null) return
                const delta = endX - editTouchX
                if (delta > swipeThreshold) prevEditMedia()
                if (delta < -swipeThreshold) nextEditMedia()
                setEditTouchX(null)
              }}
            >
              {editMedia.length > 0 ? (
                <>
                  <ArtworkLazyImage
                    src={getArtworkImageSrc({ image: editMedia[editCarouselIndex] })}
                    alt=""
                    className="h-full w-full object-cover"
                    skeletonClassName="pointer-events-none absolute inset-0 z-[1] size-full rounded-none"
                  />
                  {editMedia.length > 1 ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-1/2 left-3 z-[2] -translate-y-1/2"
                        onClick={prevEditMedia}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-1/2 right-3 z-[2] -translate-y-1/2"
                        onClick={nextEditMedia}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                      <div className="absolute right-2 bottom-2 z-[2] rounded bg-black/60 px-2 py-1 text-xs text-white">
                        {editCarouselIndex + 1}/{editMedia.length}
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                  Sem imagem
                </div>
              )}
            </div>
            <form
              onSubmit={saveEdit}
              className="flex min-h-0 min-w-0 flex-1 flex-col gap-0 overflow-hidden lg:min-h-0"
            >
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm leading-none font-medium">Legenda</span>
              <div
                role="tablist"
                aria-label="Idioma da legenda"
                className="flex flex-wrap gap-1"
              >
                {ADMIN_LOCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.locale}
                    type="button"
                    role="tab"
                    aria-selected={editCaptionLocale === opt.locale}
                    aria-label={opt.label}
                    onClick={() => setEditCaptionLocale(opt.locale)}
                    className={cn(
                      'inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border transition-colors',
                      editCaptionLocale === opt.locale
                        ? 'border-primary bg-accent'
                        : 'border-transparent hover:bg-muted/80'
                    )}
                  >
                    <span className="locale-flag shrink-0" aria-hidden>
                      <CountryFlag countryCode={opt.countryCode} />
                    </span>
                  </button>
                ))}
              </div>
              <Textarea
                id={`edit-desc-${editCaptionLocale}`}
                rows={4}
                value={form.description?.[editCaptionLocale] ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    description: { ...f.description, [editCaptionLocale]: e.target.value },
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm leading-none font-medium">Meio / técnica</span>
              <Textarea
                rows={3}
                value={form.captionMedium?.[editCaptionLocale] ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    captionMedium: { ...f.captionMedium, [editCaptionLocale]: e.target.value },
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm leading-none font-medium">Dimensões físicas</span>
              <Textarea
                rows={2}
                value={form.physicalDimensions?.[editCaptionLocale] ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    physicalDimensions: {
                      ...f.physicalDimensions,
                      [editCaptionLocale]: e.target.value,
                    },
                  }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-4">
                <Label htmlFor="edit-date">Data</Label>
                <ArtworkDateField
                  id="edit-date"
                  value={form.date ?? ''}
                  onChange={(date) => setForm((f) => ({ ...f, date }))}
                  required
                />
              </div>
              <div className="grid gap-4">
                <Label htmlFor="edit-order">Ordem</Label>
                <Input
                  id="edit-order"
                  type="number"
                  min={1}
                  value={form.order_index}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, order_index: Number(e.target.value) || 1 }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-4">
              <span className="text-sm font-medium">Categorias</span>
              {editCategoryAssignments.map((row, idx) => (
                <div key={idx} className="flex flex-wrap items-end gap-2">
                  <div className="grid min-w-[140px] flex-1 gap-1">
                    <Label>Categoria</Label>
                    <select
                      className={selectTriggerClass}
                      value={row.categoryId}
                      onChange={(e) => {
                        const categoryId = e.target.value
                        if (categoryId) void ensureSubs(categoryId)
                        setEditCategoryAssignments((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { categoryId, subcategoryId: null } : r
                          )
                        )
                      }}
                    >
                      <option value="">—</option>
                      {adminCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {catLabel(c)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid min-w-[140px] flex-1 gap-1">
                    <Label>Subcategoria</Label>
                    <select
                      className={selectTriggerClass}
                      value={row.subcategoryId ?? ''}
                      disabled={!row.categoryId}
                      onChange={(e) => {
                        const v = e.target.value
                        setEditCategoryAssignments((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, subcategoryId: v || null } : r
                          )
                        )
                      }}
                    >
                      <option value="">—</option>
                      {(row.categoryId ? subsCache[row.categoryId] ?? [] : []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {subLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditCategoryAssignments((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    Remover
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-fit"
                onClick={() => {
                  const first = adminCategories[0]?.id ?? ''
                  if (first) void ensureSubs(first)
                  setEditCategoryAssignments((prev) => [
                    ...prev,
                    { categoryId: first, subcategoryId: null },
                  ])
                }}
              >
                Adicionar categoria
              </Button>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-file">Arte (imagem ou vídeo)</Label>
              <Input
                id="edit-file"
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void uploadFile(f, 'edit')
                }}
                className="h-auto min-h-9 cursor-pointer py-1.5 file:cursor-pointer"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editHasGroup}
                onChange={(e) => {
                  const c = e.target.checked
                  setEditHasGroup(c)
                  if (!c) {
                    setEditPendingExtras((prev) => {
                      revokePendingList(prev)
                      return []
                    })
                    setForm((f) => ({
                      ...f,
                      group: null,
                      extra_images: [],
                      extra_descriptions: [],
                      extraTitles: [],
                      extraCaptionMedia: [],
                      extraPhysicalDimensions: [],
                      extraResolutions: [],
                      extraMediaBytes: [],
                      groupDisplay: undefined,
                    }))
                  }
                }}
                className="size-4 rounded border"
              />
              Possui grupo
            </label>
            {editHasGroup ? (
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-group">Nome do grupo</Label>
                  <Input
                    id="edit-group"
                    value={form.group ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        group: e.target.value || null,
                      }))
                    }
                    placeholder="Identificador do grupo"
                  />
                </div>
                <div className="grid gap-2">
                  <span className="text-sm font-medium">Imagens do grupo</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => document.getElementById('edit-extra-files')?.click()}
                  >
                    Inserir mais imagens
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    Pode escolher várias imagens de uma vez (Ctrl ou Shift ao clicar nos ficheiros).
                  </p>
                <input
                  id="edit-extra-files"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="sr-only"
                  onChange={handleEditGroupFiles}
                />
                {editPendingExtras.length > 0 || (form.extra_images?.length ?? 0) > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(form.extra_images ?? []).map((url, idx) => (
                      <div key={url} className="flex min-w-0 flex-col gap-2">
                        <div className="group relative aspect-square overflow-hidden rounded-lg border">
                          <ArtworkLazyImage
                            src={getArtworkImageSrc({ image: url })}
                            alt=""
                            className="size-full object-cover"
                            skeletonClassName="pointer-events-none absolute inset-0 z-[1] size-full rounded-lg"
                          />
                          <div className="absolute inset-0 z-[2] flex items-start justify-end bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="shrink-0 text-xs"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  extra_images: (f.extra_images ?? []).filter((_, i) => i !== idx),
                                  extra_descriptions: (f.extra_descriptions ?? []).filter(
                                    (_, i) => i !== idx
                                  ),
                                  extraTitles: (f.extraTitles ?? []).filter((_, i) => i !== idx),
                                  extraCaptionMedia: (f.extraCaptionMedia ?? []).filter(
                                    (_, i) => i !== idx
                                  ),
                                  extraPhysicalDimensions: (f.extraPhysicalDimensions ?? []).filter(
                                    (_, i) => i !== idx
                                  ),
                                  extraResolutions: (f.extraResolutions ?? []).filter(
                                    (_, i) => i !== idx
                                  ),
                                  extraMediaBytes: (f.extraMediaBytes ?? []).filter(
                                    (_, i) => i !== idx
                                  ),
                                }))
                              }
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                        {editShowPerImageCaptions ? (
                          <div className="flex min-w-0 flex-col gap-2">
                            <Input
                              className="text-sm"
                              placeholder="Título"
                              value={(form.extraTitles ?? [])[idx]?.[editCaptionLocale] ?? ''}
                              onChange={(e) =>
                                setForm((f) => {
                                  const urls = f.extra_images ?? []
                                  const next = padExtraDescriptions(urls, f.extraTitles ?? [])
                                  const cur = { ...(next[idx] ?? emptyLocales()) }
                                  cur[editCaptionLocale] = e.target.value
                                  next[idx] = cur
                                  return { ...f, extraTitles: next }
                                })
                              }
                            />
                            <Textarea
                              rows={2}
                              className="min-h-0 text-sm"
                              placeholder="Meio / técnica"
                              value={(form.extraCaptionMedia ?? [])[idx]?.[editCaptionLocale] ?? ''}
                              onChange={(e) =>
                                setForm((f) => {
                                  const urls = f.extra_images ?? []
                                  const next = padExtraDescriptions(urls, f.extraCaptionMedia ?? [])
                                  const cur = { ...(next[idx] ?? emptyLocales()) }
                                  cur[editCaptionLocale] = e.target.value
                                  next[idx] = cur
                                  return { ...f, extraCaptionMedia: next }
                                })
                              }
                            />
                            <Textarea
                              rows={2}
                              className="min-h-0 text-sm"
                              placeholder="Dimensões"
                              value={
                                (form.extraPhysicalDimensions ?? [])[idx]?.[editCaptionLocale] ?? ''
                              }
                              onChange={(e) =>
                                setForm((f) => {
                                  const urls = f.extra_images ?? []
                                  const next = padExtraDescriptions(
                                    urls,
                                    f.extraPhysicalDimensions ?? []
                                  )
                                  const cur = { ...(next[idx] ?? emptyLocales()) }
                                  cur[editCaptionLocale] = e.target.value
                                  next[idx] = cur
                                  return { ...f, extraPhysicalDimensions: next }
                                })
                              }
                            />
                            <Textarea
                              rows={3}
                              className="min-h-0 text-sm"
                              value={(form.extra_descriptions ?? [])[idx]?.[editCaptionLocale] ?? ''}
                              onChange={(e) =>
                                setForm((f) => {
                                  const urls = f.extra_images ?? []
                                  const next = padExtraDescriptions(urls, f.extra_descriptions ?? [])
                                  const cur = { ...(next[idx] ?? emptyLocales()) }
                                  cur[editCaptionLocale] = e.target.value
                                  next[idx] = cur
                                  return { ...f, extra_descriptions: next }
                                })
                              }
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {editPendingExtras.map((p) => (
                      <div
                        key={p.id}
                        className="relative aspect-square overflow-hidden rounded-lg border"
                      >
                        <ArtworkLazyImage
                          src={p.preview}
                          alt=""
                          className="size-full object-cover"
                          skeletonClassName="pointer-events-none absolute inset-0 z-[1] size-full rounded-lg"
                        />
                        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-1 bg-background/70 p-2 text-center">
                          <span className="text-xs font-medium">A enviar…</span>
                          <span className="text-muted-foreground line-clamp-2 text-[10px]">{p.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                </div>
                <GroupDisplayRulesCard imageCount={editGroupImageCount} />
                {editGroupImageCount < 2 ? (
                  <p className="text-muted-foreground text-sm">
                    Defina a imagem principal e pelo menos uma imagem extra para escolher o modo de
                    exibição (as opções dependem do número total de imagens).
                  </p>
                ) : editGroupDisplayChoices.length > 0 ? (
                  <GroupDisplayModeRadios
                    choices={editGroupDisplayChoices}
                    resolved={resolveGroupDisplay(editGroupImageCount, form.groupDisplay)}
                    onPick={(v) => setForm((f) => ({ ...f, groupDisplay: v }))}
                    radioName="edit-group-display"
                  />
                ) : null}
              </div>
            ) : null}
            </div>
              <DialogFooter className="bg-background shrink-0 border-t pt-4">
                <Button type="button" variant="outline" onClick={closeEdit}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || editPendingExtras.length > 0 || editMainUploading}>
                  {saving ? 'A guardar…' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
