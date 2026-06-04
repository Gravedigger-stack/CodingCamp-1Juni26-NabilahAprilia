/**
 * Unit tests for NotificationService.dismiss(id)
 * Covers task 8.3: find notification element by data-id, remove from DOM,
 * and clear the timeout if it hasn't fired yet.
 * References: Requirement 9.5, 7.8, 8.7; Design — Error Handling section
 */

'use strict';

const { NotificationService } = require('../../js/app.js');

beforeEach(() => {
  // Reset DOM before each test
  document.body.innerHTML = '';
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ── Helper ───────────────────────────────────────────────────────────────────

function getNotificationById(id) {
  return document.querySelector(`.notification[data-id="${id}"]`);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationService.dismiss', () => {

  // ── DOM removal ───────────────────────────────────────────────────────────

  test('removes the notification element from the DOM', () => {
    const id = NotificationService.show('Test message', 'info');
    expect(getNotificationById(id)).not.toBeNull();

    NotificationService.dismiss(id);

    expect(getNotificationById(id)).toBeNull();
  });

  test('does nothing when called with a non-existent id', () => {
    // Should not throw when id doesn't match any notification
    expect(() => {
      NotificationService.dismiss('non-existent-id');
    }).not.toThrow();
  });

  test('does nothing when the notification was already auto-dismissed', () => {
    const id = NotificationService.show('Auto dismiss', 'info');
    // Let the auto-dismiss timer fire
    jest.advanceTimersByTime(4000);
    expect(getNotificationById(id)).toBeNull();

    // Calling dismiss again should not throw
    expect(() => {
      NotificationService.dismiss(id);
    }).not.toThrow();
  });

  // ── Timer cancellation ────────────────────────────────────────────────────

  test('cancels the auto-dismiss timer so it does not fire later', () => {
    const id = NotificationService.show('Cancel timer test', 'info');

    // Dismiss early, before 4s
    NotificationService.dismiss(id);

    // Advancing time further should not cause errors (timer was cleared)
    expect(() => {
      jest.advanceTimersByTime(5000);
    }).not.toThrow();
  });

  test('early dismiss prevents duplicate removal at 4000ms', () => {
    const id = NotificationService.show('Early dismiss', 'info');

    // Dismiss before the 4s timer
    NotificationService.dismiss(id);
    expect(getNotificationById(id)).toBeNull();

    // Advancing to 4000ms should not throw (no double-remove)
    expect(() => {
      jest.advanceTimersByTime(4000);
    }).not.toThrow();
    // Still null (was already removed)
    expect(getNotificationById(id)).toBeNull();
  });

  // ── Multiple notifications ─────────────────────────────────────────────────

  test('dismissing one notification does not affect others', () => {
    const id1 = NotificationService.show('First', 'info');
    const id2 = NotificationService.show('Second', 'error');
    const id3 = NotificationService.show('Third', 'validation');

    NotificationService.dismiss(id2);

    expect(getNotificationById(id1)).not.toBeNull();
    expect(getNotificationById(id2)).toBeNull();
    expect(getNotificationById(id3)).not.toBeNull();
  });

  test('each notification can be dismissed individually', () => {
    const id1 = NotificationService.show('First', 'info');
    const id2 = NotificationService.show('Second', 'error');

    NotificationService.dismiss(id1);
    expect(getNotificationById(id1)).toBeNull();
    expect(getNotificationById(id2)).not.toBeNull();

    NotificationService.dismiss(id2);
    expect(getNotificationById(id2)).toBeNull();
  });

  // ── Dismiss via close button ───────────────────────────────────────────────

  test('close button click calls dismiss and removes the notification', () => {
    const id = NotificationService.show('Close button test', 'info');
    const el = getNotificationById(id);
    const closeBtn = el.querySelector('button');

    closeBtn.click();

    expect(getNotificationById(id)).toBeNull();
  });

  test('close button click prevents auto-dismiss timer from firing', () => {
    const id = NotificationService.show('Close via button', 'info');
    const el = getNotificationById(id);
    const closeBtn = el.querySelector('button');

    closeBtn.click();
    expect(getNotificationById(id)).toBeNull();

    // Should not throw after advancing time past 4s
    expect(() => {
      jest.advanceTimersByTime(5000);
    }).not.toThrow();
  });
});
