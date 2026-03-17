import { useState, useCallback } from 'react'
import { useLocale } from '../i18n/LocaleContext'

const CONTACT_EMAIL = 'viccctoriamaria@gmail.com'

export function ContactPage() {
  const { t } = useLocale()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const subject = encodeURIComponent(title.trim() || '(sem assunto)')
      const body = encodeURIComponent(message.trim())
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
    },
    [title, message]
  )

  return (
    <section className="page-content contact-page">
      <h1 className="page-title">{t('navContact')}</h1>
      <p className="page-text">{t('contactIntro')}</p>
      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="contact-title" className="form-label">
            {t('contactTitleLabel')}
          </label>
          <input
            id="contact-title"
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="form-group">
          <label htmlFor="contact-message" className="form-label">
            {t('contactMessageLabel')}
          </label>
          <textarea
            id="contact-message"
            className="form-textarea"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button type="submit" className="form-submit">
          {t('contactSend')}
        </button>
      </form>
    </section>
  )
}
