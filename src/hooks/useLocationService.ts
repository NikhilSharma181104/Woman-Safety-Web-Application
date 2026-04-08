import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import type { LocationState } from '../types';

const THROTTLE_MS = 30_000; // 30 seconds

/**
 * Watches the device's GPS position while `active` is true.
 * Writes coordinates to `location_updates` at most once every 30 s.
 * Stops all tracking and writes when `active` becomes false.
 *
 * Validates: Requirements 2.1, 2.2, 2.3
 */
export function useLocationService(active: boolean): LocationState {
  const session = useAppStore((s) => s.session);
  const locationState = useAppStore((s) => s.locationState);
  const setLocationState = useAppStore((s) => s.setLocationState);

  const watchIdRef = useRef<number | null>(null);
  const lastWriteTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      // Stop watching when no longer active
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setLocationState({ error: 'Geolocation is not supported by your browser.', permissionStatus: 'denied' });
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const now = Date.now();

        setLocationState({
          coords: position.coords,
          permissionStatus: 'granted',
          error: null,
        });

        // Throttle writes to at most once every 30 s
        if (now - lastWriteTimeRef.current < THROTTLE_MS) {
          return;
        }

        lastWriteTimeRef.current = now;

        const userId = session?.user?.id;
        if (!userId) return;

        const recorded_at = new Date().toISOString();

        const { error } = await supabase.from('location_updates').insert({
          user_id: userId,
          latitude,
          longitude,
          accuracy,
          recorded_at,
        });

        if (!error) {
          setLocationState({ lastTransmittedAt: new Date(recorded_at) });
        }
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setLocationState({
            permissionStatus: 'denied',
            error: 'Location access denied. Please enable location in your browser settings to share your location during emergencies.',
          });
        } else {
          setLocationState({
            error: `Location error: ${err.message}`,
          });
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active, session, setLocationState]);

  return locationState;
}
