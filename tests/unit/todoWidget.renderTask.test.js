/**
 * Unit tests for TodoWidget._renderTask(task)
 * Covers task 6.13: create an <li data-id="{task.id}"> containing a checkbox (or toggle button),
 * a <span> with the task text (with class="completed" if done), an Edit button, and a Delete button.
 * References: Requirement 5.1–5.9, 6.1–6.5; Design Properties 10, 11, 12, 13, 14, 15
 */

'use strict';

// --- DOM setup ---
beforeEach(() => {
  document.body.innerHTML = `
    <form id="todo-form">
      <input id="todo-input" type="text" maxlength="250" />
      <button type="submit">Add</button>
      <span id="todo-input-error"></span>
    </form>
    <select id="sort-order">
      <option value="none">None</option>
      <option value="incomplete-first">Incomplete first</option>
      <option value="completed-first">Completed first</option>
    </select>
    <ul id="task-list"></ul>
  `;
  localStorage.clear();
});

const { TodoWidget } = require('../../js/app.js');

beforeEach(() => {
  TodoWidget.init();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Creates a minimal incomplete task object */
function makeTask(overrides = {}) {
  return {
    id: 'test-id-123',
    text: 'Sample task text',
    completed: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TodoWidget._renderTask', () => {
  // ── Return value ──────────────────────────────────────────────────────────

  test('returns an HTMLElement', () => {
    const el = TodoWidget._renderTask(makeTask());
    expect(el).toBeInstanceOf(HTMLElement);
  });

  test('returns an <li> element', () => {
    const el = TodoWidget._renderTask(makeTask());
    expect(el.tagName.toLowerCase()).toBe('li');
  });

  // ── Requirement 1: <li> with data-id set to task.id ──────────────────────

  test('sets data-id attribute to task.id', () => {
    const task = makeTask({ id: 'abc-456' });
    const el = TodoWidget._renderTask(task);
    expect(el.dataset.id).toBe('abc-456');
  });

  test('data-id reflects the exact task.id value', () => {
    const task = makeTask({ id: 'unique-id-xyz' });
    const el = TodoWidget._renderTask(task);
    expect(el.getAttribute('data-id')).toBe('unique-id-xyz');
  });

  // ── Requirement 2: checkbox or toggle button ──────────────────────────────

  test('contains a toggle button with data-action="toggle"', () => {
    const el = TodoWidget._renderTask(makeTask());
    const toggleBtn = el.querySelector('[data-action="toggle"]');
    expect(toggleBtn).not.toBeNull();
  });

  test('toggle control is a button element', () => {
    const el = TodoWidget._renderTask(makeTask());
    const toggleBtn = el.querySelector('[data-action="toggle"]');
    expect(toggleBtn.tagName.toLowerCase()).toBe('button');
  });

  test('toggle button has an aria-label for accessibility', () => {
    const el = TodoWidget._renderTask(makeTask());
    const toggleBtn = el.querySelector('[data-action="toggle"]');
    const ariaLabel = toggleBtn.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel.length).toBeGreaterThan(0);
  });

  // ── Requirement 3: <span> with task text, class="completed" when done ─────

  test('contains a <span> with the task text', () => {
    const task = makeTask({ text: 'Do the laundry' });
    const el = TodoWidget._renderTask(task);
    const spans = el.querySelectorAll('span');
    const textSpan = Array.from(spans).find((s) => s.textContent === 'Do the laundry');
    expect(textSpan).not.toBeNull();
  });

  test('text span does NOT have class "completed" when task.completed is false', () => {
    const task = makeTask({ completed: false });
    const el = TodoWidget._renderTask(task);
    // Find the span that contains the task text
    const spans = el.querySelectorAll('span');
    const textSpan = Array.from(spans).find((s) => s.textContent === task.text);
    expect(textSpan).not.toBeNull();
    expect(textSpan.classList.contains('completed')).toBe(false);
  });

  test('text span has class "completed" when task.completed is true', () => {
    const task = makeTask({ completed: true });
    const el = TodoWidget._renderTask(task);
    const spans = el.querySelectorAll('span');
    const textSpan = Array.from(spans).find((s) => s.textContent === task.text);
    expect(textSpan).not.toBeNull();
    expect(textSpan.classList.contains('completed')).toBe(true);
  });

  test('text span text content matches task.text exactly', () => {
    const task = makeTask({ text: 'Exact match text' });
    const el = TodoWidget._renderTask(task);
    const spans = el.querySelectorAll('span');
    const textSpan = Array.from(spans).find((s) => s.textContent === 'Exact match text');
    expect(textSpan).not.toBeNull();
  });

  // ── Requirement 4: Edit button ────────────────────────────────────────────

  test('contains an Edit button', () => {
    const el = TodoWidget._renderTask(makeTask());
    const editBtn = el.querySelector('[data-action="edit"]');
    expect(editBtn).not.toBeNull();
  });

  test('Edit button is a <button> element', () => {
    const el = TodoWidget._renderTask(makeTask());
    const editBtn = el.querySelector('[data-action="edit"]');
    expect(editBtn.tagName.toLowerCase()).toBe('button');
  });

  test('Edit button has visible text', () => {
    const el = TodoWidget._renderTask(makeTask());
    const editBtn = el.querySelector('[data-action="edit"]');
    expect(editBtn.textContent.trim().length).toBeGreaterThan(0);
  });

  // ── Requirement 5: Delete button ──────────────────────────────────────────

  test('contains a Delete button', () => {
    const el = TodoWidget._renderTask(makeTask());
    const deleteBtn = el.querySelector('[data-action="delete"]');
    expect(deleteBtn).not.toBeNull();
  });

  test('Delete button is a <button> element', () => {
    const el = TodoWidget._renderTask(makeTask());
    const deleteBtn = el.querySelector('[data-action="delete"]');
    expect(deleteBtn.tagName.toLowerCase()).toBe('button');
  });

  test('Delete button has visible text', () => {
    const el = TodoWidget._renderTask(makeTask());
    const deleteBtn = el.querySelector('[data-action="delete"]');
    expect(deleteBtn.textContent.trim().length).toBeGreaterThan(0);
  });

  // ── Requirement 6: returns the <li> element ───────────────────────────────

  test('the returned element is the <li> that contains all child elements', () => {
    const task = makeTask();
    const el = TodoWidget._renderTask(task);
    // The returned element should contain the toggle, span, edit, and delete
    expect(el.querySelector('[data-action="toggle"]')).not.toBeNull();
    expect(el.querySelector('[data-action="edit"]')).not.toBeNull();
    expect(el.querySelector('[data-action="delete"]')).not.toBeNull();
    const spans = el.querySelectorAll('span');
    const textSpan = Array.from(spans).find((s) => s.textContent === task.text);
    expect(textSpan).not.toBeNull();
  });

  // ── Completed vs incomplete visual state ──────────────────────────────────

  test('toggle button aria-label changes based on completed state (incomplete)', () => {
    const el = TodoWidget._renderTask(makeTask({ completed: false }));
    const toggleBtn = el.querySelector('[data-action="toggle"]');
    // Should indicate "Mark complete" for an incomplete task
    expect(toggleBtn.getAttribute('aria-label').toLowerCase()).toContain('complete');
  });

  test('toggle button aria-label changes based on completed state (complete)', () => {
    const el = TodoWidget._renderTask(makeTask({ completed: true }));
    const toggleBtn = el.querySelector('[data-action="toggle"]');
    // Should indicate "Mark incomplete" for a completed task
    expect(toggleBtn.getAttribute('aria-label').toLowerCase()).toContain('incomplete');
  });
});
