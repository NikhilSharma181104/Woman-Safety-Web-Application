import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
  
  // Progressive urgency levels for better UX
  const getUrgencyLevel = () => {
    if (isExpired) return 'expired';
    if (remainingMinutes < 5) return 'critical';
    if (remainingMinutes < 10) return 'urgent';
    if (remainingMinutes < 30) return 'warning';
    return 'safe';
  };
  
  const urgencyLevel = getUrgencyLevel();
  
  const urgencyStyles = {
    expired: {
      bg: 'bg-emergency-light border-2 border-emergency',
      text: 'text-emergency',
      badge: 'badge-error',
      badgeDot: 'bg-emergency',
      label: 'Expired'
    },
    critical: {
      bg: 'bg-emergency-light border-2 border-emergency',
      text: 'text-emergency',
      badge: 'badge-error',
      badgeDot: 'bg-emergency animate-pulse',
      label: 'Critical'
    },
    urgent: {
      bg: 'bg-orange-50 border-2 border-orange-400',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-700 border-orange-300',
      badgeDot: 'bg-orange-500 animate-pulse',
      label: 'Urgent'
    },
    warning: {
      bg: 'bg-yellow-50 border-2 border-yellow-400',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      badgeDot: 'bg-yellow-500',
      label: 'Warning'
    },
    safe: {
      bg: 'bg-success-light border-2 border-success',
      text: 'text-success-dark',
      badge: 'badge-success',
      badgeDot: 'bg-success animate-pulse',
      label: 'Active'
    }
  };
  
  const currentStyle = urgencyStyles[urgencyLevel];

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
        
        <span className={`badge ${currentStyle.badge}`}>
          <span className={`w-2 h-2 rounded-full ${currentStyle.badgeDot}`} />
          {currentStyle.label}
        </span>
      </div>

      {/* Countdown timer with progressive urgency styling */}
      <div 
        aria-label="Time remaining" 
        className={`text-center py-8 rounded-xl transition-colors ${currentStyle.bg}`}
      >
        <span className={`text-5xl font-mono font-bold tabular-nums ${currentStyle.text}`}>
          {formatCountdown(remaining)}
        </span>
        <p className="text-sm text-slate-600 mt-2">
          {isExpired ? 'Check-in expired!' : 
           urgencyLevel === 'critical' ? 'Hurry! Time running out' :
           urgencyLevel === 'urgent' ? 'Please check in soon' :
           urgencyLevel === 'warning' ? 'Check in when you arrive' :
           'Time remaining'}
        </p>
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
