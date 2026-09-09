import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, LogOut, MapPin, Network, Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { apiRequest } from '../lib/api.js'
import { Button, ConfirmDialog, Modal, SelectField, SelectItem } from './ui.jsx'
import { ContactForm } from './ContactForm.jsx'

const priorityLabel = { high: 'High priority', medium: 'Medium priority', low: 'Low priority' }
const sortable = [['name', 'Name'], ['company', 'Company'], ['role', 'Role'], ['priority', 'Priority'], ['updated_at', 'Last updated']]

export function Dashboard({ user, onSignOut }) {
  const [contacts, setContacts] = useState([])
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState('all')
  const [sort, setSort] = useState('updated_at')
  const [order, setOrder] = useState('desc')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(undefined)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading'); setError('')
    try {
      const params = new URLSearchParams({ sort, order, ...(query ? { q: query } : {}), ...(priority !== 'all' ? { priority } : {}) })
      const payload = await apiRequest(`/api/contacts?${params}`)
      setContacts(payload.data); setStatus('success')
    } catch (err) { setError(err.message); setStatus('error') }
  }, [query, priority, sort, order])

  useEffect(() => { const timer = setTimeout(load, query ? 250 : 0); return () => clearTimeout(timer) }, [load, query])

  async function save(values, setErrors) {
    setBusy(true)
    try {
      const payload = await apiRequest(editing ? `/api/contacts/item?id=${encodeURIComponent(editing.id)}` : '/api/contacts', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(values) })
      toast.success(payload.message); setFormOpen(false); setEditing(undefined); await load()
    } catch (err) { if (err.fields) setErrors(err.fields); else setErrors({ form: err.message }) } finally { setBusy(false) }
  }
  async function remove() {
    setBusy(true)
    try { const payload = await apiRequest(`/api/contacts/item?id=${encodeURIComponent(deleting.id)}`, { method: 'DELETE' }); toast.success(payload.message); setDeleting(null); await load() }
    catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }
  function toggleSort(field) { if (sort === field) setOrder(order === 'asc' ? 'desc' : 'asc'); else { setSort(field); setOrder(field === 'updated_at' ? 'desc' : 'asc') } }
  const hasFilters = query || priority !== 'all'
  const initials = useMemo(() => (user?.name || user?.email || 'U').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), [user])
  const edit = (contact) => { setEditing(contact); setFormOpen(true) }
  const add = () => { setEditing(undefined); setFormOpen(true) }

  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    const register = (tool) => Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {})
    register({
      name: 'list_contacts',
      title: 'List contacts',
      description: 'Return the contacts currently visible after search, filtering, and sorting.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => ({ contacts: contacts.map(({ id, name, company, role, where_met, priority }) => ({ id, name, company, role, whereMet: where_met, priority })) }),
    })
    register({
      name: 'start_contact_creation',
      title: 'Start adding a contact',
      description: 'Open the new-contact form in Bear Connect. This stages the action but does not save a contact.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async () => { add(); return { status: 'ready', message: 'The new-contact form is open.' } },
    })
    return () => lifecycle.abort()
  }, [contacts])

  return (
    <div className="app-shell">
      <header className="topbar"><div className="brand"><span className="brand-mark"><Network size={20} /></span> Bear Connect</div><div className="account"><span className="avatar">{initials}</span><span className="account-name">{user?.name || user?.email}</span><button className="icon-button" onClick={onSignOut} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button></div></header>
      <main className="workspace">
        <div className="page-heading"><div><p className="eyebrow">YOUR RELATIONSHIPS</p><h1>People worth remembering</h1><p>Keep the context that turns an introduction into a lasting connection.</p></div><Button onClick={add}><Plus size={18} /> Add contact</Button></div>
        <section className="contacts-surface" aria-label="Contacts">
          <div className="toolbar">
            <div className="search-box"><Search size={18} /><input aria-label="Search contacts" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, company, role, or place…" /></div>
            <SelectField label="Priority filter" value={priority} onValueChange={setPriority}><SelectItem value="all">All priorities</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectField>
            {hasFilters && <button className="clear-button" onClick={() => { setQuery(''); setPriority('all') }}>Clear filters</button>}
            <span className="contact-count">{contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}</span>
          </div>
          {status === 'loading' && <div className="skeleton-list" aria-label="Loading contacts">{[1,2,3].map((n) => <div className="skeleton-row" key={n} />)}</div>}
          {status === 'error' && <div className="state-box"><div className="state-icon error-state">!</div><h2>We couldn’t load your contacts</h2><p>{error}</p><Button variant="secondary" onClick={load}>Try again</Button></div>}
          {status === 'success' && contacts.length === 0 && <div className="state-box"><div className="state-icon"><UserRound size={26} /></div><h2>{hasFilters ? 'No matching contacts' : 'Your network starts here'}</h2><p>{hasFilters ? 'Try a different search or clear your filters.' : 'Add the first person you want to keep in touch with.'}</p>{hasFilters ? <Button variant="secondary" onClick={() => { setQuery(''); setPriority('all') }}>Clear filters</Button> : <Button onClick={add}><Plus size={17} /> Add your first contact</Button>}</div>}
          {status === 'success' && contacts.length > 0 && <>
            <div className="table-wrap"><table><thead><tr>{sortable.map(([field, label]) => <th key={field}><button onClick={() => toggleSort(field)}>{label}{sort === field ? order === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} /> : <ArrowUpDown size={14} />}</button></th>)}<th><span className="sr-only">Actions</span></th></tr></thead><tbody>{contacts.map((contact) => <tr key={contact.id}><td><strong>{contact.name}</strong>{contact.where_met && <small><MapPin size={12} />{contact.where_met}</small>}</td><td>{contact.company || <span className="muted">—</span>}</td><td>{contact.role || <span className="muted">—</span>}</td><td><span className={`priority priority-${contact.priority}`}><i />{priorityLabel[contact.priority]}</span></td><td>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(contact.updated_at))}</td><td><div className="row-actions"><button onClick={() => edit(contact)} aria-label={`Edit ${contact.name}`}><Pencil size={16} /></button><button className="delete-action" onClick={() => setDeleting(contact)} aria-label={`Delete ${contact.name}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
            <div className="card-list">{contacts.map((contact) => <article className="contact-card" key={contact.id}><div className="card-top"><div><h3>{contact.name}</h3><span className={`priority priority-${contact.priority}`}><i />{priorityLabel[contact.priority]}</span></div><div className="row-actions"><button onClick={() => edit(contact)} aria-label={`Edit ${contact.name}`}><Pencil size={16} /></button><button className="delete-action" onClick={() => setDeleting(contact)} aria-label={`Delete ${contact.name}`}><Trash2 size={16} /></button></div></div>{contact.company && <p><Building2 size={15} />{contact.company}{contact.role ? ` · ${contact.role}` : ''}</p>}{contact.where_met && <p><MapPin size={15} />{contact.where_met}</p>}{contact.notes && <div className="card-notes">{contact.notes}</div>}</article>)}</div>
          </>}
        </section>
      </main>
      <Modal open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(undefined) }} title={editing ? 'Edit contact' : 'Add a contact'} description={editing ? 'Update the details you want to remember.' : 'Capture the context while it is fresh.'}><ContactForm key={editing?.id || 'new'} contact={editing} onSubmit={save} onCancel={() => setFormOpen(false)} busy={busy} /></Modal>
      <ConfirmDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} name={deleting?.name} onConfirm={remove} busy={busy} />
    </div>
  )
}
