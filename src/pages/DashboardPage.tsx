import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { EmergencyButtonContainer } from '../components/EmergencyButtonContainer';
import { EmergencyStatusBanner } from '../components/EmergencyStatusBanner';
import { LocationErrorBanner } from '../components/LocationErrorBanner';
import { CheckInForm } from '../components/CheckInForm';
import { CheckInCard } from '../components/CheckInCard';
import { CheckInHistoryTable } from '../components/CheckInHistoryTable';
import { ContactList } from '../components/ContactList';
import { AddContactForm } from '../components/AddContactForm';
import { ProfileSettingsForm } from '../components/ProfileSettingsForm';
import { useLocationService } from '../hooks/useLocationService';
import type { EmergencyContact } from '../types';

/**
 * Main authenticated dashboard with Soft Guardian design.
 * 
 * UX Improvements:
 * - Single column layout until lg (1024px) for better tablet experience
 * - Emergency contacts prioritized first on mobile
 * - Card-based responsive layout: 320px → 2560px
 * - Proper ARIA regions for accessibility
 * - Deferred loading of non-critical data (history)
 * 
 * Validates: Requirements 7.1, 7.2, 9.4
 */
export default function DashboardPage() {
  const emergencyActive = useAppStore((s) => s.emergencyActive);
  const activeCheckIn = useAppStore((s) => s.activeCheckIn);
  const contacts = useAppStore((s) => s.contacts);
  const setContacts = useAppStore((s) => s.setContacts);
  const locationState = useLocationService(emergencyActive);

  function handleContactAdded(contact: EmergencyContact) {
    setContacts([...contacts, contact]);
  }

  const showLocationError = locationState.permissionStatus === 'denied';

  return (
    <>
      {/* Skip to content link for keyboard users */}
      <a href="#dashboard-content" className="skip-to-content">
        Skip to dashboard content
      </a>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-slate-50"
      >
        {/* Emergency portal button — always rendered on every authenticated screen */}
        <EmergencyButtonContainer />

        <div id="dashboard-content" className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
            <div className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Emergency status banner — only while active */}
          {emergencyActive && (
            <div 
              className="card p-6 border-emergency bg-emergency-light"
              role="alert"
              aria-live="assertive"
            >
              <EmergencyStatusBanner locationState={locationState} />
            </div>
          )}

          {/* Location permission error banner */}
          {showLocationError && (
            <div 
              className="card p-6 border-warning bg-warning-light"
              role="alert"
              aria-live="polite"
            >
              <LocationErrorBanner />
            </div>
          )}

          {/*
           * Responsive grid - Mobile-first improvements:
           *   - 320px-1023px (xs-md): single column (emergency contacts first)
           *   - 1024px+ (lg): two columns
           *   - 1280px+ (xl): three columns
           *   - 2560px (2xl): three columns with wider max-width
           */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Emergency contacts list - FIRST on mobile (most critical) */}
            <section 
              className="card p-6"
              role="region"
              aria-labelledby="contacts-heading"
            >
              <ContactList />
            </section>

            {/* Active check-in card or check-in form */}
            <section 
              className="card p-6"
              role="region"
              aria-labelledby="checkin-heading"
            >
              {activeCheckIn ? (
                <CheckInCard checkIn={activeCheckIn} />
              ) : (
                <CheckInForm />
              )}
            </section>

            {/* Add contact form */}
            <section 
              className="card p-6"
              role="region"
              aria-labelledby="add-contact-heading"
            >
              <AddContactForm onAdded={handleContactAdded} />
            </section>

            {/* Profile settings */}
            <section 
              className="card p-6 lg:col-span-2 xl:col-span-1"
              role="region"
              aria-labelledby="profile-heading"
            >
              <ProfileSettingsForm />
            </section>

            {/* Check-in history — full width, lazy loaded */}
            <section 
              className="card p-6 lg:col-span-2 xl:col-span-3"
              role="region"
              aria-labelledby="history-heading"
            >
              <CheckInHistoryTable />
            </section>
          </div>
        </div>
      </motion.div>
    </>
  );
}
