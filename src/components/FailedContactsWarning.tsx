import type { EmergencyContact } from '../types';

interface FailedContactsWarningProps {
  contacts: EmergencyContact[];
  onDismiss?: () => void;
}

export function FailedContactsWarning({ contacts, onDismiss }: FailedContactsWarningProps) {
  if (contacts.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-amber-500" aria-hidden="true">
            ⚠️
          </span>
          <div>
            <p className="font-semibold">Some contacts could not be reached</p>
            <p className="mt-1 text-sm text-amber-800">
              SMS delivery failed for the following contacts after 3 attempts:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-amber-800">
              {contacts.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss warning"
            className="shrink-0 rounded p-1 text-amber-600 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
