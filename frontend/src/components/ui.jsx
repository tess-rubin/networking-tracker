import * as AlertDialog from '@radix-ui/react-alert-dialog'
import * as Dialog from '@radix-ui/react-dialog'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, X } from 'lucide-react'

export function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props} />
}

export function Modal({ open, onOpenChange, title, description, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="modal">
          <div className="modal-heading">
            <div><Dialog.Title>{title}</Dialog.Title>{description && <Dialog.Description>{description}</Dialog.Description>}</div>
            <Dialog.Close className="icon-button" aria-label="Close"><X size={18} /></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function ConfirmDialog({ open, onOpenChange, name, onConfirm, busy }) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="overlay" />
        <AlertDialog.Content className="modal modal-small">
          <AlertDialog.Title>Delete {name}?</AlertDialog.Title>
          <AlertDialog.Description>This removes the contact and their notes permanently. This action cannot be undone.</AlertDialog.Description>
          <div className="dialog-actions">
            <AlertDialog.Cancel asChild><Button variant="secondary" disabled={busy}>Keep contact</Button></AlertDialog.Cancel>
            <AlertDialog.Action asChild><Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Deleting…' : 'Delete contact'}</Button></AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export function SelectField({ value, onValueChange, label, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <Select.Root value={value} onValueChange={onValueChange}>
        <Select.Trigger className="select-trigger" aria-label={label}><Select.Value /><Select.Icon><ChevronDown size={16} /></Select.Icon></Select.Trigger>
        <Select.Portal>
          <Select.Content className="select-content" position="popper" sideOffset={5}>
            <Select.Viewport>{children}</Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}

export function SelectItem({ value, children }) {
  return <Select.Item value={value} className="select-item"><Select.ItemText>{children}</Select.ItemText><Select.ItemIndicator><Check size={14} /></Select.ItemIndicator></Select.Item>
}

