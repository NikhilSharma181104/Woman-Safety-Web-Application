import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { validateCheckInDuration } from '../utils/validators';
import type { CheckIn } from '../types';

const PRESET_DURATIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hr', value: 60 },
  { label: '2 hr', value: 120 },
];

export function CheckInForm() {
  const [destinationLabel, setDestinationLabel] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [durationError, setDurationError] = useState<string | null>(null);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const session = useAppStore((s) => s.session);
  const setActiveCheckIn = useAppStore((s) => s.setActiveCheckIn);

  function handleDurationChange(value: string) {
    const parsed = value === '' ? '' : parseInt(value, 10);
    setDurationMinutes(parsed);
    if (parsed !== '') {
      setDurationError(validateCheckInDuration(parsed as number));
    } else {
      setDurationError(null);
    }
  }

  function handlePreset(value: number) {
    setDurationMinutes(value);
    setDurationError(validateCheckInDuration(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate label
    if (!destinationLabel.trim()) {
      setLabelError('Destination label is required.');
      return;
    }
    setLabelError(null);

    // Validate duration
    if (durationMinutes === '') {
      setDurationError('Duration is required.');
      return;
    }
    const durationErr = validateCheckInDuration(durationMinutes as number);
    if (durationErr) {
      setDurationError(durationErr);
      return;
    }

    if (!session?.user?.id) {
      setSubmitError('You must be logged in to create a check-in.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (durationMinutes as number) * 60 * 1000);

      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          user_id: session.user.id,
          destination_label: destinationLabel.trim(),
          duration_minutes: durationMinutes as number,
          expires_at: expiresAt.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      const checkIn: CheckIn = {
        id: data.id,
        userId: data.user_id,
        destinationLabel: data.destination_label,
        durationMinutes: data.duration_minutes,
        expiresAt: new Date(data.expires_at),
        status: data.status,
        createdAt: new Date(data.created_at),
      };

      setActiveCheckIn(checkIn);
      setDestinationLabel('');
      setDurationMinutes('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create check-in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Create check-in"
      className="space-y-4"
    >
      <h2 id="checkin-heading" className="text-lg font-bold text-slate-900">New Check-In</h2>

      {/* Destination label */}
      <div>
        <label htmlFor="destination-label" className="label">
          Where are you going?
        </label>
        <input
          id="destination-label"
          type="text"
          value={destinationLabel}
          onChange={(e) => {
            setDestinationLabel(e.target.value);
            if (e.target.value.trim()) setLabelError(null);
          }}
          placeholder="e.g., Home, Office, Friend's house"
          aria-label="Destination label"
          aria-describedby={labelError ? 'label-error' : undefined}
          aria-invalid={!!labelError}
          className={`input ${labelError ? 'input-error' : ''}`}
        />
        {labelError && (
          <p id="label-error" role="alert" aria-live="polite" className="text-sm text-emergency mt-2">
            {labelError}
          </p>
        )}
      </div>

      {/* Duration presets */}
      <div>
        <span className="label">How long will it take?</span>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {PRESET_DURATIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePreset(p.value)}
              aria-label={`Set duration to ${p.label}`}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                durationMinutes === p.value
                  ? 'bg-brand-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration input */}
      <div>
        <label htmlFor="duration-minutes" className="label">
          Or enter custom minutes <span className="text-slate-500 text-xs">(5-1440)</span>
        </label>
        <input
          id="duration-minutes"
          type="number"
          min={5}
          max={1440}
          value={durationMinutes}
          onChange={(e) => handleDurationChange(e.target.value)}
          placeholder="Enter minutes"
          aria-label="Duration in minutes"
          aria-describedby={durationError ? 'duration-error' : undefined}
          aria-invalid={!!durationError}
          className={`input ${durationError ? 'input-error' : ''}`}
        />
        {durationError && (
          <p id="duration-error" role="alert" aria-live="polite" className="text-sm text-emergency mt-2">
            {durationError}
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
        disabled={submitting}
        aria-label="Start check-in"
        className="btn btn-primary w-full py-3"
      >
        {submitting ? 'Starting…' : 'Start Check-In'}
      </button>
    </form>
  );
}
