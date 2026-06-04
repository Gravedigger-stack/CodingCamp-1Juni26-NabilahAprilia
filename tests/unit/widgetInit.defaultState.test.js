/**
 * Unit tests for Task 9.2 — Widget init() null-safe default state
 *
 * Verifies that every widget's init() calls StorageService.read(...) before
 * rendering, and that a null return from read() causes the widget to
 * initialize with its documented default state:
 *   - TodoWidget:     tasks = [], sortOrder = 'none'
 *   - TimerWidget:    configured = 25,  remaining = 1500
 *   - GreetingWidget: name = '' (empty)
 *   - ThemeManager:   _detect() result (OS preference or 'light')
 *
 * References: Requirement 9.1, 9.4; Design Property 27
 */

'use strict';

// ---------------------------------------------------------------------------
// Minimal DOM scaffold shared across all describe blocks
// ---------------------------------------------------------------------------
function buildDOM() {
  document.body.innerHTML = `
    <div id="notifications-container"></div>

    <!-- ThemeManager -->
    <button id="theme-toggle"></button>

    <!-- GreetingWidget -->
    <div id="clock"></div>
    <div id="date-display"></div>
    <p id="greeting-text"></p>
    <form id="name-form">
      <input id="name-input" maxlength="50" type="text" />
      <button type="submit">Save</button>
    </form>
    <span id="name-error"></span>

    <!-- TimerWidget -->
    <div id="timer-display"></div>
    <button id="timer-start">Start</button>
    <button id="timer-stop">Stop</button>
    <button id="timer-reset">Reset</button>
    <div id="timer-complete-msg" hidden></div>
    <input id="duration-input" type="number" min="1" max="120" />
    <button id="duration-apply">Apply</button>
    <span id="duration-error"></span>

    <!-- TodoWidget -->
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

    <!-- QuickLinksWidget -->
    <form id="quicklink-form">
      <input id="link-label-input" type="text" />
      <input id="link-url-input" type="text" />
      <button type="submit">Add Link</button>
      <span id="link-label-error"></span>
      <span id="link-url-error"></span>
      <p id="link-limit-msg" hidden></p>
    </form>
    <div id="links-panel"></div>
  `;
}

beforeEach(() => {
  buildDOM();
  localStorage.clear();
});

const {
  StorageService,
  ThemeManager,
  GreetingWidget,
  TimerWidget,
  TodoWidget,
  QuickLinksWidget,
} = require('../../js/app.js');

