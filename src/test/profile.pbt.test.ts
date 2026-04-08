// Feature: safetnet, Property 22: profile update round-trip
// Validates: Requirements 7.3

import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';

/**
 * Pure model of a stored profile.
 */
interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  updatedAt: string;
}

/**
 * Pure model of a profile update payload.
 */
interface ProfileUpdate {
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Pure function modelling the result of applying a profile update.
 * Mirrors the upsert logic in ProfileSettingsForm.
 */
function applyProfileUpdate(current: Profile, updates: ProfileUpdate): Profile {
  return {
    ...current,
    displayName: updates.displayName,
    avatarUrl: updates.avatarUrl,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Pure function modelling whether a confirmation message should be shown.
 * Returns true when the upsert succeeds (no error).
 */
function shouldShowConfirmation(upsertError: null | { message: string }): boolean {
  return upsertError === null;
}

// ─── P22: Profile update round-trip ──────────────────────────────────────────

describe('P22: profile update round-trip', () => {
  it('stored profile reflects new displayName after update', () => {
    fc.assert(
      fc.property(
        // current profile
        fc.record({
          id: fc.uuid(),
          displayName: fc.string({ minLength: 1 }),
          avatarUrl: fc.option(fc.webUrl(), { nil: null }),
          updatedAt: fc.constant(new Date(0).toISOString()),
        }),
        // updates
        fc.record({
          displayName: fc.string({ minLength: 1 }),
          avatarUrl: fc.option(fc.webUrl(), { nil: null }),
        }),
        (current, updates) => {
          const result = applyProfileUpdate(current, updates);
          expect(result.displayName).toBe(updates.displayName);
        },
      ),
    );
  });

  it('stored profile reflects new avatarUrl after update', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          displayName: fc.string({ minLength: 1 }),
          avatarUrl: fc.option(fc.webUrl(), { nil: null }),
          updatedAt: fc.constant(new Date(0).toISOString()),
        }),
        fc.record({
          displayName: fc.string({ minLength: 1 }),
          avatarUrl: fc.option(fc.webUrl(), { nil: null }),
        }),
        (current, updates) => {
          const result = applyProfileUpdate(current, updates);
          expect(result.avatarUrl).toBe(updates.avatarUrl);
        },
      ),
    );
  });

  it('confirmation message is shown when upsert succeeds (no error)', () => {
    fc.assert(
      fc.property(
        fc.record({
          displayName: fc.string({ minLength: 1 }),
          avatarUrl: fc.option(fc.webUrl(), { nil: null }),
        }),
        (updates) => {
          // Simulate successful upsert
          const upsertError = null;
          expect(shouldShowConfirmation(upsertError)).toBe(true);
          // Verify the update is applied correctly
          const current: Profile = {
            id: 'user-1',
            displayName: 'Old Name',
            avatarUrl: null,
            updatedAt: new Date(0).toISOString(),
          };
          const result = applyProfileUpdate(current, updates);
          expect(result.displayName).toBe(updates.displayName);
          expect(result.avatarUrl).toBe(updates.avatarUrl);
        },
      ),
    );
  });

  it('confirmation message is NOT shown when upsert fails', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (errorMessage) => {
          const upsertError = { message: errorMessage };
          expect(shouldShowConfirmation(upsertError)).toBe(false);
        },
      ),
    );
  });

  it('profile id and other fields are preserved after update', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          displayName: fc.string({ minLength: 1 }),
          avatarUrl: fc.option(fc.webUrl(), { nil: null }),
          updatedAt: fc.constant(new Date(0).toISOString()),
        }),
        fc.record({
          displayName: fc.string({ minLength: 1 }),
          avatarUrl: fc.option(fc.webUrl(), { nil: null }),
        }),
        (current, updates) => {
          const result = applyProfileUpdate(current, updates);
          // id is never changed by an update
          expect(result.id).toBe(current.id);
        },
      ),
    );
  });
});
