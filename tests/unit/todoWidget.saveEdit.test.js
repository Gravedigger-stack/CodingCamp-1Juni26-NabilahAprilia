/**
 * Unit tests for TodoWidget.saveEdit(id, newText)
 * Covers task 6.8: trim newText, reject empty/whitespace with inline validation,
 * update task.text, call _persist() and _renderAll().
 * References: Requirement 5.6, 5.7; Design Properties 14, 15
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

/** Returns the current tasks stored in localStorage */
function getStoredTasks() {
  const raw = localStorage.getItem('tld_tasks');
  return raw ? JSON.parse(raw) : null;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TodoWidget.saveEdit', () => {
  // ── Valid save ────────────────────────────────────────────────────────────

  test('updates task.text with the trimmed value', () => {
    TodoWidget.addTask('Original text');
    const id = getFirstTaskId();
    TodoWidget.beginEdit(id);

    TodoWidget.saveEdit(id, '  Updated text  ');

    const stored = getStoredTasks();
    expect(stored[0].text).toBe('Updated text');
  });

  test('persists the updated task to localStorage', () => {
    TodoWidget.addTask('Task to update');
    const id = getFirstTaskId();
    TodoWidget.beginEdit(id);

    TodoWidget.saveEdit(id, 'New content');

    const stored = getStoredTasks();
    expect(stored[0].text).toBe('New content');
  });

  test('re-renders the list after a valid save (text span restored)', () => {
    TodoWidget.addTask('Before edit');
    const id = getFirstTaskId();
    TodoWidget.beginEdit(id);

    TodoWidget.saveEdit(id, 'After edit');

    const li = getFirstTaskLi();
    // After save, the edit input should be gone and text span restored
    expect(li.querySelector('.task-edit-input')).toBeNull();
    expect(li.querySelector('.task-text')).not.toBeNull();
    expect(li.querySelector('.task-text').textContent).toBe('After edit');
  });

  test('trims leading and trailing whitespace from newText', () => {
    TodoWidget.addTask('Original');
    const id = getFirstTaskId();
    TodoWidget.beginEdit(id);

    TodoWidget.saveEdit(id, '   Trimmed   ');

    const stored = getStoredTasks();
    expect(stored[0].text).toBe('Trimmed');
  });

  // ── Empty / whitespace rejection ──────────────────────────────────────────

  test('does NOT update task.text when newText is empty', () => {
    TodoWidget.addTask('Keep this text');
    const id = getFirstTaskId();
    TodoWidget.beginEdit(id);

    TodoWidget.saveEdit(id, '');

    const stored = getStoredTasks();
    expect(stored[0].text).toBe('Keep this text');
  });

  test('does NOT update task.text when newText is whitespace-only', () => {
    TodoWidget.addTask('Keep this text');
    const id = getFirstTaskId();
    TodoWidget.beginEdit(id);

    TodoWidget.saveEdit(id, '   ');

    const stored = getStoredTasks();
    expect(stored[0].text).toBe('Keep this text');
  });

  test('shows an inline validation message when newText is empty', () => {
    TodoWidget.addTask('Some task');
    const id = getFirstTaskId();
    TodoWidget.beginEdit(id);

    TodoWidget.saveEdit(id, '');

    const li = document.querySelector(`[data-id="${id}"]`);
    const inlineError = li ? li.querySelector('.task-inline-error') : null;
    expect(inlineError).not.toBeNull();
    expect(inlineError.textContent).not.toBe('');
  });

  test('shows an inline validation message when newText is whitespace-only', () => {
    TodoWidget.addTask('Some task');
    const id = getFirstTaskId();
    TodoWidget.beginEdit(id);

    TodoWidget.saveEdit(id, '   \t  ');

    const li = document.querySelector(`[data-id="${id}"]`);
    const inlineError = li ? li.querySelector('.task-inline-error') : null;
    expect(inlineError).not.toBeNull();
    expect(inlineError.textContent).not.toBe('');
  });

  test('does NOT re-render when newText is empty (edit input stays in DOM)', () => {
    TodoWidget.addTask('Original');
    const id = getFirstTaskId();
    TodoWidget.beginEdit(id);

    TodoWidget.saveEdit(id, '');

    // The inline edit input should still be present (no re-render happened)
    const li = document.querySelector(`[data-id="${id}"]`);
    expect(li.querySelector('.task-edit-input')).not.toBeNull();
  });

  // ── No-op for unknown id ──────────────────────────────────────────────────

  test('does nothing when called with an unknown id', () => {
    TodoWidget.addTask('Existing task');

    expect(() => TodoWidget.saveEdit('non-existent-id', 'New text')).not.toThrow();

    const stored = getStoredTasks();
    expect(stored[0].text).toBe('Existing task');
  });
});
