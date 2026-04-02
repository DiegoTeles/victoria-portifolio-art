import { apiUrl } from '@/lib/apiUrl'
import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AdminLoginPage() {
  const titleId = useId()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const login = async (e: FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const r = await fetch(apiUrl('/api/admin/login'), {
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
      setPassword('')
      void navigate('/admin/obras', { replace: true })
    } else {
      setLoginError(j.error || 'Falha no login')
    }
  }

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
