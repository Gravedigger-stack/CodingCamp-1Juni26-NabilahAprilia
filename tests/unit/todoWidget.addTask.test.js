/**
 * Unit tests for TodoWidget.addTask(text)
 * Covers task 6.4: trim text, validate empty, create Task object, push, persist, render.
 * References: Requirement 5.2, 5.3; Design Properties 10, 11
 */

'use strict';

// --- DOM setup ---
// jsdom is provided by jest testEnvironment: 'jsdom'
beforeEach(() => {
  // Set up minimal DOM elements used by TodoWidget
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

  // Reset localStorage before each test
  localStorage.clear();
});

const { TodoWidget } = require('../../js/app.js');

// Re-initialize TodoWidget before each test to reset internal state
beforeEach(() => {
  TodoWidget.init();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the current tasks stored in localStorage */
function getStoredTasks() {
  const raw = localStorage.getItem('tld_tasks');
  return raw ? JSON.parse(raw) : null;
}

/** Returns the rendered task items from #task-list */
function getRenderedItems() {
  return document.querySelectorAll('#task-list li.task-item');
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TodoWidget.addTask', () => {
  // ── Valid input ────────────────────────────────────────────────────────────

  test('adds a task with trimmed text to the task list', () => {
    TodoWidget.addTask('  Buy groceries  ');
    const stored = getStoredTasks();
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe('Buy groceries');
  });

  test('creates a task object with the correct shape', () => {
    const before = Date.now();
    TodoWidget.addTask('Read a book');
    const after = Date.now();
    const stored = getStoredTasks();
    const task = stored[0];

    expect(typeof task.id).toBe('string');
    expect(task.id.length).toBeGreaterThan(0);
    expect(task.text).toBe('Read a book');
    expect(task.completed).toBe(false);
    expect(task.createdAt).toBeGreaterThanOrEqual(before);
    expect(task.createdAt).toBeLessThanOrEqual(after);
  });

  test('adds multiple tasks sequentially', () => {
    TodoWidget.addTask('Task one');
    TodoWidget.addTask('Task two');
    TodoWidget.addTask('Task three');
    const stored = getStoredTasks();
    expect(stored).toHaveLength(3);
    expect(stored.map((t) => t.text)).toEqual(['Task one', 'Task two', 'Task three']);
  });

  test('renders the new task in the DOM', () => {
    TodoWidget.addTask('Walk the dog');
    const items = getRenderedItems();
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Walk the dog');
  });

  test('clears #todo-input-error after a valid submission', () => {
    // First trigger the error…
    TodoWidget.addTask('');
    // …then submit a valid task
    TodoWidget.addTask('Valid task');
    const errorEl = document.getElementById('todo-input-error');
    expect(errorEl.textContent).toBe('');
  });

  test('each task gets a unique id', () => {
    TodoWidget.addTask('Alpha');
    TodoWidget.addTask('Beta');
    const stored = getStoredTasks();
    expect(stored[0].id).not.toBe(stored[1].id);
  });

  // ── Empty / whitespace-only input ─────────────────────────────────────────

  test('rejects an empty string and shows an error message', () => {
    TodoWidget.addTask('');
    const errorEl = document.getElementById('todo-input-error');
    expect(errorEl.textContent).not.toBe('');
    expect(getStoredTasks()).toHaveLength(0);
  });

  test('rejects a whitespace-only string and shows an error message', () => {
    TodoWidget.addTask('   ');
    const errorEl = document.getElementById('todo-input-error');
    expect(errorEl.textContent).not.toBe('');
    expect(getStoredTasks()).toHaveLength(0);
  });

  test('does not render any item after a rejected (empty) add', () => {
    TodoWidget.addTask('   \t  ');
    expect(getRenderedItems()).toHaveLength(0);
  });

  test('does not mutate tasks array on rejected input', () => {
    TodoWidget.addTask('Good task');
    TodoWidget.addTask('   ');  // rejected
    expect(getStoredTasks()).toHaveLength(1);
    expect(getRenderedItems()).toHaveLength(1);
  });

  // ── Persistence ───────────────────────────────────────────────────────────

  test('persists the new task to localStorage immediately', () => {
    TodoWidget.addTask('Persisted task');
    expect(localStorage.getItem('tld_tasks')).not.toBeNull();
    const stored = getStoredTasks();
    expect(stored[0].text).toBe('Persisted task');
  });

  test('does NOT persist to localStorage when input is empty', () => {
    TodoWidget.addTask('');
    // localStorage should either be absent or contain an empty array (from init)
    const stored = getStoredTasks();
    expect(stored === null || stored.length === 0).toBe(true);
  });
});
