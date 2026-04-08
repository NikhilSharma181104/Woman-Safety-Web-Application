/**
 * Shown when location permission has been denied.
 * Validates: Requirement 2.3
 */
export function LocationErrorBanner() {
  function requestPermission() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Success - reload page to update state
          window.location.reload();
        },
        (error) => {
          console.error('Location permission error:', error);
          alert('Please enable location access in your browser settings.');
        }
      );
    }
  }

  return (
    <div className="p-6 rounded-xl bg-warning-light border-2 border-warning">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-warning flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-warning-dark mb-2">
            Location Access Denied
          </h3>
          <p className="text-sm text-slate-700 mb-3">
            SafeTNet needs location access to share your position during emergencies.
          </p>

          {/* Instructions */}
          <ol className="text-sm text-slate-700 space-y-1 mb-4 list-decimal list-inside">
            <li>Click the lock icon in your browser's address bar</li>
            <li>Find "Location" in the permissions list</li>
            <li>Change it to "Allow"</li>
            <li>Refresh this page</li>
          </ol>

          <button 
            onClick={requestPermission}
            className="btn btn-primary"
          >
            Request Permission Again
          </button>
        </div>
      </div>
    </div>
  );
}
