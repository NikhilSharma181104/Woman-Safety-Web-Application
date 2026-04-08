import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export interface EmergencyButtonProps {
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  /** Called instead of onActivate when the contacts list is empty */
  onEmptyContacts?: () => void;
  /** Whether the contacts list is empty — triggers the guard */
  hasNoContacts?: boolean;
}

/**
 * Emergency SOS button with Soft Guardian design.
 * 
 * UX Improvements:
 * - Bottom-center position for thumb accessibility
 * - Haptic feedback on activation (vibration)
 * - Stronger visual urgency with red color and glow
 * - Faster transition (0.1s instead of 0.15s)
 * - Proper focus-visible ring for keyboard users
 * - ARIA live region for screen readers
 * 
 * Validates: Requirements 1.1, 1.2, 1.4, 1.5, 9.1, 9.5
 */
export function EmergencyButton({
  isActive,
  onActivate,
  onDeactivate,
  onEmptyContacts,
  hasNoContacts = false,
}: EmergencyButtonProps) {
  const portalEl = document.getElementById('emergency-portal') ?? document.body;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const session = useAppStore((s) => s.session);

  function triggerHapticFeedback() {
    // Haptic feedback for mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate(isActive ? 200 : [100, 50, 100]); // Double pulse on activate
    }
  }

  async function triggerEmergencyAlert() {
    if (!session?.user?.id) return;
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Call Supabase Edge Function to send automated SMS and calls
      const response = await fetch(
        `${supabaseUrl}/functions/v1/dispatch-alert`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            userId: session.user.id,
            type: 'emergency_start',
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Emergency alert dispatched:', result);
      
      if (result.failed && result.failed.length > 0) {
        console.warn('Some alerts failed:', result.failed);
      }
    } catch (error) {
      console.error('Failed to dispatch emergency alert:', error);
      alert('Emergency alert system error. Please call your contacts directly.');
    }
  }

  function handlePress() {
    triggerHapticFeedback();
    
    if (isActive) {
      onDeactivate();
    } else if (hasNoContacts && onEmptyContacts) {
      onEmptyContacts();
    } else {
      // First activate emergency mode
      onActivate();
      
      // Then trigger automated SMS and calls via Supabase
      triggerEmergencyAlert();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePress();
    }
  }

  // Keep focus visible for keyboard users
  useEffect(() => {
    if (isActive) {
      buttonRef.current?.focus();
    }
  }, [isActive]);

  const ariaLabel = isActive 
    ? 'Emergency mode active. Press to deactivate and stop sharing location.' 
    : 'Activate emergency mode. This will alert your contacts and share your location.';

  return ReactDOM.createPortal(
    <div
      // Bottom-center position for better thumb reach
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]"
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      id="emergency-status"
    >
      <AnimatePresence mode="wait">
        {isActive ? (
          <motion.button
            key="active"
            ref={buttonRef}
            role="button"
            aria-pressed={true}
            aria-label={ariaLabel}
            aria-describedby="emergency-status"
            onClick={handlePress}
            onKeyDown={handleKeyDown}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="
              btn btn-emergency
              px-8 py-4 text-lg
              ring-4 ring-white
              focus-visible:ring-emergency
              min-w-[200px]
            "
          >
            {/* Pulsing alert icon - stronger visual urgency */}
            <motion.span
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [1, 0.6, 1] 
              }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="text-2xl"
              aria-hidden="true"
            >
              🚨
            </motion.span>
            <span className="font-bold">EMERGENCY ACTIVE</span>
          </motion.button>
        ) : (
          <motion.button
            key="idle"
            ref={buttonRef}
            role="button"
            aria-pressed={false}
            aria-label={ariaLabel}
            aria-describedby="emergency-status"
            onClick={handlePress}
            onKeyDown={handleKeyDown}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="
              btn
              bg-emergency hover:bg-emergency-dark
              text-white
              px-10 py-5 text-xl font-bold
              ring-4 ring-white
              focus-visible:ring-emergency
              shadow-soft-lg hover:shadow-glow-red
              min-w-[180px]
            "
          >
            <span className="text-2xl" aria-hidden="true">🛡️</span>
            <span className="font-bold">Emergency SOS</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>,
    portalEl,
  );
}
