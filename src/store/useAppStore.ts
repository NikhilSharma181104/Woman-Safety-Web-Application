import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { CheckIn, EmergencyContact, LocationState } from '../types';

interface AppStore {
  // state
  session: Session | null;
  emergencyActive: boolean;
  activeCheckIn: CheckIn | null;
  contacts: EmergencyContact[];
  locationState: LocationState;
  failedContacts: EmergencyContact[];
  // actions
  activateEmergency: () => Promise<void>;
  deactivateEmergency: () => Promise<void>;
  setActiveCheckIn: (c: CheckIn | null) => void;
  setSession: (session: Session | null) => void;
  setContacts: (contacts: EmergencyContact[]) => void;
  setLocationState: (state: Partial<LocationState>) => void;
  setFailedContacts: (contacts: EmergencyContact[]) => void;
}

const defaultLocationState: LocationState = {
  coords: null,
  permissionStatus: 'unknown',
  lastTransmittedAt: null,
  error: null,
};

async function callDispatchAlert(
  userId: string,
  type: 'emergency_start' | 'emergency_end' | 'checkin_expired',
): Promise<{ dispatched: EmergencyContact[]; failed: EmergencyContact[] }> {
  // Lazy import to avoid module-level Supabase client instantiation in test environments
  const { supabase } = await import('../lib/supabase');
  const { data, error } = await supabase.functions.invoke('dispatch-alert', {
    body: { userId, type },
  });

  if (error) {
    console.error('dispatch-alert error:', error);
    return { dispatched: [], failed: [] };
  }

  return data as { dispatched: EmergencyContact[]; failed: EmergencyContact[] };
}

export const useAppStore = create<AppStore>((set, get) => ({
  session: null,
  emergencyActive: false,
  activeCheckIn: null,
  contacts: [],
  locationState: defaultLocationState,
  failedContacts: [],

  activateEmergency: async () => {
    set({ emergencyActive: true, failedContacts: [] });

    const userId = get().session?.user?.id;
    if (!userId) return;

    const { failed } = await callDispatchAlert(userId, 'emergency_start');
    set({ failedContacts: failed });
  },

  deactivateEmergency: async () => {
    set({ emergencyActive: false });

    const userId = get().session?.user?.id;
    if (!userId) return;

    await callDispatchAlert(userId, 'emergency_end');
  },

  setActiveCheckIn: (c) => set({ activeCheckIn: c }),

  setSession: (session) => set({ session }),

  setContacts: (contacts) => set({ contacts }),

  setLocationState: (state) =>
    set((prev) => ({ locationState: { ...prev.locationState, ...state } })),

  setFailedContacts: (contacts) => set({ failedContacts: contacts }),
}));