// ---------------------------------------------------------------------------
// TodoWidget — null from storage → defaults
// ---------------------------------------------------------------------------
describe('TodoWidget.init() — null storage → default state', () => {
  test('reads tld_tasks from StorageService before rendering', () => {
    const readSpy = jest.spyOn(StorageService, 'read');
    TodoWidget.init();
    const calledKeys = readSpy.mock.calls.map(([key]) => key);
    expect(calledKeys).toContain('tld_tasks');
    readSpy.mockRestore();
  });

  test('reads tld_sortOrder from StorageService before rendering', () => {
    const readSpy = jest.spyOn(StorageService, 'read');
    TodoWidget.init();
    const calledKeys = readSpy.mock.calls.map(([key]) => key);
    expect(calledKeys).toContain('tld_sortOrder');
    readSpy.mockRestore();
  });

  test('initializes with empty task list when tld_tasks is null', () => {
    // localStorage is already clear — read returns null
    TodoWidget.init();
    const listEl = document.getElementById('task-list');
    // No task items should be rendered
    expect(listEl.querySelectorAll('li.task-item')).toHaveLength(0);
  });

  test('initializes with sortOrder "none" when tld_sortOrder is null', () => {
    TodoWidget.init();
    const sortEl = document.getElementById('sort-order');
    expect(sortEl.value).toBe('none');
  });

  test('initializes with empty task list when tld_tasks is corrupt JSON', () => {
    localStorage.setItem('tld_tasks', '!!!not-json!!!');
    TodoWidget.init();
    const listEl = document.getElementById('task-list');
    expect(listEl.querySelectorAll('li.task-item')).toHaveLength(0);
  });

  test('initializes with sortOrder "none" when tld_sortOrder holds an unrecognised value', () => {
    localStorage.setItem('tld_sortOrder', '"random-value"');
    TodoWidget.init();
    const sortEl = document.getElementById('sort-order');
    expect(sortEl.value).toBe('none');
  });

  test('does NOT throw when both storage keys are absent', () => {
    expect(() => TodoWidget.init()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// TimerWidget — null from storage → defaults
// ---------------------------------------------------------------------------
describe('TimerWidget.init() — null storage → default state', () => {
  test('reads tld_pomodoroDuration from StorageService before rendering', () => {
    const readSpy = jest.spyOn(StorageService, 'read');
    TimerWidget.init();
    const calledKeys = readSpy.mock.calls.map(([key]) => key);
    expect(calledKeys).toContain('tld_pomodoroDuration');
    readSpy.mockRestore();
  });

  test('defaults to configured=25 when tld_pomodoroDuration is null', () => {
    // localStorage is clear
    TimerWidget.init();
    expect(TimerWidget.state.configured).toBe(25);
  });

  test('defaults to remaining=1500 (25×60) when tld_pomodoroDuration is null', () => {
    TimerWidget.init();
    expect(TimerWidget.state.remaining).toBe(1500);
  });

  test('display shows "25:00" when no duration is stored', () => {
    TimerWidget.init();
    const displayEl = document.getElementById('timer-display');
    expect(displayEl.textContent).toBe('25:00');
  });

  test('defaults to configured=25 when tld_pomodoroDuration is corrupt JSON', () => {
    localStorage.setItem('tld_pomodoroDuration', '!!!not-json!!!');
    TimerWidget.init();
    expect(TimerWidget.state.configured).toBe(25);
  });

  test('defaults to configured=25 when stored value is out of range (0)', () => {
    localStorage.setItem('tld_pomodoroDuration', '0');
    TimerWidget.init();
    expect(TimerWidget.state.configured).toBe(25);
  });

  test('defaults to configured=25 when stored value is out of range (121)', () => {
    localStorage.setItem('tld_pomodoroDuration', '121');
    TimerWidget.init();
    expect(TimerWidget.state.configured).toBe(25);
  });

  test('restores configured duration from valid stored value', () => {
    localStorage.setItem('tld_pomodoroDuration', '45');
    TimerWidget.init();
    expect(TimerWidget.state.configured).toBe(45);
    expect(TimerWidget.state.remaining).toBe(45 * 60);
  });

  test('does NOT throw when storage key is absent', () => {
    expect(() => TimerWidget.init()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// GreetingWidget — null from storage → default state (no name)
// ---------------------------------------------------------------------------
describe('GreetingWidget.init() — null storage → default state', () => {
  test('reads tld_userName from StorageService before rendering', () => {
    const readSpy = jest.spyOn(StorageService, 'read');
    GreetingWidget.init();
    const calledKeys = readSpy.mock.calls.map(([key]) => key);
    expect(calledKeys).toContain('tld_userName');
    readSpy.mockRestore();
  });

  test('displays greeting without a name when tld_userName is null', () => {
    // localStorage is clear
    GreetingWidget.init();
    const greetingEl = document.getElementById('greeting-text');
    // Should NOT contain ", ...!" suffix
    expect(greetingEl.textContent).not.toMatch(/,\s+.+!/);
  });

  test('renders a greeting text (non-empty) even with no name stored', () => {
    GreetingWidget.init();
    const greetingEl = document.getElementById('greeting-text');
    expect(greetingEl.textContent.length).toBeGreaterThan(0);
  });

  test('restores name from storage when tld_userName is present', () => {
    localStorage.setItem('tld_userName', '"Alice"');
    GreetingWidget.init();
    const greetingEl = document.getElementById('greeting-text');
    expect(greetingEl.textContent).toContain('Alice');
  });

  test('does NOT throw when tld_userName is absent', () => {
    expect(() => GreetingWidget.init()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// QuickLinksWidget — null from storage → default state (empty links)
// ---------------------------------------------------------------------------
describe('QuickLinksWidget.init() — null storage → default state', () => {
  test('reads tld_quickLinks from StorageService before rendering', () => {
    const readSpy = jest.spyOn(StorageService, 'read');
    QuickLinksWidget.init();
    const calledKeys = readSpy.mock.calls.map(([key]) => key);
    expect(calledKeys).toContain('tld_quickLinks');
    readSpy.mockRestore();
  });

  test('renders an empty links panel when tld_quickLinks is null', () => {
    QuickLinksWidget.init();
    const panel = document.getElementById('links-panel');
    expect(panel.querySelectorAll('.link-card')).toHaveLength(0);
  });

  test('renders an empty links panel when tld_quickLinks is corrupt JSON', () => {
    localStorage.setItem('tld_quickLinks', '!!!not-json!!!');
    QuickLinksWidget.init();
    const panel = document.getElementById('links-panel');
    expect(panel.querySelectorAll('.link-card')).toHaveLength(0);
  });

  test('does NOT throw when tld_quickLinks is absent', () => {
    expect(() => QuickLinksWidget.init()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// ThemeManager — null from storage → OS preference or 'light'
// ---------------------------------------------------------------------------
describe('ThemeManager.init() — null storage → default state', () => {
  test('reads tld_theme from StorageService before applying a theme', () => {
    const readSpy = jest.spyOn(StorageService, 'read');
    ThemeManager.init();
    const calledKeys = readSpy.mock.calls.map(([key]) => key);
    expect(calledKeys).toContain('tld_theme');
    readSpy.mockRestore();
  });

  test('applies a theme to the document when tld_theme is null', () => {
    ThemeManager.init();
    const appliedTheme = document.documentElement.dataset.theme;
    expect(['light', 'dark']).toContain(appliedTheme);
  });

  test('defaults to "light" when tld_theme is null and matchMedia is unavailable', () => {
    // Temporarily stub matchMedia to simulate unavailability
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = undefined;

    ThemeManager.init();
    const appliedTheme = document.documentElement.dataset.theme;
    expect(appliedTheme).toBe('light');

    window.matchMedia = originalMatchMedia;
  });

  test('applies "light" theme when "light" is stored', () => {
    localStorage.setItem('tld_theme', '"light"');
    ThemeManager.init();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  test('applies "dark" theme when "dark" is stored', () => {
    localStorage.setItem('tld_theme', '"dark"');
    ThemeManager.init();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  test('falls back to _detect() when stored value is not "light" or "dark"', () => {
    localStorage.setItem('tld_theme', '"invalid-theme"');
    ThemeManager.init();
    const appliedTheme = document.documentElement.dataset.theme;
    expect(['light', 'dark']).toContain(appliedTheme);
  });

  test('does NOT throw when tld_theme is absent', () => {
    expect(() => ThemeManager.init()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Cross-widget: read() is called BEFORE any DOM mutation in init()
// ---------------------------------------------------------------------------
describe('All widgets — StorageService.read() called before rendering', () => {
  test('TodoWidget reads storage before modifying #task-list', () => {
    const callOrder = [];
    const readSpy = jest.spyOn(StorageService, 'read').mockImplementation((key) => {
      callOrder.push(`read:${key}`);
      return null; // simulate empty storage
    });

    // Spy on innerHTML setter to detect when rendering occurs
    const taskList = document.getElementById('task-list');
    const origDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(taskList, 'innerHTML', {
      set(v) {
        callOrder.push('render:task-list');
        origDescriptor.set.call(this, v);
      },
      get() {
        return origDescriptor.get.call(this);
      },
      configurable: true,
    });

    TodoWidget.init();

    const readIndex   = callOrder.findIndex((e) => e === 'read:tld_tasks');
    const renderIndex = callOrder.findIndex((e) => e === 'render:task-list');

    expect(readIndex).toBeGreaterThanOrEqual(0);
    expect(renderIndex).toBeGreaterThanOrEqual(0);
    expect(readIndex).toBeLessThan(renderIndex);

    readSpy.mockRestore();
    // Restore innerHTML descriptor
    delete taskList.innerHTML;
  });

  test('QuickLinksWidget reads storage before modifying #links-panel', () => {
    const callOrder = [];
    const readSpy = jest.spyOn(StorageService, 'read').mockImplementation((key) => {
      callOrder.push(`read:${key}`);
      return null;
    });

    const panel = document.getElementById('links-panel');
    const origDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(panel, 'innerHTML', {
      set(v) {
        callOrder.push('render:links-panel');
        origDescriptor.set.call(this, v);
      },
      get() {
        return origDescriptor.get.call(this);
      },
      configurable: true,
    });

    QuickLinksWidget.init();

    const readIndex   = callOrder.findIndex((e) => e === 'read:tld_quickLinks');
    const renderIndex = callOrder.findIndex((e) => e === 'render:links-panel');

    expect(readIndex).toBeGreaterThanOrEqual(0);
    expect(renderIndex).toBeGreaterThanOrEqual(0);
    expect(readIndex).toBeLessThan(renderIndex);

    readSpy.mockRestore();
    delete panel.innerHTML;
  });
});
