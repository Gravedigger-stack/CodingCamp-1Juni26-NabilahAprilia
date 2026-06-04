/**
 * Unit tests for TodoWidget._getDisplayList()
 * Covers task 6.10: return a shallow copy of tasks sorted by sortOrder,
 * without mutating the original tasks array.
 * References: Requirement 6.1, 6.2, 6.3; Design Properties 17, 18
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

/** Adds a task and marks it complete/incomplete as requested, returns its id */
function addTask(text, completed = false) {
  TodoWidget.addTask(text);
  const raw = localStorage.getItem('tld_tasks');
  const tasks = JSON.parse(raw);
  const task = tasks.find((t) => t.text === text);
  if (completed && task) {
    TodoWidget.toggleTask(task.id);
  }
  return task ? task.id : null;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TodoWidget._getDisplayList', () => {
  // ── No mutation ───────────────────────────────────────────────────────────

  test('returns a new array (shallow copy), not the original reference', () => {
    TodoWidget.addTask('Alpha');
    TodoWidget.addTask('Beta');

    const list1 = TodoWidget._getDisplayList();
    const list2 = TodoWidget._getDisplayList();

    // Each call returns a new array
    expect(list1).not.toBe(list2);
  });

  test('does not mutate the original insertion order after sort', () => {
    // Add incomplete then complete
    addTask('Incomplete task', false);
    addTask('Complete task', true);

    // Apply completed-first sort
    TodoWidget.setSortOrder('completed-first');

    // Get display list (sorted)
    const display = TodoWidget._getDisplayList();
    expect(display[0].completed).toBe(true);

    // Now revert to none — original order should still be intact
    TodoWidget.setSortOrder('none');
    const unsorted = TodoWidget._getDisplayList();
    expect(unsorted[0].text).toBe('Incomplete task');
    expect(unsorted[1].text).toBe('Complete task');
  });

  // ── sortOrder === 'none' ──────────────────────────────────────────────────

  test("returns tasks in insertion order when sortOrder is 'none'", () => {
    TodoWidget.addTask('First');
    TodoWidget.addTask('Second');
    TodoWidget.addTask('Third');

    TodoWidget.setSortOrder('none');
    const display = TodoWidget._getDisplayList();

    expect(display.map((t) => t.text)).toEqual(['First', 'Second', 'Third']);
  });

  test("returns empty array for 'none' when no tasks exist", () => {
    TodoWidget.setSortOrder('none');
    expect(TodoWidget._getDisplayList()).toEqual([]);
  });

  // ── sortOrder === 'incomplete-first' ──────────────────────────────────────

  test("puts all incomplete tasks before all completed tasks for 'incomplete-first'", () => {
    addTask('Complete A', true);
    addTask('Incomplete B', false);
    addTask('Complete C', true);
    addTask('Incomplete D', false);

    TodoWidget.setSortOrder('incomplete-first');
    const display = TodoWidget._getDisplayList();

    // All incomplete (false) should come before all complete (true)
    const incompleteIdx = display.map((t, i) => (!t.completed ? i : null)).filter((i) => i !== null);
    const completeIdx   = display.map((t, i) => (t.completed ? i : null)).filter((i) => i !== null);

    const maxIncomplete = Math.max(...incompleteIdx);
    const minComplete   = Math.min(...completeIdx);
    expect(maxIncomplete).toBeLessThan(minComplete);
  });

  test("'incomplete-first': all items with completed===false come first", () => {
    addTask('Task 1', false);
    addTask('Task 2', true);
    addTask('Task 3', false);

    TodoWidget.setSortOrder('incomplete-first');
    const display = TodoWidget._getDisplayList();

    // First two should be incomplete, last one complete
    expect(display[0].completed).toBe(false);
    expect(display[1].completed).toBe(false);
    expect(display[2].completed).toBe(true);
  });

  test("'incomplete-first' with all tasks complete returns them all", () => {
    addTask('A', true);
    addTask('B', true);

    TodoWidget.setSortOrder('incomplete-first');
    const display = TodoWidget._getDisplayList();
    expect(display).toHaveLength(2);
    display.forEach((t) => expect(t.completed).toBe(true));
  });

  test("'incomplete-first' with all tasks incomplete returns them all", () => {
    addTask('A', false);
    addTask('B', false);

    TodoWidget.setSortOrder('incomplete-first');
    const display = TodoWidget._getDisplayList();
    expect(display).toHaveLength(2);
    display.forEach((t) => expect(t.completed).toBe(false));
  });

  // ── sortOrder === 'completed-first' ───────────────────────────────────────

  test("puts all completed tasks before all incomplete tasks for 'completed-first'", () => {
    addTask('Incomplete A', false);
    addTask('Complete B', true);
    addTask('Incomplete C', false);
    addTask('Complete D', true);

    TodoWidget.setSortOrder('completed-first');
    const display = TodoWidget._getDisplayList();

    const completeIdx   = display.map((t, i) => (t.completed ? i : null)).filter((i) => i !== null);
    const incompleteIdx = display.map((t, i) => (!t.completed ? i : null)).filter((i) => i !== null);

    const maxComplete   = Math.max(...completeIdx);
    const minIncomplete = Math.min(...incompleteIdx);
    expect(maxComplete).toBeLessThan(minIncomplete);
  });

  test("'completed-first': all items with completed===true come first", () => {
    addTask('Task 1', false);
    addTask('Task 2', true);
    addTask('Task 3', false);

    TodoWidget.setSortOrder('completed-first');
    const display = TodoWidget._getDisplayList();

    expect(display[0].completed).toBe(true);
    expect(display[1].completed).toBe(false);
    expect(display[2].completed).toBe(false);
  });

  test("'completed-first' with all tasks incomplete returns them all", () => {
    addTask('X', false);
    addTask('Y', false);

    TodoWidget.setSortOrder('completed-first');
    const display = TodoWidget._getDisplayList();
    expect(display).toHaveLength(2);
    display.forEach((t) => expect(t.completed).toBe(false));
  });

  // ── Length preservation ───────────────────────────────────────────────────

  test('display list always has the same length as the tasks array', () => {
    TodoWidget.addTask('One');
    addTask('Two', true);
    TodoWidget.addTask('Three');

    ['none', 'incomplete-first', 'completed-first'].forEach((order) => {
      TodoWidget.setSortOrder(order);
      expect(TodoWidget._getDisplayList()).toHaveLength(3);
    });
  });

  // ── Task data integrity ───────────────────────────────────────────────────

  test('display list items contain the original task objects (shallow copy)', () => {
    TodoWidget.addTask('My task');
    const display = TodoWidget._getDisplayList();
    const stored = JSON.parse(localStorage.getItem('tld_tasks'));

    expect(display[0].id).toBe(stored[0].id);
    expect(display[0].text).toBe(stored[0].text);
  });
});
