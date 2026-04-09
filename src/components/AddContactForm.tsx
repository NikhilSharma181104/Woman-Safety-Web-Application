import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { validateE164Phone, validateEmail } from '../utils/validators';
import type { EmergencyContact } from '../types';

interface AddContactFormProps {
  onAdded: (contact: EmergencyContact) => void;
}

export function AddContactForm({ onAdded }: AddContactFormProps) {
  const contacts = useAppStore((s) => s.contacts);
  const session = useAppStore((s) => s.session);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const atLimit = contacts.length >= 5;

  function validate(): boolean {
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Name is required.';
    
    // Auto-format Indian phone numbers
    let formattedPhone = phone.trim();
    if (/^\d{10}$/.test(formattedPhone)) {
      // If user enters 10 digits, assume Indian number and add +91
      formattedPhone = '+91' + formattedPhone;
      setPhone(formattedPhone);
    }
    
    if (!validateE164Phone(formattedPhone)) {
      next.phone = 'Phone must be in E.164 format (e.g. +918369622735 or +12125551234).';
    }
    
    if (!validateEmail(email)) next.email = 'Please enter a valid email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (atLimit || !validate()) return;

    setLoading(true);
    setSubmitError(null);

    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert({
        user_id: session?.user?.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }

    const contact: EmergencyContact = {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      createdAt: new Date(data.created_at),
    };

    onAdded(contact);
    setName('');
    setPhone('');
    setEmail('');
    setErrors({});
    setIsExpanded(false); // Collapse after adding
  }

  return (
    <section aria-label="Add emergency contact">
      <div className="flex items-center justify-between mb-4">
        <h2 id="add-contact-heading" className="text-lg font-bold text-slate-900">
          Add Emergency Contact
        </h2>
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            disabled={atLimit}
            className="text-sm text-brand-primary hover:text-brand-dark font-semibold flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        )}
      </div>

      {atLimit && (
        <div role="alert" className="p-3 rounded-xl bg-warning-light border border-warning text-warning-dark text-sm mb-4">
          <strong>Maximum reached:</strong> You can have up to 5 emergency contacts.
        </div>
      )}

      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          disabled={atLimit}
          className="btn btn-secondary w-full py-3 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
          Add New Contact
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
          aria-disabled={atLimit}
          noValidate
        >
        <div>
          <label htmlFor="contact-name" className="label">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={atLimit || loading}
            aria-label="Contact name"
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            className={`input ${errors.name ? 'input-error' : ''}`}
            placeholder="Full name"
          />
          {errors.name && (
            <p id="contact-name-error" role="alert" aria-live="polite" className="text-xs text-emergency mt-2">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-phone" className="label">
            Phone Number <span className="text-slate-500 text-xs">(Indian: 10 digits or +91...)</span>
          </label>
          <input
            id="contact-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={atLimit || loading}
            placeholder="8369622735 or +918369622735"
            aria-label="Contact phone number"
            aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
            className={`input ${errors.phone ? 'input-error' : ''}`}
          />
          {errors.phone && (
            <p id="contact-phone-error" role="alert" aria-live="polite" className="text-xs text-emergency mt-2">
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className="label">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={atLimit || loading}
            aria-label="Contact email address"
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="email@example.com"
          />
          {errors.email && (
            <p id="contact-email-error" role="alert" aria-live="polite" className="text-xs text-emergency mt-2">
              {errors.email}
            </p>
          )}
        </div>

        {submitError && (
          <div role="alert" aria-live="assertive" className="p-3 rounded-xl bg-emergency-light border border-emergency text-emergency-dark text-sm">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={atLimit || loading}
          aria-label="Add contact"
          className="btn btn-primary w-full py-3"
        >
          {loading ? 'Adding…' : 'Add Contact'}
        </button>
        
        <button
          type="button"
          onClick={() => {
            setIsExpanded(false);
            setErrors({});
            setSubmitError(null);
          }}
          className="btn btn-secondary w-full py-2"
        >
          Cancel
        </button>
      </form>
      )}
    </section>
  );
}
