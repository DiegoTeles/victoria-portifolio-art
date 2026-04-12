import { apiUrl } from '@/lib/apiUrl'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { AdminLocaleTabs, ADMIN_LOCALES, getAdminLocalePanelProps } from '@/components/admin/AdminLocaleTabs'
import { AdminRichTextEditor } from '@/components/admin/AdminRichTextEditor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { Locale } from '../data/artworks'

type Entry = {
  locale: Locale
  content: string
  updatedAt?: string | null
}

export function AdminCurriculumPage() {
  const [tab, setTab] = useState<Locale>('pt-Br')
  const [entries, setEntries] = useState<Record<Locale, Entry>>({} as Record<Locale, Entry>)
  const [saving, setSaving] = useState(false)
  const [loadVersion, setLoadVersion] = useState(0)

  const load = useCallback(async () => {
    const r = await fetch(apiUrl('/api/admin/curriculum'), { credentials: 'include' })
    if (!r.ok) return
    const data = (await r.json()) as { entries: Entry[] }
    const list = data.entries ?? []
    const map = {} as Record<Locale, Entry>
    for (const loc of ADMIN_LOCALES) {
      const e = list.find((x) => x.locale === loc)
      map[loc] = {
        locale: loc,
        content: e?.content ?? '',
        updatedAt: e?.updatedAt ?? null,
      }
    }
    setEntries(map)
    setLoadVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const cur = entries[tab] ?? { locale: tab, content: '' }

  const save = async () => {
    setSaving(true)
    try {
      const r = await fetch(apiUrl('/api/admin/curriculum'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          locale: tab,
          content: cur.content,
        }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        toast.error((err as { error?: string }).error || 'Erro ao guardar.')
        return
      }
      toast.success('Guardado.')
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
                const e = prev[tab] ?? { locale: tab, content: '' }
                return { ...prev, [tab]: { ...e, content: html } }
              })
            }
          />
        </div>
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? 'A guardar…' : 'Guardar'}
        </Button>
      </div>
    </section>
  )
}
