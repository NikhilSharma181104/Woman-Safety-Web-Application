import type { LocationState } from '../types';

interface EmergencyStatusBannerProps {
  locationState: LocationState;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs} seconds ago`;
  
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
}

/**
 * Displayed while Emergency_Mode is active.
 * Shows sharing status and last transmitted timestamp.
 * Validates: Requirements 2.4
 */
export function EmergencyStatusBanner({ locationState }: EmergencyStatusBannerProps) {
  const { permissionStatus, lastTransmittedAt } = locationState;

  const sharingUnavailable = permissionStatus === 'denied';

  return (
    <div className="p-6 rounded-xl bg-emergency-light border-2 border-emergency">
      <div className="flex items-start gap-4">
        {/* Pulsing icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emergency flex items-center justify-center">
          <span className="text-2xl animate-pulse" aria-hidden="true">🚨</span>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-emergency-dark mb-2">
            Emergency Mode Active
          </h3>
          <p className="text-sm text-slate-700 mb-3">
            Your location is being shared with all emergency contacts every 30 seconds.
          </p>

          {/* Live location status */}
          {sharingUnavailable ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-warning-dark">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Location sharing unavailable
              </span>
            </div>
          ) : lastTransmittedAt ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-success-dark">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Sharing location
              </span>
              <span className="text-slate-500">
                Last update: {formatRelativeTime(lastTransmittedAt)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Acquiring location…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
