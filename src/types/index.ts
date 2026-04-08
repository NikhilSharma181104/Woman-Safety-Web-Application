export interface CheckIn {
  id: string;
  userId: string;
  destinationLabel: string;
  durationMinutes: number;
  expiresAt: Date;
  status: 'active' | 'completed' | 'alerted';
  createdAt: Date;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  createdAt: Date;
}

export interface LocationState {
  coords: GeolocationCoordinates | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  lastTransmittedAt: Date | null;
  error: string | null;
}

export type { Session } from '@supabase/supabase-js';
