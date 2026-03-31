import { useCallback, useEffect, useState } from 'react'
import { AdminLocaleTabs, ADMIN_LOCALES, getAdminLocalePanelProps } from '@/components/admin/AdminLocaleTabs'
import { AdminRichTextEditor } from '@/components/admin/AdminRichTextEditor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { Locale } from '../data/artworks'

type Entry = {
  locale: Locale
  content: string
  isPublished: boolean
}

export function AdminCurriculumPage() {
  const [tab, setTab] = useState<Locale>('pt-Br')
  const [entries, setEntries] = useState<Record<Locale, Entry>>({} as Record<Locale, Entry>)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadVersion, setLoadVersion] = useState(0)

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/curriculum', { credentials: 'include' })
    if (!r.ok) return
    const data = (await r.json()) as { entries: Entry[] }
    const map = {} as Record<Locale, Entry>
    for (const loc of ADMIN_LOCALES) {
      const e = data.entries?.find((x) => x.locale === loc)
      map[loc] = {
        locale: loc,
        content: e?.content ?? '',
        isPublished: e?.isPublished ?? false,
      }
    }
    setEntries(map)
    setLoadVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const cur = entries[tab] ?? { locale: tab, content: '', isPublished: false }

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const r = await fetch('/api/admin/curriculum', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          locale: tab,
          content: cur.content,
          isPublished: cur.isPublished,
        }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        setMessage((err as { error?: string }).error || 'Erro')
        return
      }
      setMessage('Guardado.')
      void load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-content admin-page">
      <div className="admin-toolbar admin-toolbar--table">
        <h1 className="page-title admin-page-heading">Currículo</h1>
      </div>
      {message ? <p className="text-muted-foreground mb-3 text-sm">{message}</p> : null}
      <AdminLocaleTabs idPrefix="admin-cv" value={tab} onChange={setTab} />
      <div
        className="grid max-w-3xl gap-4 pt-2"
        {...getAdminLocalePanelProps('admin-cv', tab)}
      >
        <div className="grid gap-2">
          <Label htmlFor="cv-content">Texto</Label>
          <AdminRichTextEditor
            key={`${tab}-${loadVersion}`}
            id="cv-content"
            initialContent={cur.content}
            placeholder="Texto do currículo neste idioma…"
            onChange={(html) =>
              setEntries((prev) => {
                const e = prev[tab] ?? { locale: tab, content: '', isPublished: false }
                return { ...prev, [tab]: { ...e, content: html } }
              })
            }
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={cur.isPublished}
            onChange={(e) =>
              setEntries((prev) => ({
                ...prev,
                [tab]: { ...cur, isPublished: e.target.checked },
              }))
            }
            className="size-4 rounded border"
          />
          Publicar neste idioma
        </label>
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? 'A guardar…' : 'Guardar'}
        </Button>
      </div>
    </section>
  )
}
