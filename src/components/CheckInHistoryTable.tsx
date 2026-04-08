import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { IS_DEMO, demoData } from '../lib/demo';
import { useAppStore } from '../store/useAppStore';
import type { CheckIn } from '../types';

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CheckInHistoryTable() {
  const session = useAppStore((s) => s.session);
  const activeCheckIn = useAppStore((s) => s.activeCheckIn);
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    if (IS_DEMO) {
      setHistory(demoData.getCheckIns());
      setLoading(false);
      return;
    }

    async function fetchHistory() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', session!.user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (fetchError) throw fetchError;

        setHistory(
          (data ?? []).map((row) => ({
            id: row.id,
            userId: row.user_id,
            destinationLabel: row.destination_label,
            durationMinutes: row.duration_minutes,
            expiresAt: new Date(row.expires_at),
            status: row.status as CheckIn['status'],
            createdAt: new Date(row.created_at),
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load check-in history.');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [session, activeCheckIn]); // re-fetch when active check-in changes (e.g. after deactivation)

  if (loading) {
    return (
      <div aria-label="Loading check-in history" className="text-slate-500 text-sm py-4">
        Loading history…
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" aria-live="assertive" className="p-3 rounded-xl bg-emergency-light border border-emergency text-emergency-dark text-sm">
        {error}
      </div>
    );
  }

  return (
    <section aria-label="Check-in history">
      <h2 id="history-heading" className="text-lg font-bold text-slate-900 mb-4">Check-In History</h2>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-slate-600 text-sm font-semibold mb-1">No check-ins yet</p>
          <p className="text-slate-500 text-xs">Your check-in history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{item.destinationLabel}</p>
                <p className="text-sm text-slate-600">
                  {formatRelativeTime(item.createdAt)} · {' '}
                  {item.durationMinutes < 60
                    ? `${item.durationMinutes} min`
                    : `${Math.round(item.durationMinutes / 60)} hr`}
                </p>
              </div>
              
              {/* Status badge with color coding */}
              <span className={`badge ${
                item.status === 'completed' ? 'badge-success' :
                item.status === 'alerted' ? 'badge-error' :
                'bg-slate-200 text-slate-700'
              }`}>
                {item.status === 'completed' && (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Completed
                  </>
                )}
                {item.status === 'alerted' && (
                  <>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Alerted
                  </>
                )}
                {item.status === 'active' && 'Active'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
