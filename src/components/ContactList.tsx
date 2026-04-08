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
          <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <p className="text-slate-600 text-sm font-semibold mb-1">No emergency contacts yet</p>
          <p className="text-slate-500 text-xs">Add your first contact below to get started</p>
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
