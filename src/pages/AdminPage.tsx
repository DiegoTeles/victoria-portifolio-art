import {
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
import { ArtworkDateField } from '@/components/admin/ArtworkDateField'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type {
  Artwork,
  ArtworkCategoryAssignment,
  ArtworkType,
  GroupDisplayType,
} from '../data/artworks'
import type { Locale } from '../data/artworks'
import { getLocalized } from '../data/artworks'
import { cn } from '@/lib/utils'
import { getArtworkImageSrc } from '@/lib/artworkImageUrl'

const LOCALES: Locale[] = ['pt-Br', 'en', 'fr', 'it', 'de']
const TYPE_OPTIONS: ArtworkType[] = [
  'drawing',
  'painting',
  'photography',
  'digital-art',
  'movies',
]

const TYPE_LABELS: Record<ArtworkType, string> = {
  drawing: 'Desenho',
  painting: 'Pintura',
  photography: 'Fotografia',
  'digital-art': 'Arte digital',
  movies: 'Vídeos',
}

const selectTriggerClass =
  'border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

const LOCALE_FLAGS: Record<Locale, string> = {
  'pt-Br': '🇧🇷',
  en: '🇬🇧',
  fr: '🇫🇷',
  it: '🇮🇹',
  de: '🇩🇪',
}

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
  if (n < 2 || n > 6) return false
  if (value === 'asymmetric-5') return n === 5
  if (value === 'caption-in-grid') return n === 5 || n === 6
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
  image: '',
  video: '',
  group: null,
  groupDisplay: undefined,
  types: ['painting'],
  extra_images: [],
})

type CreateDraft = {
  title: string
  date: string
  legenda: string
  image: string
  primaryType: ArtworkType
  hasGroup: boolean
  group: string
  groupDisplay: GroupDisplayType | undefined
  extra_images: string[]
}

const emptyCreate = (): CreateDraft => ({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  legenda: '',
  image: '',
  primaryType: 'painting',
  hasGroup: false,
  group: '',
  groupDisplay: undefined,
  extra_images: [],
})

type PendingExtra = { id: string; preview: string; name: string }

function revokePendingList(list: PendingExtra[]) {
  for (const p of list) {
    URL.revokeObjectURL(p.preview)
  }
}

function formatResolution(a: Artwork): string {
  const r = a.resolution
  if (!r?.width || !r?.height) return '—'
  return `${r.width}×${r.height}`
}

