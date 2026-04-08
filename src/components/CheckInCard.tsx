import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { IS_DEMO, demoData } from '../lib/demo';
import { useAppStore } from '../store/useAppStore';
import type { CheckIn } from '../types';

interface CheckInCardProps {
  checkIn: CheckIn;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

export function CheckInCard({ checkIn }: CheckInCardProps) {
  const setActiveCheckIn = useAppStore((s) => s.setActiveCheckIn);
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, checkIn.expiresAt.getTime() - Date.now()),
  );
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer — updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      const ms = Math.max(0, checkIn.expiresAt.getTime() - Date.now());
      setRemaining(ms);
      if (ms === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [checkIn.expiresAt]);

  async function handleDeactivate() {
    setDeactivating(true);
    setError(null);

    try {
      if (IS_DEMO) {
        demoData.deactivateCheckIn(checkIn.id);
        setActiveCheckIn(null);
        return;
      }

      const { error: updateError } = await supabase
        .from('check_ins')
        .update({ status: 'completed' })
        .eq('id', checkIn.id);

      if (updateError) throw updateError;

      // Cancel client-side countdown and clear active check-in (Requirement 4.3)
      setActiveCheckIn(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate check-in.');
      setDeactivating(false);
    }
  }

  const isExpired = remaining === 0;
  const remainingMinutes = Math.floor(remaining / 60000);
  const isUrgent = remainingMinutes < 5;

  return (
    <div
      role="region"
      aria-label={`Active check-in: ${checkIn.destinationLabel}`}
      className="space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Active Check-In</h3>
          <p className="text-sm text-slate-600 mt-1">{checkIn.destinationLabel}</p>
        </div>
        
        <span className={`badge ${
          isExpired ? 'badge-error' : 'badge-info'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isExpired ? 'bg-emergency' : 'bg-info animate-pulse'
          }`} />
          {isExpired ? 'Expired' : 'Active'}
        </span>
      </div>

      {/* Countdown timer with urgency styling */}
      <div 
        aria-label="Time remaining" 
        className={`text-center py-8 rounded-xl transition-colors ${
          isUrgent && !isExpired
            ? 'bg-emergency-light border-2 border-emergency' 
            : 'bg-slate-100'
        }`}
      >
        <span className={`text-5xl font-mono font-bold tabular-nums ${
          isUrgent && !isExpired ? 'text-emergency' : 'text-slate-900'
        }`}>
          {formatCountdown(remaining)}
        </span>
        <p className="text-sm text-slate-600 mt-2">Time remaining</p>
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="p-3 rounded-xl bg-emergency-light border border-emergency text-emergency-dark text-sm">
          {error}
        </div>
      )}

      {/* Deactivation button (Requirement 4.3) */}
      <button
        type="button"
        onClick={handleDeactivate}
        disabled={deactivating}
        aria-label="Deactivate check-in — I arrived safely"
        className="btn btn-primary w-full py-3 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {deactivating ? 'Deactivating…' : "I'm Safe — Deactivate"}
      </button>
    </div>
  );
}
