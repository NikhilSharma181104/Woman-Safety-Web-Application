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
  }

  return (
    <section aria-label="Add emergency contact">
      <h2 id="add-contact-heading" className="text-lg font-bold text-slate-900 mb-4">
        Add Emergency Contact
      </h2>

      {atLimit && (
        <div role="alert" className="p-3 rounded-xl bg-warning-light border border-warning text-warning-dark text-sm mb-4">
          <strong>Maximum reached:</strong> You can have up to 5 emergency contacts.
        </div>
      )}

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
      </form>
    </section>
  );
}
