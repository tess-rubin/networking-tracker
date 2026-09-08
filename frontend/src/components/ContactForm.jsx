import { useEffect, useState } from 'react'
import { contactInputSchema } from '../../../shared/contacts.js'
import { Button, SelectField, SelectItem } from './ui.jsx'

const blank = { name: '', company: '', role: '', whereMet: '', notes: '', priority: 'medium' }

export function ContactForm({ contact, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState({})
  useEffect(() => {
    setForm(contact ? { name: contact.name, company: contact.company, role: contact.role, whereMet: contact.where_met, notes: contact.notes, priority: contact.priority } : blank)
    setErrors({})
  }, [contact])

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: undefined })) }
  async function submit(event) {
    event.preventDefault()
    const parsed = contactInputSchema.safeParse(form)
    if (!parsed.success) {
      const next = {}; parsed.error.issues.forEach((issue) => { next[issue.path[0]] ||= issue.message }); setErrors(next); return
    }
    await onSubmit(parsed.data, setErrors)
  }
  const input = (key, label, placeholder) => <div className="field"><label htmlFor={`contact-${key}`}>{label}</label><input id={`contact-${key}`} value={form[key]} onChange={(e) => update(key, e.target.value)} placeholder={placeholder} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined} />{errors[key] && <span className="field-error" id={`${key}-error`}>{errors[key]}</span>}</div>
  return (
    <form onSubmit={submit} className="contact-form">
      {input('name', 'Name *', 'e.g. Maya Chen')}
      <div className="form-row">{input('company', 'Company or organization', 'e.g. Cal Alumni Association')}{input('role', 'Role', 'e.g. Program Manager')}</div>
      {input('whereMet', 'Where you met', 'e.g. Berkeley career fair')}
      <div className="field"><label htmlFor="contact-notes">Notes</label><textarea id="contact-notes" rows="4" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="What did you talk about? What should you follow up on?" />{errors.notes && <span className="field-error">{errors.notes}</span>}</div>
      <SelectField label="Priority" value={form.priority} onValueChange={(value) => update('priority', value)}><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectField>
      {errors.form && <div className="form-error">{errors.form}</div>}
      <div className="dialog-actions"><Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : contact ? 'Save changes' : 'Add contact'}</Button></div>
    </form>
  )
}

