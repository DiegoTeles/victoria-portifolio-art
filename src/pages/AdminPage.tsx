import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
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
import type { Artwork, ArtworkType, GroupDisplayType } from '../data/artworks'
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
  orientation: 'square',
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

export function AdminPage() {
  const titleId = useId()
  const [loggedIn, setLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [list, setList] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createDraft, setCreateDraft] = useState<CreateDraft>(emptyCreate())
  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [editHasGroup, setEditHasGroup] = useState(false)
  const [createPendingExtras, setCreatePendingExtras] = useState<PendingExtra[]>([])
  const [editPendingExtras, setEditPendingExtras] = useState<PendingExtra[]>([])
  const [createMainUploading, setCreateMainUploading] = useState(false)
  const [editMainUploading, setEditMainUploading] = useState(false)

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
    void fetch('/api/admin/me', { credentials: 'include' }).then(async (r) => {
      try {
        if (!r.headers.get('content-type')?.includes('application/json')) return
        const j = (await r.json()) as { ok?: boolean }
        if (r.ok && j?.ok === true) setLoggedIn(true)
      } catch {
        setLoggedIn(false)
      }
    })
  }, [])

  useEffect(() => {
    void refreshList()
  }, [refreshList])

  const login = async (e: FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const r = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password }),
    })
    if (!r.headers.get('content-type')?.includes('application/json')) {
      setLoginError('API indisponível neste modo.')
      return
    }
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    if (r.ok && j.ok === true) {
      setLoggedIn(true)
      setPassword('')
      void refreshList()
    } else {
      setLoginError(j.error || 'Falha no login')
    }
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    setLoggedIn(false)
  }

  const openCreate = () => {
    setCreatePendingExtras((prev) => {
      revokePendingList(prev)
      return []
    })
    setCreateDraft(emptyCreate())
    setMessage('')
    setCreateOpen(true)
  }

  const closeCreate = () => {
    setCreatePendingExtras((prev) => {
      revokePendingList(prev)
      return []
    })
    setCreateOpen(false)
  }

  const uploadFile = async (file: File, target: 'create' | 'edit') => {
    setMessage('Enviando…')
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
      setMessage('Imagem enviada.')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha no upload'
      setMessage(msg)
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
      setMessage(msg)
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
          setMessage('A enviar imagens…')
          const url = await uploadToBlob(file)
          setCreateDraft((d) => ({ ...d, extra_images: [...d.extra_images, url] }))
          setMessage('Imagens enviadas.')
        } catch {
          setMessage('Falha ao enviar uma imagem.')
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
          setMessage('A enviar imagens…')
          const url = await uploadToBlob(file)
          setForm((f) => ({ ...f, extra_images: [...(f.extra_images ?? []), url] }))
          setMessage('Imagens enviadas.')
        } catch {
          setMessage('Falha ao enviar uma imagem.')
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
      setMessage('Indique a data.')
      return
    }
    if (!createDraft.image) {
      setMessage('Envie a imagem principal antes de salvar.')
      return
    }
    const id = slugId(createDraft.title)
    const nextOrder =
      list.length === 0
        ? 1
        : Math.max(...list.map((x) => x.order_index ?? 0), 0) + 1
    setSaving(true)
    setMessage('')
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
        orientation: 'square' as const,
        group: createDraft.hasGroup ? createDraft.group.trim() || null : null,
        types: [createDraft.primaryType],
        extra_images: createDraft.hasGroup ? createDraft.extra_images : [],
      }
      const r = await fetch('/api/admin/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        setMessage((err as { error?: string }).error || 'Erro ao salvar')
        return
      }
      const created = (await r.json().catch(() => null)) as Artwork | null
      if (created?.id) {
        setList((prev) => [...prev.filter((x) => x.id !== created.id), created])
      }
      setMessage('Obra criada.')
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
      orientation: a.orientation,
      group: a.group,
      groupDisplay: a.groupDisplay,
      types: [...a.types],
      info: a.info ?? undefined,
      resolution: a.resolution,
      extra_images: [...(a.extra_images ?? [])],
    })
    setEditHasGroup(Boolean(a.group) || (a.extra_images?.length ?? 0) > 0)
    setEditPendingExtras([])
    setMessage('')
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditPendingExtras((prev) => {
      revokePendingList(prev)
      return []
    })
    setEditOpen(false)
    setEditingId(null)
  }

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.id?.trim() || !form.date) {
      setMessage('Preencha id e data.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const payload = {
        id: form.id.trim(),
        order_index: form.order_index,
        title: form.title ?? '',
        date: form.date,
        description: form.description,
        image: form.image || undefined,
        video: form.video || undefined,
        orientation: form.orientation,
        group: editHasGroup ? (form.group?.trim() || null) : null,
        groupDisplay: editHasGroup ? form.groupDisplay : undefined,
        types: form.types,
        info: form.info,
        resolution: form.resolution,
        extra_images: editHasGroup ? (form.extra_images ?? []) : [],
      }
      const r = await fetch(`/api/admin/artworks/${encodeURIComponent(form.id.trim())}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        setMessage((err as { error?: string }).error || 'Erro ao salvar')
        return
      }
      const updated = (await r.json().catch(() => null)) as Artwork | null
      if (updated?.id) {
        setList((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      }
      setMessage('Guardado.')
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
      setMessage('Removido.')
      if (editingId === id) closeEdit()
      void refreshList()
    } else {
      setMessage('Erro ao apagar')
    }
  }

  if (!loggedIn) {
    return (
      <section className="page-content admin-page">
        <h1 className="page-title" id={titleId}>
          Admin
        </h1>
        <form className="admin-login-form flex max-w-sm flex-col gap-4" onSubmit={login} aria-labelledby={titleId}>
          <div className="grid gap-2">
            <Label htmlFor="admin-password">Palavra-passe</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {loginError ? <p className="text-destructive text-sm">{loginError}</p> : null}
          <Button type="submit">Entrar</Button>
        </form>
      </section>
    )
  }

  return (
    <section className="page-content admin-page">
      <div className="admin-toolbar admin-toolbar--table">
        <h1 className="page-title admin-page-heading">Obras</h1>
        <div className="admin-toolbar-actions">
          <Button type="button" onClick={openCreate}>
            Adicionar nova
          </Button>
          <Button type="button" variant="outline" onClick={() => void logout()}>
            Sair
          </Button>
        </div>
      </div>
      {message ? <p className="text-muted-foreground mb-3 text-sm">{message}</p> : null}
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
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Nova obra</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveCreate} className="grid gap-4">
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
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen && Boolean(editingId)}
        onOpenChange={(open) => {
          if (!open) closeEdit()
        }}
      >
        <DialogContent
          className={cn('max-h-[85vh] overflow-y-auto sm:max-w-xl')}
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle>Editar obra</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-id">ID (slug único)</Label>
              <Input id="edit-id" value={form.id} readOnly disabled className="opacity-70" />
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
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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
            {LOCALES.map((loc) => (
              <div key={loc} className="grid gap-2">
                <Label htmlFor={`edit-desc-${loc}`}>Legenda ({loc})</Label>
                <Textarea
                  id={`edit-desc-${loc}`}
                  rows={3}
                  value={form.description?.[loc] ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      description: { ...f.description, [loc]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
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
              <Label htmlFor="edit-orientation">Orientação</Label>
              <select
                id="edit-orientation"
                className={selectTriggerClass}
                value={form.orientation}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    orientation: e.target.value as Artwork['orientation'],
                  }))
                }
              >
                <option value="square">square</option>
                <option value="horizontal">horizontal</option>
                <option value="vertical">vertical</option>
              </select>
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
                </div>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="edit-group-display">Group display (opcional)</Label>
              <Input
                id="edit-group-display"
                value={form.groupDisplay ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    groupDisplay: (e.target.value || undefined) as GroupDisplayType | undefined,
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image-url">URL da imagem</Label>
              <Input
                id="edit-image-url"
                value={form.image ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-file">Enviar ficheiro</Label>
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
            <div className="grid gap-2">
              <Label htmlFor="edit-video">URL do vídeo (opcional)</Label>
              <Input
                id="edit-video"
                value={form.video ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))}
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
        </DialogContent>
      </Dialog>
    </section>
  )
}
