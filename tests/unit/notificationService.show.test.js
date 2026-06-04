/**
 * Unit tests for NotificationService.show(message, type)
 * Covers task 8.2: generate id, build notification element, append to container,
 * create container if absent, set auto-dismiss timer, return id.
 * References: Requirement 9.5, 7.8, 8.7; Design — Error Handling section
 */

'use strict';

const { NotificationService } = require('../../js/app.js');

beforeEach(() => {
  // Reset DOM before each test
  document.body.innerHTML = '';
  // Reset timers
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ── Helper ───────────────────────────────────────────────────────────────────

function getContainer() {
  return document.getElementById('notifications-container');
}

function getNotificationById(id) {
  return document.querySelector(`.notification[data-id="${id}"]`);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationService.show', () => {

  // ── Return value ─────────────────────────────────────────────────────────

  test('returns a non-empty string id', () => {
    const id = NotificationService.show('Hello', 'info');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('returns a unique id on each call', () => {
    const id1 = NotificationService.show('First', 'info');
    const id2 = NotificationService.show('Second', 'info');
    expect(id1).not.toBe(id2);
  });

  // ── Container creation ────────────────────────────────────────────────────

  test('creates #notifications-container if absent', () => {
    expect(getContainer()).toBeNull();
    NotificationService.show('Test', 'info');
    expect(getContainer()).not.toBeNull();
  });

  test('reuses existing #notifications-container if already present', () => {
    const existing = document.createElement('div');
    existing.id = 'notifications-container';
    document.body.appendChild(existing);

    NotificationService.show('Test', 'info');

    // Should still be exactly one container
    const containers = document.querySelectorAll('#notifications-container');
    expect(containers).toHaveLength(1);
  });

  test('inserts container at the beginning of body when created', () => {
    const other = document.createElement('p');
    other.id = 'other';
    document.body.appendChild(other);

    NotificationService.show('Test', 'info');

    const container = getContainer();
    expect(document.body.firstChild).toBe(container);
  });

  // ── Notification element structure ─────────────────────────────────────────

  test('creates a div with role="alert"', () => {
    const id = NotificationService.show('A message', 'info');
    const el = getNotificationById(id);
    expect(el).not.toBeNull();
    expect(el.getAttribute('role')).toBe('alert');
  });

  test('applies the correct CSS class for type "info"', () => {
    const id = NotificationService.show('Info message', 'info');
    const el = getNotificationById(id);
    expect(el.classList.contains('notification')).toBe(true);
    expect(el.classList.contains('notification--info')).toBe(true);
  });

  test('applies the correct CSS class for type "error"', () => {
    const id = NotificationService.show('Error message', 'error');
    const el = getNotificationById(id);
    expect(el.classList.contains('notification--error')).toBe(true);
  });

  test('applies the correct CSS class for type "validation"', () => {
    const id = NotificationService.show('Validation message', 'validation');
    const el = getNotificationById(id);
    expect(el.classList.contains('notification--validation')).toBe(true);
  });

  test('displays the message text inside the notification', () => {
    const msg = 'Could not save your changes — storage is full.';
    const id = NotificationService.show(msg, 'error');
    const el = getNotificationById(id);
    expect(el.textContent).toContain(msg);
  });

  test('includes a close button in the notification', () => {
    const id = NotificationService.show('Test', 'info');
    const el = getNotificationById(id);
    const closeBtn = el.querySelector('button');
    expect(closeBtn).not.toBeNull();
  });

  test('close button click dismisses the notification', () => {
    const id = NotificationService.show('Dismiss me', 'info');
    const el = getNotificationById(id);
    const closeBtn = el.querySelector('button');
    closeBtn.click();
    expect(getNotificationById(id)).toBeNull();
  });

  // ── Appending to container ────────────────────────────────────────────────

  test('appends the notification to the container', () => {
    const id = NotificationService.show('Test', 'info');
    const container = getContainer();
    const el = getNotificationById(id);
    expect(container.contains(el)).toBe(true);
  });

  test('multiple notifications are all appended to the same container', () => {
    const id1 = NotificationService.show('First', 'info');
    const id2 = NotificationService.show('Second', 'error');
    const id3 = NotificationService.show('Third', 'validation');
    const container = getContainer();
    expect(container.children).toHaveLength(3);
    expect(container.contains(getNotificationById(id1))).toBe(true);
    expect(container.contains(getNotificationById(id2))).toBe(true);
    expect(container.contains(getNotificationById(id3))).toBe(true);
  });

  // ── Auto-dismiss after 4 seconds ──────────────────────────────────────────

  test('notification is still present before 4000 ms', () => {
    const id = NotificationService.show('Auto dismiss test', 'info');
    jest.advanceTimersByTime(3999);
    expect(getNotificationById(id)).not.toBeNull();
  });

  test('notification is removed from DOM after 4000 ms', () => {
    const id = NotificationService.show('Auto dismiss test', 'info');
    jest.advanceTimersByTime(4000);
    expect(getNotificationById(id)).toBeNull();
  });

  test('each notification has its own independent 4s timer', () => {
    const id1 = NotificationService.show('First', 'info');
    jest.advanceTimersByTime(2000);
    const id2 = NotificationService.show('Second', 'info');
    jest.advanceTimersByTime(2000); // id1 should now be gone (4s total), id2 at 2s
    expect(getNotificationById(id1)).toBeNull();
    expect(getNotificationById(id2)).not.toBeNull();
    jest.advanceTimersByTime(2000); // id2 now at 4s
    expect(getNotificationById(id2)).toBeNull();
  });

  // ── data-id attribute ─────────────────────────────────────────────────────

  test('notification element has data-id matching the returned id', () => {
    const id = NotificationService.show('Track me', 'info');
    const el = document.querySelector(`[data-id="${id}"]`);
    expect(el).not.toBeNull();
  });
});
