import { useCallback, useEffect, useState } from 'react'
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

type LinkRow = {
  id: string
  network: string
  url: string
  label: string | null
  sortOrder: number
  isActive: boolean
}

export function AdminSocialPage() {
  const [list, setList] = useState<LinkRow[]>([])
  const [message, setMessage] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<LinkRow | null>(null)
  const [network, setNetwork] = useState('')
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/social-links', { credentials: 'include' })
    if (!r.ok) return
    const data = (await r.json()) as LinkRow[]
    setList(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setNetwork('')
    setUrl('')
    setLabel('')
    setSortOrder(0)
    setIsActive(true)
    setDialogOpen(true)
  }

  const openEdit = (row: LinkRow) => {
    setEditing(row)
    setNetwork(row.network)
    setUrl(row.url)
    setLabel(row.label ?? '')
    setSortOrder(row.sortOrder)
    setIsActive(row.isActive)
    setDialogOpen(true)
  }

  const save = async () => {
    const body = {
      network,
      url,
      label: label.trim() || null,
      sortOrder,
      isActive,
    }
    const r = await fetch(
      editing ? `/api/admin/social-links/${encodeURIComponent(editing.id)}` : '/api/admin/social-links',
      {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      }
    )
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      setMessage((err as { error?: string }).error || 'Erro')
      return
    }
    setMessage('Guardado.')
    setDialogOpen(false)
    void load()
  }

  const remove = async (row: LinkRow) => {
    if (!window.confirm('Remover este link?')) return
    const r = await fetch(`/api/admin/social-links/${encodeURIComponent(row.id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (r.ok) {
      setMessage('Removido.')
      void load()
    }
  }

  return (
    <section className="page-content admin-page">
      <div className="admin-toolbar admin-toolbar--table">
        <h1 className="page-title admin-page-heading">Redes sociais</h1>
        <Button type="button" onClick={openNew}>
          Novo link
        </Button>
      </div>
      {message ? <p className="text-muted-foreground mb-3 text-sm">{message}</p> : null}
      <div className="admin-table-wrap border-border bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rede</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Rótulo</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.network}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  <a href={row.url} className="underline" target="_blank" rel="noreferrer">
                    {row.url}
                  </a>
                </TableCell>
                <TableCell>{row.label ?? '—'}</TableCell>
                <TableCell>{row.sortOrder}</TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="outline" size="sm" className="mr-1" onClick={() => openEdit(row)}>
                    Editar
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => void remove(row)}>
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar link' : 'Novo link'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="soc-net">Rede</Label>
              <Input id="soc-net" value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="Instagram" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="soc-url">URL</Label>
              <Input id="soc-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="soc-label">Rótulo (opcional)</Label>
              <Input id="soc-label" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="soc-sort">Ordem</Label>
              <Input
                id="soc-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="size-4 rounded border"
              />
              Ativo
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void save()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
