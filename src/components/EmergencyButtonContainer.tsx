import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { EmergencyButton } from './EmergencyButton';

/**
 * Connects EmergencyButton to the Zustand store and handles the
 * empty-contacts guard (Requirement 1.6 / task 3.3).
 */
export function EmergencyButtonContainer() {
  const emergencyActive = useAppStore((s) => s.emergencyActive);
  const contacts = useAppStore((s) => s.contacts);
  const activateEmergency = useAppStore((s) => s.activateEmergency);
  const deactivateEmergency = useAppStore((s) => s.deactivateEmergency);

  const [showEmptyPrompt, setShowEmptyPrompt] = useState(false);

  function handleEmptyContacts() {
    setShowEmptyPrompt(true);
    // Auto-dismiss after 4 s
    setTimeout(() => setShowEmptyPrompt(false), 4000);
  }

  return (
    <>
      <EmergencyButton
        isActive={emergencyActive}
        onActivate={activateEmergency}
        onDeactivate={deactivateEmergency}
        hasNoContacts={contacts.length === 0}
        onEmptyContacts={handleEmptyContacts}
      />

      {showEmptyPrompt && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            bottom: '5.5rem',
            right: '1.5rem',
            zIndex: 9999,
            backgroundColor: '#1a2744',
            color: '#ffffff',
            borderRadius: '0.75rem',
            padding: '0.875rem 1.25rem',
            maxWidth: '18rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
        >
          <strong>No emergency contacts</strong>
          <p style={{ margin: '0.25rem 0 0' }}>
            Please add at least one emergency contact before activating emergency mode.
          </p>
          <button
            onClick={() => setShowEmptyPrompt(false)}
            aria-label="Dismiss prompt"
            style={{
              marginTop: '0.5rem',
              background: 'none',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '0.375rem',
              color: '#ffffff',
              padding: '0.25rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
