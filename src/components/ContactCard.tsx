import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { validateE164Phone, validateEmail } from '../utils/validators';
import type { EmergencyContact } from '../types';

interface ContactCardProps {
  contact: EmergencyContact;
  onUpdate: (updated: EmergencyContact) => void;
  onRemove: (id: string) => void;
}

export function ContactCard({ contact, onUpdate, onRemove }: ContactCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contact.name);
  const [phone, setPhone] = useState(contact.phone);
  const [email, setEmail] = useState(contact.email);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function startEdit() {
    setName(contact.name);
    setPhone(contact.phone);
    setEmail(contact.email);
    setErrors({});
    setSubmitError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setErrors({});
    setSubmitError(null);
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Name is required.';
    if (!validateE164Phone(phone)) next.phone = 'Phone must be in E.164 format (e.g. +12125551234).';
    if (!validateEmail(email)) next.email = 'Please enter a valid email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSubmitError(null);

    const { data, error } = await supabase
      .from('emergency_contacts')
      .update({ name: name.trim(), phone: phone.trim(), email: email.trim() })
      .eq('id', contact.id)
      .select()
      .single();

    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    const updated: EmergencyContact = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      createdAt: new Date(data.created_at),
    };

    onUpdate(updated);
    setEditing(false);
  }

  async function handleRemove() {
    setLoading(true);

    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', contact.id);
    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    onRemove(contact.id);
  }

  return (
    <article
      aria-label={`Emergency contact: ${contact.name}`}
      className="rounded-xl bg-white border border-slate-200 p-4 hover:border-brand-primary/30 transition-colors"
    >
      {!editing ? (
        <>
          <div className="space-y-1 mb-3">
            <p className="font-bold text-slate-900">{contact.name}</p>
            <p className="text-sm text-slate-600 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {contact.phone}
            </p>
            <p className="text-sm text-slate-600 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              {contact.email}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={startEdit}
              aria-label={`Edit contact ${contact.name}`}
              className="btn btn-secondary flex-1 py-2 text-sm"
            >
              Edit
            </button>
            <button
              onClick={handleRemove}
              disabled={loading}
              aria-label={`Remove contact ${contact.name}`}
              className="btn btn-emergency flex-1 py-2 text-sm"
            >
              {loading ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleEditSubmit} className="space-y-3" noValidate>
          <div>
            <label htmlFor={`edit-name-${contact.id}`} className="label">
              Name
            </label>
            <input
              id={`edit-name-${contact.id}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              aria-label="Edit contact name"
              aria-describedby={errors.name ? `edit-name-error-${contact.id}` : undefined}
              className={`input ${errors.name ? 'input-error' : ''}`}
            />
            {errors.name && (
              <p id={`edit-name-error-${contact.id}`} role="alert" aria-live="polite" className="text-xs text-emergency mt-1">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`edit-phone-${contact.id}`} className="label">
              Phone <span className="text-slate-500 text-xs">(E.164)</span>
            </label>
            <input
              id={`edit-phone-${contact.id}`}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              aria-label="Edit contact phone number"
              aria-describedby={errors.phone ? `edit-phone-error-${contact.id}` : undefined}
              className={`input ${errors.phone ? 'input-error' : ''}`}
            />
            {errors.phone && (
              <p id={`edit-phone-error-${contact.id}`} role="alert" aria-live="polite" className="text-xs text-emergency mt-1">
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`edit-email-${contact.id}`} className="label">
              Email
            </label>
            <input
              id={`edit-email-${contact.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              aria-label="Edit contact email address"
              aria-describedby={errors.email ? `edit-email-error-${contact.id}` : undefined}
              className={`input ${errors.email ? 'input-error' : ''}`}
            />
            {errors.email && (
              <p id={`edit-email-error-${contact.id}`} role="alert" aria-live="polite" className="text-xs text-emergency mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {submitError && (
            <div role="alert" aria-live="assertive" className="p-3 rounded-xl bg-emergency-light border border-emergency text-emergency-dark text-sm">
              {submitError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              aria-label="Save contact changes"
              className="btn btn-primary flex-1 py-2 text-sm"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={loading}
              aria-label="Cancel editing contact"
              className="btn btn-secondary flex-1 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </article>
  );
}
