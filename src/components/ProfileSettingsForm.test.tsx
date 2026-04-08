import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ─── Mock Supabase ────────────────────────────────────────────────────────────

const mockUpsert = vi.fn();

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      upsert: mockUpsert,
    }),
  },
}));

// ─── Mock Zustand store ───────────────────────────────────────────────────────

vi.mock('../store/useAppStore', () => ({
  useAppStore: (selector: (s: { session: { user: { id: string } } | null }) => unknown) =>
    selector({ session: { user: { id: 'user-123' } } }),
}));

// ─── Import component after mocks ────────────────────────────────────────────

import { ProfileSettingsForm } from './ProfileSettingsForm';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfileSettingsForm — profile update round-trip (P22)', () => {
  beforeEach(() => {
    mockUpsert.mockReset();
  });

  it('shows confirmation message after successful upsert', async () => {
    mockUpsert.mockResolvedValue({ error: null });

    render(<ProfileSettingsForm />);

    const nameInput = screen.getByLabelText('Display name');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });

    const submitBtn = screen.getByRole('button', { name: /save profile settings/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully.')).toBeInTheDocument();
    });
  });

  it('shows error message when upsert fails', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } });

    render(<ProfileSettingsForm />);

    const submitBtn = screen.getByRole('button', { name: /save profile settings/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('DB error')).toBeInTheDocument();
    });
  });

  it('does not show confirmation message before submission', () => {
    mockUpsert.mockResolvedValue({ error: null });

    render(<ProfileSettingsForm />);

    expect(screen.queryByText('Profile updated successfully.')).not.toBeInTheDocument();
  });

  it('persists display name and avatar URL to profiles table', async () => {
    mockUpsert.mockResolvedValue({ error: null });

    render(<ProfileSettingsForm />);

    fireEvent.change(screen.getByLabelText('Display name'), {
      target: { value: 'Bob' },
    });
    fireEvent.change(screen.getByLabelText('Avatar URL'), {
      target: { value: 'https://example.com/avatar.png' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save profile settings/i }));

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          display_name: 'Bob',
          avatar_url: 'https://example.com/avatar.png',
        }),
      );
    });
  });
});