function captionPreview(a: Artwork): string {
  const t = getLocalized(a.description, 'pt-Br')
  return t.trim() || '—'
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

export function AdminArtworksPage() {
  const titleId = useId()
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

  const openCreate = () => {
    setCreatePendingExtras((prev) => {
      revokePendingList(prev)
      return []
    })
    setCreateDraft(emptyCreate())
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
    try {
      const blob = await upload(pathname, file, {
        access: 'private',
        handleUploadUrl: '/api/admin/blob',
        multipart: file.size > 4 * 1024 * 1024,
      })
      if (target === 'create') {
        setCreateDraft((d) => ({ ...d, image: blob.url }))
      } else {
        setForm((f) => ({ ...f, image: blob.url }))
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

  const uploadToBlob = async (file: File) => {
    const pathname = `portfolio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    try {
      const blob = await upload(pathname, file, {
        access: 'private',
        handleUploadUrl: '/api/admin/blob',
        multipart: file.size > 4 * 1024 * 1024,
      })
      return blob.url
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha no upload'
      toast.error(msg)
      throw e
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
          const url = await uploadToBlob(file)
          setCreateDraft((d) => ({ ...d, extra_images: [...d.extra_images, url] }))
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
          const url = await uploadToBlob(file)
          setForm((f) => ({ ...f, extra_images: [...(f.extra_images ?? []), url] }))
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
      const payload = {
        id,
        order_index: nextOrder,
        title: createDraft.title,
        date: createDraft.date,
        description: {
          'pt-Br': createDraft.legenda,
          en: '',
          fr: '',
          it: '',
          de: '',
        },
        image: createDraft.image || undefined,
        group: createDraft.hasGroup ? createDraft.group.trim() || null : null,
        groupDisplay: resolvedCreateGroupDisplay,
        types: [createDraft.primaryType],
        extra_images: createDraft.hasGroup ? createDraft.extra_images : [],
        categoryAssignments: createCategoryAssignments.filter((x) => x.categoryId.trim()),
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
      image: a.image ?? '',
      video: a.video ?? '',
      group: a.group,
      groupDisplay: a.groupDisplay,
      types: [...a.types],
      info: a.info ?? undefined,
      resolution: a.resolution,
      extra_images: [...(a.extra_images ?? [])],
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
      const payload = {
        id: form.id.trim(),
        order_index: form.order_index,
        title: form.title ?? '',
        date: form.date,
        description: form.description,
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
        extra_images: editHasGroup ? (form.extra_images ?? []) : [],
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

  const remove = async (id: string) => {
    if (!window.confirm('Apagar esta obra?')) return
    const r = await fetch(`/api/admin/artworks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (r.ok) {
      setList((prev) => prev.filter((x) => x.id !== id))
      toast.success('Removido.')
      if (editingId === id) closeEdit()
      void refreshList()
    } else {
      const err = await r.json().catch(() => ({}))
      toast.error((err as { error?: string }).error || 'Erro ao apagar')
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
  const prevCreateMedia = () =>
    setCreateCarouselIndex((i) => (i === 0 ? createMedia.length - 1 : i - 1))
  const nextCreateMedia = () =>
    setCreateCarouselIndex((i) => (i === createMedia.length - 1 ? 0 : i + 1))
  const prevEditMedia = () =>
    setEditCarouselIndex((i) => (i === 0 ? editMedia.length - 1 : i - 1))
  const nextEditMedia = () =>
    setEditCarouselIndex((i) => (i === editMedia.length - 1 ? 0 : i + 1))

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
      <div className="admin-table-wrap border-border bg-card rounded-lg border">
        {loading ? (
          <p className="text-muted-foreground p-6 text-center text-sm">A carregar…</p>
        ) : null}
        {!loading && list.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Imagem</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Resolução</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead className="max-w-[min(280px,28vw)]">Legenda</TableHead>
                <TableHead className="w-[1%] text-right whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="w-[72px]">
                    {a.image ? (
                      <img
                        className="border-border size-14 rounded object-cover"
                        src={getArtworkImageSrc(a)}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="border-border bg-muted block size-14 rounded border"
                        aria-hidden
                      />
                    )}
                  </TableCell>
                  <TableCell className="max-w-[220px] font-medium">{a.title || a.id}</TableCell>
                  <TableCell>{formatResolution(a)}</TableCell>
                  <TableCell>{a.date.slice(0, 4)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[min(280px,28vw)] truncate whitespace-nowrap">
                    {captionPreview(a)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(a)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void remove(a.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
        {!loading && list.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm">
            Nenhuma obra. Use «Adicionar nova».
          </p>
        ) : null}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) closeCreate()
        }}
      >
        <DialogContent className="sm:max-w-[92vw] lg:max-w-6xl" showCloseButton>
          <DialogHeader>
            <DialogTitle>Nova obra</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[minmax(320px,46%)_1fr]">
            <div
              className="bg-muted/40 border-border relative overflow-hidden rounded-lg border lg:sticky lg:top-0 lg:h-[78vh]"
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
                  <img
                    src={getArtworkImageSrc({ image: createMedia[createCarouselIndex] })}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {createMedia.length > 1 ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-1/2 left-3 -translate-y-1/2"
                        onClick={prevCreateMedia}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-1/2 right-3 -translate-y-1/2"
                        onClick={nextCreateMedia}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                      <div className="absolute right-2 bottom-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
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
            <form onSubmit={saveCreate} className="grid max-h-[78vh] gap-4 overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label htmlFor="create-title">Título</Label>
              <Input
                id="create-title"
                value={createDraft.title}
                onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-date">Data</Label>
              <ArtworkDateField
                id="create-date"
                value={createDraft.date}
                onChange={(date) => setCreateDraft((d) => ({ ...d, date }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-legenda">Legenda</Label>
              <Textarea
                id="create-legenda"
                rows={4}
                value={createDraft.legenda}
                onChange={(e) => setCreateDraft((d) => ({ ...d, legenda: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-type">Tipo de obra</Label>
              <select
                id="create-type"
                className={selectTriggerClass}
                value={createDraft.primaryType}
                onChange={(e) =>
                  setCreateDraft((d) => ({
                    ...d,
                    primaryType: e.target.value as ArtworkType,
                  }))
                }
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">Categorias</span>
              {createCategoryAssignments.map((row, idx) => (
                <div key={idx} className="flex flex-wrap items-end gap-2">
                  <div className="grid min-w-[140px] flex-1 gap-1">
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
                  <div className="grid min-w-[140px] flex-1 gap-1">
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
            <div className="grid gap-2">
              <Label htmlFor="create-file">Imagem principal</Label>
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
            <label className="flex cursor-pointer items-center gap-2 text-sm">
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
                    groupDisplay: checked ? d.groupDisplay : undefined,
                  }))
                }}
                className="size-4 rounded border"
              />
              Possui grupo
            </label>
            {createDraft.hasGroup ? (
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="create-group">Nome do grupo</Label>
                  <Input
                    id="create-group"
                    value={createDraft.group}
                    onChange={(e) => setCreateDraft((d) => ({ ...d, group: e.target.value }))}
                    placeholder="Identificador do grupo"
                  />
                </div>
                <div className="grid gap-2">
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {createDraft.extra_images.map((url) => (
                      <div
                        key={url}
                        className="group relative aspect-square overflow-hidden rounded-lg border"
                      >
                        <img
                          src={url}
                          alt=""
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-start justify-end bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="shrink-0 text-xs"
                            onClick={() =>
                              setCreateDraft((d) => ({
                                ...d,
                                extra_images: d.extra_images.filter((u) => u !== url),
                              }))
                            }
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                    {createPendingExtras.map((p) => (
                      <div
                        key={p.id}
                        className="relative aspect-square overflow-hidden rounded-lg border"
                      >
                        <img
                          src={p.preview}
                          alt=""
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/70 p-2 text-center">
                          <span className="text-xs font-medium">A enviar…</span>
                          <span className="text-muted-foreground line-clamp-2 text-[10px]">{p.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {createGroupDisplayChoices.length > 0 ? (
                  <fieldset className="grid gap-3 pt-1">
                    <legend className="text-sm font-medium">Tipo de exibição do grupo</legend>
                    <div className="grid gap-2" role="radiogroup" aria-label="Tipo de exibição do grupo">
                      {createGroupDisplayChoices.map((opt) => {
                        const resolved = resolveGroupDisplay(
                          createGroupImageCount,
                          createDraft.groupDisplay
                        )
                        return (
                          <label
                            key={opt.value}
                            className="border-input has-[:checked]:border-primary flex cursor-pointer gap-3 rounded-md border p-3 has-[:checked]:bg-accent/40"
                          >
                            <input
                              type="radio"
                              name="create-group-display"
                              className="mt-1 size-4 shrink-0"
                              checked={resolved === opt.value}
                              onChange={() =>
                                setCreateDraft((d) => ({ ...d, groupDisplay: opt.value }))
                              }
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">{opt.title}</span>
                              <span className="text-muted-foreground block text-xs">{opt.hint}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                ) : null}
                </div>
              </div>
            ) : null}
              <DialogFooter>
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
        <DialogContent className={cn('sm:max-w-[92vw] lg:max-w-6xl')} showCloseButton>
          <DialogHeader>
            <DialogTitle>Editar obra</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[minmax(320px,46%)_1fr]">
            <div
              className="bg-muted/40 border-border relative overflow-hidden rounded-lg border lg:sticky lg:top-0 lg:h-[78vh]"
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
                  <img
                    src={getArtworkImageSrc({ image: editMedia[editCarouselIndex] })}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {editMedia.length > 1 ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-1/2 left-3 -translate-y-1/2"
                        onClick={prevEditMedia}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-1/2 right-3 -translate-y-1/2"
                        onClick={nextEditMedia}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                      <div className="absolute right-2 bottom-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
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
            <form onSubmit={saveEdit} className="grid max-h-[78vh] gap-4 overflow-y-auto pr-1">
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
                {LOCALES.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    role="tab"
                    aria-selected={editCaptionLocale === loc}
                    aria-label={loc}
                    onClick={() => setEditCaptionLocale(loc)}
                    className={cn(
                      'inline-flex min-h-9 min-w-9 items-center justify-center rounded-md border text-lg leading-none transition-colors',
                      editCaptionLocale === loc
                        ? 'border-primary bg-accent'
                        : 'border-transparent hover:bg-muted/80'
                    )}
                  >
                    {LOCALE_FLAGS[loc]}
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
              <Label htmlFor="edit-date">Data</Label>
              <ArtworkDateField
                id="edit-date"
                value={form.date ?? ''}
                onChange={(date) => setForm((f) => ({ ...f, date }))}
                required
              />
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
                    {(form.extra_images ?? []).map((url) => (
                      <div
                        key={url}
                        className="group relative aspect-square overflow-hidden rounded-lg border"
                      >
                        <img
                          src={url}
                          alt=""
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-start justify-end bg-black/0 p-1 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="shrink-0 text-xs"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                extra_images: (f.extra_images ?? []).filter((u) => u !== url),
                              }))
                            }
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                    {editPendingExtras.map((p) => (
                      <div
                        key={p.id}
                        className="relative aspect-square overflow-hidden rounded-lg border"
                      >
                        <img
                          src={p.preview}
                          alt=""
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/70 p-2 text-center">
                          <span className="text-xs font-medium">A enviar…</span>
                          <span className="text-muted-foreground line-clamp-2 text-[10px]">{p.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {editGroupDisplayChoices.length > 0 ? (
                  <fieldset className="grid gap-3 pt-1">
                    <legend className="text-sm font-medium">Tipo de exibição do grupo</legend>
                    <div className="grid gap-2" role="radiogroup" aria-label="Tipo de exibição do grupo">
                      {editGroupDisplayChoices.map((opt) => {
                        const resolved = resolveGroupDisplay(
                          editGroupImageCount,
                          form.groupDisplay
                        )
                        return (
                          <label
                            key={opt.value}
                            className="border-input has-[:checked]:border-primary flex cursor-pointer gap-3 rounded-md border p-3 has-[:checked]:bg-accent/40"
                          >
                            <input
                              type="radio"
                              name="edit-group-display"
                              className="mt-1 size-4 shrink-0"
                              checked={resolved === opt.value}
                              onChange={() =>
                                setForm((f) => ({
                                  ...f,
                                  groupDisplay: opt.value,
                                }))
                              }
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">{opt.title}</span>
                              <span className="text-muted-foreground block text-xs">{opt.hint}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                ) : null}
                </div>
              </div>
            ) : null}
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Tipos</legend>
              <div className="flex flex-wrap gap-3">
                {TYPE_OPTIONS.map((t) => (
                  <label key={t} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 rounded border"
                      checked={form.types?.includes(t) ?? false}
                      onChange={() =>
                        setForm((f) => {
                          const cur = new Set(f.types ?? [])
                          if (cur.has(t)) cur.delete(t)
                          else cur.add(t)
                          return { ...f, types: [...cur] as ArtworkType[] }
                        })
                      }
                    />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-2">
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
              <DialogFooter>
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
