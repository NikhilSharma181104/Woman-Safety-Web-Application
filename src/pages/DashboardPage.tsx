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
import { ProfileCard } from '../components/ProfileCard';
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
           * SAFETY-FIRST LAYOUT:
           * 1. Active Check-In (if exists) - MOST CRITICAL
           * 2. Emergency Contacts - SECOND PRIORITY  
           * 3. Add Contact + New Check-In - QUICK ACTIONS
           * 4. Profile - Less critical
           * 5. History - Bottom
           */}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Active check-in card - HIGHEST PRIORITY when active */}
            {activeCheckIn && (
              <section 
                className="card p-6 lg:col-span-2 xl:col-span-3 border-2 border-info"
                role="region"
                aria-labelledby="checkin-heading"
              >
                <CheckInCard checkIn={activeCheckIn} />
              </section>
            )}

            {/* Emergency contacts list - FIRST on mobile (most critical) */}
            <section 
              className="card p-6"
              role="region"
              aria-labelledby="contacts-heading"
            >
              <ContactList />
            </section>

            {/* New check-in form or Add contact - side by side on larger screens */}
            {!activeCheckIn && (
              <section 
                className="card p-6"
                role="region"
                aria-labelledby="checkin-heading"
              >
                <CheckInForm />
              </section>
            )}

            {/* Add contact form */}
            <section 
              className="card p-6"
              role="region"
              aria-labelledby="add-contact-heading"
            >
              <AddContactForm onAdded={handleContactAdded} />
            </section>

            {/* Profile card - moved down, less prominent */}
            <section 
              className="card p-6 lg:col-span-2 xl:col-span-3"
              role="region"
              aria-labelledby="profile-heading"
            >
              <ProfileCard />
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

          {/* Bottom padding for emergency button on mobile */}
          <div className="h-32 lg:h-0" aria-hidden="true" />
        </div>
      </motion.div>
    </>
  );
}
