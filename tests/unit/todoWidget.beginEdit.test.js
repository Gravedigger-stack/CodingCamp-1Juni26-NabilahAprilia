/**
 * Unit tests for TodoWidget.beginEdit(id)
 * Covers task 6.7: replace text span with an input pre-filled with task.text,
 * replace Edit button with Save and Cancel buttons.
 * References: Requirement 5.6, 5.7; Design Properties 13, 14
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

/** Returns the first rendered task's <li> element */
function getFirstTaskLi() {
  return document.querySelector('#task-list li.task-item');
}

/** Returns the id of the first rendered task */
function getFirstTaskId() {
  const li = getFirstTaskLi();
  return li ? li.dataset.id : null;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TodoWidget.beginEdit', () => {
  // ── Input replacement ─────────────────────────────────────────────────────

  test('replaces the text span with an input element', () => {
    TodoWidget.addTask('Original text');
    const id = getFirstTaskId();

    TodoWidget.beginEdit(id);

    const li = getFirstTaskLi();
    expect(li.querySelector('.task-text')).toBeNull();
    expect(li.querySelector('.task-edit-input')).not.toBeNull();
  });

  test('pre-fills the input with the current task text', () => {
    TodoWidget.addTask('My task text');
    const id = getFirstTaskId();

    TodoWidget.beginEdit(id);

    const li = getFirstTaskLi();
    const input = li.querySelector('.task-edit-input');
    expect(input.value).toBe('My task text');
  });

  test('the replacement input has type="text"', () => {
    TodoWidget.addTask('Some task');
    const id = getFirstTaskId();

    TodoWidget.beginEdit(id);

    const li = getFirstTaskLi();
    const input = li.querySelector('.task-edit-input');
    expect(input.type).toBe('text');
  });

  test('the replacement input has maxLength of 250', () => {
    TodoWidget.addTask('Some task');
    const id = getFirstTaskId();

    TodoWidget.beginEdit(id);

    const li = getFirstTaskLi();
    const input = li.querySelector('.task-edit-input');
    expect(input.maxLength).toBe(250);
  });

  // ── Edit button replacement ───────────────────────────────────────────────

  test('removes the Edit button from the row', () => {
    TodoWidget.addTask('Task to edit');
    const id = getFirstTaskId();

    TodoWidget.beginEdit(id);

    const li = getFirstTaskLi();
    expect(li.querySelector('[data-action="edit"]')).toBeNull();
  });

  test('adds a Save button to the row', () => {
    TodoWidget.addTask('Task to edit');
    const id = getFirstTaskId();

    TodoWidget.beginEdit(id);

    const li = getFirstTaskLi();
    const saveBtn = li.querySelector('[data-action="save"]');
    expect(saveBtn).not.toBeNull();
    expect(saveBtn.textContent).toBe('Save');
  });

  test('adds a Cancel button to the row', () => {
    TodoWidget.addTask('Task to edit');
    const id = getFirstTaskId();

    TodoWidget.beginEdit(id);

    const li = getFirstTaskLi();
    const cancelBtn = li.querySelector('[data-action="cancel"]');
    expect(cancelBtn).not.toBeNull();
    expect(cancelBtn.textContent).toBe('Cancel');
  });

  // ── Button accessibility ──────────────────────────────────────────────────

  test('Save button has an aria-label', () => {
    TodoWidget.addTask('Accessible task');
    const id = getFirstTaskId();

    TodoWidget.beginEdit(id);

    const li = getFirstTaskLi();
    const saveBtn = li.querySelector('[data-action="save"]');
    expect(saveBtn.getAttribute('aria-label')).not.toBe('');
  });

  test('Cancel button has an aria-label', () => {
    TodoWidget.addTask('Accessible task');
    const id = getFirstTaskId();

    TodoWidget.beginEdit(id);

    const li = getFirstTaskLi();
    const cancelBtn = li.querySelector('[data-action="cancel"]');
    expect(cancelBtn.getAttribute('aria-label')).not.toBe('');
  });

  // ── No-op for unknown id ──────────────────────────────────────────────────

  test('does nothing when called with an unknown id', () => {
    TodoWidget.addTask('Existing task');

    // Should not throw and should leave the DOM unchanged
    expect(() => TodoWidget.beginEdit('non-existent-id')).not.toThrow();

    const li = getFirstTaskLi();
    // Original span should still be present
    expect(li.querySelector('.task-text')).not.toBeNull();
  });

  // ── Data integrity ────────────────────────────────────────────────────────

  test('does not modify the task data when beginEdit is called', () => {
    TodoWidget.addTask('Unchanged text');
    const id = getFirstTaskId();

    TodoWidget.beginEdit(id);

    // Parse from localStorage — task.text must not have changed
    const stored = JSON.parse(localStorage.getItem('tld_tasks'));
    expect(stored[0].text).toBe('Unchanged text');
  });
});
