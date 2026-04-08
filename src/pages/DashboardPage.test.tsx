import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from './DashboardPage';

// ─── Mock child components ────────────────────────────────────────────────────

vi.mock('../components/EmergencyButtonContainer', () => ({
  EmergencyButtonContainer: () => <div data-testid="emergency-button-container" />,
}));

vi.mock('../components/EmergencyStatusBanner', () => ({
  EmergencyStatusBanner: () => <div data-testid="emergency-status-banner" />,
}));

vi.mock('../components/LocationErrorBanner', () => ({
  LocationErrorBanner: () => <div data-testid="location-error-banner" />,
}));

vi.mock('../components/CheckInForm', () => ({
  CheckInForm: () => <div data-testid="check-in-form" />,
}));

vi.mock('../components/CheckInCard', () => ({
  CheckInCard: () => <div data-testid="check-in-card" />,
}));

vi.mock('../components/CheckInHistoryTable', () => ({
  CheckInHistoryTable: () => <div data-testid="check-in-history-table" />,
}));

vi.mock('../components/ContactList', () => ({
  ContactList: () => <div data-testid="contact-list" />,
}));

vi.mock('../components/AddContactForm', () => ({
  AddContactForm: () => <div data-testid="add-contact-form" />,
}));

vi.mock('../components/ProfileSettingsForm', () => ({
  ProfileSettingsForm: () => <div data-testid="profile-settings-form" />,
}));

vi.mock('../hooks/useLocationService', () => ({
  useLocationService: () => ({
    coords: null,
    permissionStatus: 'unknown',
    lastTransmittedAt: null,
    error: null,
  }),
}));

// ─── Mock Zustand store ───────────────────────────────────────────────────────

const mockStore: Record<string, unknown> = {
  emergencyActive: false,
  activeCheckIn: null,
  contacts: [],
  setContacts: vi.fn(),
};

vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (s: typeof mockStore) => unknown) => selector(mockStore),
}));

// ─── Mock framer-motion ───────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DashboardPage', () => {
  beforeEach(() => {
    mockStore.emergencyActive = false;
    mockStore.activeCheckIn = null;
    mockStore.contacts = [];
  });

  it('renders EmergencyButtonContainer (portal overlay)', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('emergency-button-container')).toBeInTheDocument();
  });

  it('renders CheckInForm when no active check-in', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('check-in-form')).toBeInTheDocument();
    expect(screen.queryByTestId('check-in-card')).not.toBeInTheDocument();
  });

  it('renders CheckInCard when there is an active check-in', () => {
    mockStore.activeCheckIn = {
      id: '1',
      userId: 'u1',
      destinationLabel: 'Home',
      durationMinutes: 30,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      status: 'active',
      createdAt: new Date(),
    };
    render(<DashboardPage />);
    expect(screen.getByTestId('check-in-card')).toBeInTheDocument();
    expect(screen.queryByTestId('check-in-form')).not.toBeInTheDocument();
  });

  it('renders CheckInHistoryTable', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('check-in-history-table')).toBeInTheDocument();
  });

  it('renders ContactList', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('contact-list')).toBeInTheDocument();
  });

  it('renders AddContactForm', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('add-contact-form')).toBeInTheDocument();
  });

  it('renders ProfileSettingsForm', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('profile-settings-form')).toBeInTheDocument();
  });

  it('does NOT render EmergencyStatusBanner when emergency is inactive', () => {
    render(<DashboardPage />);
    expect(screen.queryByTestId('emergency-status-banner')).not.toBeInTheDocument();
  });

  it('renders EmergencyStatusBanner when emergency is active', () => {
    mockStore.emergencyActive = true;
    render(<DashboardPage />);
    expect(screen.getByTestId('emergency-status-banner')).toBeInTheDocument();
  });
});


