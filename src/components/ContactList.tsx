import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { ContactCard } from './ContactCard';
import type { EmergencyContact } from '../types';

export function ContactList() {
  const session = useAppStore((s) => s.session);
  const contacts = useAppStore((s) => s.contacts);
  const setContacts = useAppStore((s) => s.setContacts);

  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchContacts() {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch contacts:', error.message);
        return;
      }

      const mapped: EmergencyContact[] = (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        createdAt: new Date(row.created_at),
      }));

      setContacts(mapped);
    }

    fetchContacts();
  }, [session, setContacts]);

  function handleUpdate(updated: EmergencyContact) {
    setContacts(contacts.map((c) => (c.id === updated.id ? updated : c)));
  }

  function handleRemove(id: string) {
    setContacts(contacts.filter((c) => c.id !== id));
  }

  return (
    <section aria-label="Emergency contacts list">
      <h2 id="contacts-heading" className="text-lg font-bold text-slate-900 mb-4">
        Emergency Contacts
      </h2>
      {contacts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-emergency-light mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-emergency" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-slate-900 text-base font-bold mb-2">No emergency contacts yet</p>
          <p className="text-slate-600 text-sm mb-4">
            Add trusted contacts who will be notified in an emergency
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emergency-light text-emergency-dark text-xs font-semibold">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Emergency SOS won't work without contacts
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <ContactCard
                contact={contact}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
