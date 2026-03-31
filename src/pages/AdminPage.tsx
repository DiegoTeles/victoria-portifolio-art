import { useCallback, useEffect, useId, useState, type FormEvent } from 'react'
import { upload } from '@vercel/blob/client'
import type { Artwork, ArtworkType, GroupDisplayType } from '../data/artworks'
import type { Locale } from '../data/artworks'
import { getLocalized } from '../data/artworks'

const LOCALES: Locale[] = ['pt-Br', 'en', 'fr', 'it', 'de']
const TYPE_OPTIONS: ArtworkType[] = [
  'drawing',
  'painting',
  'photography',
  'digital-art',
  'movies',
]

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
})

type CreateDraft = {
  title: string
  date: string
  legenda: string
  image: string
}

const emptyCreate = (): CreateDraft => ({
  title: '',
  date: new Date().toISOString().slice(0, 10),
  legenda: '',
  image: '',
})

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

  const refreshList = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/artworks', { credentials: 'include' })
      if (r.ok) {
        const data = (await r.json()) as Artwork[]
        setList(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetch('/api/admin/me', { credentials: 'include' }).then((r) => {
      if (r.ok) setLoggedIn(true)
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
    if (r.ok) {
      setLoggedIn(true)
      setPassword('')
      void refreshList()
    } else {
      const j = await r.json().catch(() => ({}))
      setLoginError((j as { error?: string }).error || 'Falha no login')
    }
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    setLoggedIn(false)
  }

  const openCreate = () => {
    setCreateDraft(emptyCreate())
    setMessage('')
    setCreateOpen(true)
  }

  const closeCreate = () => {
    setCreateOpen(false)
  }

  const uploadFile = async (file: File, target: 'create' | 'edit') => {
    setMessage('Enviando…')
    const pathname = `portfolio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const blob = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/admin/blob',
      multipart: file.size > 4 * 1024 * 1024,
    })
    if (target === 'create') {
      setCreateDraft((d) => ({ ...d, image: blob.url }))
    } else {
      setForm((f) => ({ ...f, image: blob.url }))
    }
    setMessage('Imagem enviada.')
  }

  const saveCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!createDraft.date) {
      setMessage('Indique a data.')
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
        group: null,
        types: ['painting'] as ArtworkType[],
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
      setMessage('Obra criada.')
      setCreateOpen(false)
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
    })
    setMessage('')
    setEditOpen(true)
  }

  const closeEdit = () => {
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
        group: form.group,
        groupDisplay: form.groupDisplay,
        types: form.types,
        info: form.info,
        resolution: form.resolution,
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
      setMessage('Removido.')
      if (editingId === id) closeEdit()
      void refreshList()
    } else {
      setMessage('Erro ao apagar')
    }
  }

  useEffect(() => {
    if (!createOpen && !editOpen) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        if (createOpen) closeCreate()
        if (editOpen) closeEdit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [createOpen, editOpen])

  if (!loggedIn) {
    return (
      <section className="page-content admin-page">
        <h1 className="page-title" id={titleId}>
          Admin
        </h1>
        <form className="admin-login-form" onSubmit={login} aria-labelledby={titleId}>
          <label className="form-group">
            <span className="form-label">Palavra-passe</span>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {loginError ? <p className="admin-msg admin-msg--error">{loginError}</p> : null}
          <button type="submit" className="form-submit">
            Entrar
          </button>
        </form>
      </section>
    )
  }

  return (
    <section className="page-content admin-page">
      <div className="admin-toolbar admin-toolbar--table">
        <h1 className="page-title admin-page-heading">Obras</h1>
        <div className="admin-toolbar-actions">
          <button type="button" className="form-submit admin-btn-add" onClick={openCreate}>
            Adicionar nova
          </button>
          <button type="button" className="pagination-btn" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </div>
      {message ? <p className="admin-msg">{message}</p> : null}
      <div className="admin-table-wrap">
        {loading ? <p className="admin-table-loading">A carregar…</p> : null}
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col" className="admin-table-col-thumb">
                Imagem
              </th>
              <th scope="col">Título</th>
              <th scope="col">Resolução</th>
              <th scope="col">Ano</th>
              <th scope="col">Legenda</th>
              <th scope="col" className="admin-table-col-actions">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.id}>
                <td className="admin-table-cell-thumb">
                  {a.image ? (
                    <img
                      className="admin-table-thumb"
                      src={a.image}
                      alt=""
                      width={56}
                      height={56}
                      loading="lazy"
                    />
                  ) : (
                    <span className="admin-table-thumb admin-table-thumb--empty" aria-hidden />
                  )}
                </td>
                <td className="admin-table-cell-title">{a.title || a.id}</td>
                <td>{formatResolution(a)}</td>
                <td>{a.date.slice(0, 4)}</td>
                <td className="admin-table-cell-caption">{captionPreview(a)}</td>
                <td className="admin-table-cell-actions">
                  <button
                    type="button"
                    className="admin-table-action"
                    onClick={() => openEdit(a)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="admin-table-action admin-table-action--danger"
                    onClick={() => void remove(a.id)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && list.length === 0 ? (
          <p className="admin-table-empty">Nenhuma obra. Use «Adicionar nova».</p>
        ) : null}
      </div>

      {createOpen ? (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeCreate()
          }}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-create-title"
          >
            <div className="admin-modal__header">
              <h2 id="admin-modal-create-title" className="admin-modal__title">
                Nova obra
              </h2>
              <button type="button" className="admin-modal__close" onClick={closeCreate}>
                ×
              </button>
            </div>
            <form className="admin-modal__body admin-form" onSubmit={saveCreate}>
              <label className="form-group">
                <span className="form-label">Título</span>
                <input
                  className="form-input"
                  value={createDraft.title}
                  onChange={(e) => setCreateDraft((d) => ({ ...d, title: e.target.value }))}
                  autoFocus
                />
              </label>
              <label className="form-group">
                <span className="form-label">Data</span>
                <input
                  type="date"
                  className="form-input"
                  value={createDraft.date}
                  onChange={(e) => setCreateDraft((d) => ({ ...d, date: e.target.value }))}
                  required
                />
              </label>
              <label className="form-group">
                <span className="form-label">Legenda</span>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={createDraft.legenda}
                  onChange={(e) => setCreateDraft((d) => ({ ...d, legenda: e.target.value }))}
                />
              </label>
              <label className="form-group">
                <span className="form-label">Imagem</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void uploadFile(f, 'create')
                  }}
                />
                {createDraft.image ? (
                  <span className="admin-modal-hint">URL definida após envio.</span>
                ) : null}
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="form-submit" disabled={saving}>
                  {saving ? 'A guardar…' : 'Salvar'}
                </button>
                <button type="button" className="pagination-btn" onClick={closeCreate}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editOpen && editingId ? (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEdit()
          }}
        >
          <div
            className="admin-modal admin-modal--large"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-edit-title"
          >
            <div className="admin-modal__header">
              <h2 id="admin-modal-edit-title" className="admin-modal__title">
                Editar obra
              </h2>
              <button type="button" className="admin-modal__close" onClick={closeEdit}>
                ×
              </button>
            </div>
            <form className="admin-modal__body admin-form" onSubmit={saveEdit}>
              <label className="form-group">
                <span className="form-label">ID (slug único)</span>
                <input className="form-input" value={form.id} readOnly disabled />
              </label>
              <label className="form-group">
                <span className="form-label">Ordem</span>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  value={form.order_index}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, order_index: Number(e.target.value) || 1 }))
                  }
                />
              </label>
              <label className="form-group">
                <span className="form-label">Título</span>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="form-group">
                <span className="form-label">Data</span>
                <input
                  type="date"
                  className="form-input"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </label>
              {LOCALES.map((loc) => (
                <label key={loc} className="form-group">
                  <span className="form-label">Legenda ({loc})</span>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={form.description?.[loc] ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        description: { ...f.description, [loc]: e.target.value },
                      }))
                    }
                  />
                </label>
              ))}
              <fieldset className="form-group">
                <legend className="form-label">Tipos</legend>
                {TYPE_OPTIONS.map((t) => (
                  <label key={t} className="admin-check">
                    <input
                      type="checkbox"
                      checked={form.types?.includes(t) ?? false}
                      onChange={() =>
                        setForm((f) => {
                          const cur = new Set(f.types ?? [])
                          if (cur.has(t)) cur.delete(t)
                          else cur.add(t)
                          return { ...f, types: [...cur] as ArtworkType[] }
                        })
                      }
                    />{' '}
                    {t}
                  </label>
                ))}
              </fieldset>
              <label className="form-group">
                <span className="form-label">Orientação</span>
                <select
                  className="form-input"
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
              </label>
              <label className="form-group">
                <span className="form-label">Grupo (opcional)</span>
                <input
                  className="form-input"
                  value={form.group ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      group: e.target.value || null,
                    }))
                  }
                />
              </label>
              <label className="form-group">
                <span className="form-label">Group display (opcional)</span>
                <input
                  className="form-input"
                  value={form.groupDisplay ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      groupDisplay: (e.target.value || undefined) as GroupDisplayType | undefined,
                    }))
                  }
                />
              </label>
              <label className="form-group">
                <span className="form-label">URL da imagem</span>
                <input
                  className="form-input"
                  value={form.image ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                />
              </label>
              <label className="form-group">
                <span className="form-label">Enviar ficheiro</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void uploadFile(f, 'edit')
                  }}
                />
              </label>
              <label className="form-group">
                <span className="form-label">URL do vídeo (opcional)</span>
                <input
                  className="form-input"
                  value={form.video ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, video: e.target.value }))}
                />
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="form-submit" disabled={saving}>
                  {saving ? 'A guardar…' : 'Salvar'}
                </button>
                <button type="button" className="pagination-btn" onClick={closeEdit}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
