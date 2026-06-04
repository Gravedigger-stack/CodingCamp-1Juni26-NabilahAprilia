// app.js

// StorageService — thin wrapper around localStorage (read/write/remove/isAvailable)
const StorageService = {
  /**
   * Checks whether localStorage is available in the current environment.
   * @returns {boolean}
   */
  isAvailable() {
    const TEST_KEY = '__tld_storage_test__';
    try {
      localStorage.setItem(TEST_KEY, '1');
      localStorage.getItem(TEST_KEY);
      localStorage.removeItem(TEST_KEY);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Reads and JSON-parses a value from localStorage by key.
   * Returns the parsed value on success, or null on any error or missing key.
   * @param {string} key
   * @returns {*|null}
   */
  read(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  /**
   * JSON-serialises a value and writes it to localStorage under the given key.
   * Returns true on success, false on QuotaExceededError or any other error.
   *
   * SYNCHRONOUS PERSISTENCE (Req 9.2):
   * `localStorage.setItem` is a synchronous, blocking call — it completes before
   * control returns to the caller.  This means every `StorageService.write()`
   * call finishes within the same JavaScript call stack as the user action that
   * triggered it, easily satisfying the ≤100 ms write requirement from Req 9.2.
   * No asynchronous coordination (promises, callbacks, workers) is needed.
   *
   * All widget mutation methods that must satisfy Req 9.2 route their writes
   * through this method (directly or via a widget-local `_persist()` helper):
   *   • TodoWidget.addTask      → _persist() → StorageService.write(KEY_TASKS, …)
   *                                          → StorageService.write(KEY_SORT_ORDER, …)
   *   • TodoWidget.deleteTask   → _persist() → (same as above)
   *   • TodoWidget.toggleTask   → _persist() → (same as above)
   *   • TodoWidget.saveEdit     → _persist() → (same as above)
   *   • TodoWidget.setSortOrder → _persist() → (same as above)
   *   • QuickLinksWidget.addLink    → _persist() → StorageService.write(KEY_QUICKLINKS, …)
   *   • QuickLinksWidget.deleteLink → _persist() → (same as above)
   *   • ThemeManager.apply          → StorageService.write(KEY_THEME, …) (direct)
   *   • GreetingWidget.setName      → StorageService.write(KEY_USERNAME, …) (direct)
   *   • TimerWidget.applyDuration   → StorageService.write(KEY_TIMER_DURATION, …) (direct)
   *
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  write(key, value) {
    // localStorage.setItem is synchronous, so persistence completes within the
    // same call stack — satisfying the ≤100 ms persistence requirement (Req 9.2).
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      // Covers QuotaExceededError (storage full) and any other setItem errors.
      return false;
    }
  },

  /**
   * Removes the entry with the given key from localStorage.
   * @param {string} key
   * @returns {void}
   */
  remove(key) {
    localStorage.removeItem(key);
  },
};

// localStorage key constants
const KEY_USERNAME       = 'tld_userName';
const KEY_THEME          = 'tld_theme';
const KEY_TIMER_DURATION = 'tld_pomodoroDuration';
const KEY_TASKS          = 'tld_tasks';
const KEY_QUICKLINKS     = 'tld_quickLinks';
const KEY_SORT_ORDER     = 'tld_sortOrder';

// generateId — stable unique id helper (used by NotificationService, TodoWidget and QuickLinksWidget)
const generateId = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + '-' + Math.random().toString(36).slice(2);

// NotificationService — injects dismissible banner notifications; auto-removes after 4 s
const NotificationService = (() => {
  // Map of notification id → setTimeout handle, used by dismiss() to cancel pending auto-removal
  const _timers = {};

  /**
   * Displays a dismissible notification banner.
   * @param {string} message  The text to display.
   * @param {'error'|'info'|'validation'} type  Controls the banner style.
   * @returns {string}  A unique id that can be passed to dismiss() to remove the banner early.
   */
  function show(message, type) {
    const id = generateId();

    // Ensure the container exists; create it if absent (Req 9.5 / design §8.4)
    let container = document.getElementById('notifications-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notifications-container';
      container.setAttribute('aria-live', 'polite');
      document.body.insertBefore(container, document.body.firstChild);
    }

    // Build the notification element
    const el = document.createElement('div');
    el.setAttribute('role', 'alert');
    el.className = `notification notification--${type}`;
    el.dataset.id = id;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'notification__message';
    msgSpan.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'notification__close';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => dismiss(id));

    el.appendChild(msgSpan);
    el.appendChild(closeBtn);
    container.appendChild(el);

    // Auto-dismiss after 4 s (design §NotificationService)
    _timers[id] = setTimeout(() => dismiss(id), 4000);

    return id;
  }

  /**
   * Removes the notification with the given id from the DOM and cancels its timer.
   * @param {string} id
   */
  function dismiss(id) {
    // Clear the auto-dismiss timer if it hasn't fired yet
    if (_timers[id]) {
      clearTimeout(_timers[id]);
      delete _timers[id];
    }

    const el = document.querySelector(`.notification[data-id="${id}"]`);
    if (el) {
      el.remove();
    }
  }

  return { show, dismiss };
})();

// ThemeManager — light/dark toggle, OS preference detection, persistence
const ThemeManager = {
  init() {
    const saved = StorageService.read(KEY_THEME);
    if (saved === 'light' || saved === 'dark') {
      this.apply(saved);
    } else {
      this.apply(this._detect());
    }
  },
  toggle() {
    const current = document.documentElement.dataset.theme;
    this.apply(current === 'dark' ? 'light' : 'dark');
  },
  apply(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      const label = theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode';
      const text  = theme === 'dark' ? '☀️ Day Mode' : '🌙 Night Mode';
      btn.setAttribute('aria-label', label);
      btn.textContent = text;
    }
    const ok = StorageService.write(KEY_THEME, theme);
    if (!ok) {
      NotificationService.show(
        'Theme preference could not be saved. Applying for this session only.',
        'info'
      );
    }
  },
  _detect() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },
};

// GreetingWidget — live clock, date, greeting, custom name
const GreetingWidget = (() => {
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  let _name = '';

  function _pad(n) { return String(n).padStart(2, '0'); }

  function _formatTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '--:--:--';
    return `${_pad(date.getHours())}:${_pad(date.getMinutes())}:${_pad(date.getSeconds())}`;
  }

  function _formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Unknown date';
    return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }

  function _getGreeting(hour) {
    if (hour >= 5 && hour <= 11)  return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 20) return 'Good Evening';
    return 'Good Night';
  }

  function _render(time, dateStr, greeting) {
    const clockEl    = document.getElementById('clock');
    const dateEl     = document.getElementById('date-display');
    const greetingEl = document.getElementById('greeting-text');
    if (clockEl)    clockEl.textContent    = time;
    if (dateEl)     dateEl.textContent     = dateStr;
    if (greetingEl) greetingEl.textContent = _name ? `${greeting}, ${_name}!` : greeting;
  }

  function _tick() {
    const now = new Date();
    _render(_formatTime(now), _formatDate(now), _getGreeting(now.getHours()));
  }

  function setName(name) {
    const trimmed = name.trim();
    if (trimmed) {
      StorageService.write(KEY_USERNAME, trimmed);
      _name = trimmed;
    } else {
      StorageService.remove(KEY_USERNAME);
      _name = '';
    }
    _tick();
  }

  function init() {
    const saved = StorageService.read(KEY_USERNAME);
    _name = saved ? String(saved).trim() : '';

    const form = document.getElementById('name-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('name-input');
        if (input) setName(input.value);
      });
    }

    // Character-limit guard (task 4.10)
    const nameInput = document.getElementById('name-input');
    const nameError = document.getElementById('name-error');
    if (nameInput && nameError) {
      nameInput.addEventListener('input', () => {
        nameError.textContent = nameInput.value.length >= 50
          ? 'Character limit reached (50 max)'
          : '';
      });
    }

    _tick();
    setInterval(_tick, 1000);
  }

  return { init, setName, _tick, _getGreeting, _formatTime, _formatDate };
})();

// TimerWidget — Pomodoro countdown, configurable duration, completion notification
const TimerWidget = (() => {
  const state = {
    configured: 25,
    remaining: 1500,
    running: false,
    intervalId: null,
  };

  function _pad(n) { return String(n).padStart(2, '0'); }

  function _validateDuration(input) {
    const n = parseInt(input, 10);
    if (!Number.isInteger(n) || n < 1 || n > 120) return null;
    return n;
  }

  function _formatDisplay(totalSeconds) {
    const MM = Math.floor(totalSeconds / 60);
    const SS = totalSeconds % 60;
    return `${_pad(MM)}:${_pad(SS)}`;
  }

  function _render(seconds) {
    const el = document.getElementById('timer-display');
    if (el) el.textContent = _formatDisplay(seconds);
  }

  function _onComplete() {
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.running = false;
    state.remaining = 0;
    _render(0);
    const msg = document.getElementById('timer-complete-msg');
    if (msg) {
      msg.textContent = 'Focus session complete! Great work.';
      msg.hidden = false;
    }
  }

  function _tick() {
    state.remaining -= 1;
    _render(state.remaining);
    if (state.remaining <= 0) _onComplete();
  }

  function stop() {
    if (!state.running) return;
    clearInterval(state.intervalId);
    state.intervalId = null;
    state.running = false;
    const startBtn = document.getElementById('timer-start');
    if (startBtn) startBtn.disabled = false;
  }

  function start() {
    if (state.running) return;
    state.running = true;
    const startBtn = document.getElementById('timer-start');
    if (startBtn) startBtn.disabled = true;
    state.intervalId = setInterval(_tick, 1000);
  }

  function reset() {
    stop();
    state.remaining = state.configured * 60;
    _render(state.remaining);
    const msg = document.getElementById('timer-complete-msg');
    if (msg) msg.hidden = true;
  }

  function applyDuration(min) {
    const valid = _validateDuration(min.toString());
    const errEl = document.getElementById('duration-error');
    const inputEl = document.getElementById('duration-input');
    if (valid === null) {
      if (errEl) errEl.textContent = 'Please enter a whole number between 1 and 120.';
      if (inputEl) inputEl.value = state.configured;
      return;
    }
    if (errEl) errEl.textContent = '';
    stop();
    state.configured = valid;
    StorageService.write(KEY_TIMER_DURATION, valid);
    reset();
  }

  function init() {
    // Always reset to defaults first, then apply any valid stored value.
    // This ensures repeated init() calls (e.g., in tests) start from a clean state.
    state.configured = 25;
    state.running = false;
    if (state.intervalId !== null) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }

    const saved = StorageService.read(KEY_TIMER_DURATION);
    const valid = _validateDuration(String(saved));
    if (valid !== null) state.configured = valid;

    const startBtn  = document.getElementById('timer-start');
    const stopBtn   = document.getElementById('timer-stop');
    const resetBtn  = document.getElementById('timer-reset');
    const applyBtn  = document.getElementById('duration-apply');
    const inputEl   = document.getElementById('duration-input');

    if (startBtn)  startBtn.addEventListener('click',  start);
    if (stopBtn)   stopBtn.addEventListener('click',   stop);
    if (resetBtn)  resetBtn.addEventListener('click',  reset);
    if (applyBtn && inputEl) {
      applyBtn.addEventListener('click', () => {
        applyDuration(parseInt(inputEl.value, 10));
      });
    }

    reset();
  }

  return { init, start, stop, reset, applyDuration, _validateDuration, _formatDisplay, _tick, _onComplete, state };
})();

// TodoWidget — CRUD tasks, inline edit, complete/incomplete toggle, sort, localStorage persistence
const TodoWidget = (() => {
  let tasks = [];
  let sortOrder = 'none';

  // ── helpers ────────────────────────────────────────────────────────────────

  function _persist() {
    const okTasks = StorageService.write(KEY_TASKS, tasks);
    const okSort  = StorageService.write(KEY_SORT_ORDER, sortOrder);
    if (!okTasks || !okSort) {
      NotificationService.show(
        'Could not save your changes — storage is full.',
        'error'
      );
    }
  }

  function _getDisplayList() {
    // Returns a sorted *shallow copy* — never mutates the original tasks array.
    const copy = tasks.slice();
    if (sortOrder === 'incomplete-first') {
      // false (0) < true (1), so subtracting puts false (incomplete) first
      copy.sort((a, b) => Number(a.completed) - Number(b.completed));
    } else if (sortOrder === 'completed-first') {
      copy.sort((a, b) => Number(b.completed) - Number(a.completed));
    }
    return copy;
  }

  // ── rendering ──────────────────────────────────────────────────────────────

  /**
   * Builds one task <li> row and returns the element.
   * @param {Object} task  { id, text, completed, createdAt }
   * @returns {HTMLLIElement}
   */
  function _renderTask(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;
    li.className = 'task-item';

    // Toggle (checkbox-style) button
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'task-toggle';
    toggleBtn.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
    toggleBtn.setAttribute('data-action', 'toggle');
    toggleBtn.textContent = task.completed ? '✓' : '○';

    // Text span
    const textSpan = document.createElement('span');
    textSpan.className = task.completed ? 'task-text completed' : 'task-text';
    textSpan.textContent = task.text;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'task-edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.setAttribute('data-action', 'edit');
    editBtn.textContent = 'Edit';

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task-delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.setAttribute('data-action', 'delete');
    deleteBtn.textContent = 'Delete';

    li.appendChild(toggleBtn);
    li.appendChild(textSpan);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    return li;
  }

  /**
   * Clears #task-list and re-renders every task via event delegation.
   */
  function _renderAll() {
    const listEl = document.getElementById('task-list');
    if (!listEl) return;

    // Replace all children
    listEl.innerHTML = '';

    const display = _getDisplayList();
    display.forEach((task) => {
      listEl.appendChild(_renderTask(task));
    });
  }

  // ── public CRUD ────────────────────────────────────────────────────────────

  function addTask(text) {
    const trimmed = text.trim();
    const errorEl = document.getElementById('todo-input-error');

    if (!trimmed) {
      if (errorEl) errorEl.textContent = 'Task text cannot be empty.';
      return;
    }
    if (errorEl) errorEl.textContent = '';

    const task = {
      id: generateId(),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    };
    tasks.push(task);
    _persist();
    _renderAll();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    _persist();
    _renderAll();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      _persist();
      _renderAll();
    }
  }

  // ── inline edit ────────────────────────────────────────────────────────────

  function beginEdit(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const li = document.querySelector(`[data-id="${id}"]`);
    if (!li) return;

    // Replace text span with an input
    const textSpan = li.querySelector('.task-text');
    if (textSpan) {
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.className = 'task-edit-input';
      editInput.value = task.text;
      editInput.maxLength = 250;
      editInput.setAttribute('aria-label', 'Edit task text');
      li.replaceChild(editInput, textSpan);
    }

    // Replace Edit button with Save + Cancel buttons
    const editBtn = li.querySelector('[data-action="edit"]');
    if (editBtn) {
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'task-save';
      saveBtn.setAttribute('aria-label', 'Save edit');
      saveBtn.setAttribute('data-action', 'save');
      saveBtn.textContent = 'Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'task-cancel';
      cancelBtn.setAttribute('aria-label', 'Cancel edit');
      cancelBtn.setAttribute('data-action', 'cancel');
      cancelBtn.textContent = 'Cancel';

      li.replaceChild(saveBtn, editBtn);
      li.appendChild(cancelBtn);
    }
  }

  function saveEdit(id, newText) {
    const trimmed = newText.trim();

    // Show inline validation if empty
    const li = document.querySelector(`[data-id="${id}"]`);
    let inlineError = li ? li.querySelector('.task-inline-error') : null;

    if (!trimmed) {
      if (li && !inlineError) {
        inlineError = document.createElement('span');
        inlineError.className = 'task-inline-error';
        li.appendChild(inlineError);
      }
      if (inlineError) inlineError.textContent = 'Task text cannot be empty.';
      return;
    }

    const task = tasks.find((t) => t.id === id);
    if (task) {
      task.text = trimmed;
      _persist();
      _renderAll();
    }
  }

  function cancelEdit(id) {
    // Simply re-render — restores the original view without any data mutation
    _renderAll();
  }

  // ── sort ───────────────────────────────────────────────────────────────────

  function setSortOrder(order) {
    sortOrder = order;
    _persist();
    _renderAll();
  }

  // ── init ───────────────────────────────────────────────────────────────────

  function init() {
    const savedTasks = StorageService.read(KEY_TASKS);
    tasks = Array.isArray(savedTasks) ? savedTasks : [];

    const savedSort = StorageService.read(KEY_SORT_ORDER);
    sortOrder = (savedSort === 'incomplete-first' || savedSort === 'completed-first')
      ? savedSort
      : 'none';

    // Sync the sort-order <select> to the restored value
    const sortEl = document.getElementById('sort-order');
    if (sortEl) {
      sortEl.value = sortOrder;
      sortEl.addEventListener('change', () => {
        setSortOrder(sortEl.value);
      });
    }

    // Form submit — add new task
    const form = document.getElementById('todo-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('todo-input');
        if (input) {
          addTask(input.value);
          input.value = '';
        }
      });
    }

    // Event delegation — handle toggle / edit / save / cancel / delete clicks
    const listEl = document.getElementById('task-list');
    if (listEl) {
      listEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const li = btn.closest('[data-id]');
        if (!li) return;
        const id = li.dataset.id;

        switch (btn.dataset.action) {
          case 'toggle':
            toggleTask(id);
            break;
          case 'edit':
            beginEdit(id);
            break;
          case 'save': {
            const inputEl = li.querySelector('.task-edit-input');
            saveEdit(id, inputEl ? inputEl.value : '');
            break;
          }
          case 'cancel':
            cancelEdit(id);
            break;
          case 'delete':
            deleteTask(id);
            break;
        }
      });
    }

    _renderAll();
  }

  return {
    init,
    addTask,
    deleteTask,
    toggleTask,
    beginEdit,
    saveEdit,
    cancelEdit,
    setSortOrder,
    _getDisplayList,
    _persist,
    _renderAll,
    _renderTask,
  };
})();

// QuickLinksWidget — add/delete links, render as cards, open in new tab, max-50 enforcement
const QuickLinksWidget = (() => {
  let links = [];

  // ── validation ─────────────────────────────────────────────────────────────

  /**
   * Returns true if `url` is a valid http(s) URL with a non-empty host.
   * @param {string} url
   * @returns {boolean}
   */
  function _validateUrl(url) {
    try {
      const u = new URL(url.trim());
      return (u.protocol === 'http:' || u.protocol === 'https:') && u.host.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Returns true if `label` is a non-empty, non-whitespace-only string.
   * @param {string} label
   * @returns {boolean}
   */
  function _validateLabel(label) {
    return label.trim().length > 0;
  }

  // ── persistence ────────────────────────────────────────────────────────────

  function _persist() {
    const ok = StorageService.write(KEY_QUICKLINKS, links);
    if (!ok) {
      NotificationService.show(
        'Could not save your changes — storage is full.',
        'error'
      );
    }
  }

  // ── rendering ──────────────────────────────────────────────────────────────

  /**
   * Builds one link card element and returns it.
   * @param {{ id: string, label: string, url: string, createdAt: number }} link
   * @returns {HTMLDivElement}
   */
  function _renderLink(link) {
    const card = document.createElement('div');
    card.className = 'link-card';
    card.dataset.id = link.id;

    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.label;
    anchor.className = 'link-anchor';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'link-delete';
    deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
    deleteBtn.setAttribute('data-action', 'delete');
    deleteBtn.textContent = 'Delete';

    card.appendChild(anchor);
    card.appendChild(deleteBtn);

    return card;
  }

  /**
   * Clears #links-panel and re-renders all links. Toggles #link-limit-msg visibility.
   */
  function _renderAll() {
    const panel = document.getElementById('links-panel');
    if (!panel) return;

    panel.innerHTML = '';
    links.forEach((link) => {
      panel.appendChild(_renderLink(link));
    });

    const limitMsg = document.getElementById('link-limit-msg');
    if (limitMsg) {
      limitMsg.hidden = links.length < 50;
    }
  }

  // ── public CRUD ────────────────────────────────────────────────────────────

  /**
   * Validates inputs and, if both valid and under the 50-link cap, adds the link.
   * @param {string} label
   * @param {string} url
   */
  function addLink(label, url) {
    const labelErrorEl = document.getElementById('link-label-error');
    const urlErrorEl   = document.getElementById('link-url-error');

    const labelValid = _validateLabel(label);
    const urlValid   = _validateUrl(url);

    if (labelErrorEl) {
      labelErrorEl.textContent = labelValid ? '' : 'Label cannot be empty.';
    }
    if (urlErrorEl) {
      urlErrorEl.textContent = urlValid
        ? ''
        : 'Please enter a valid URL starting with http:// or https://.';
    }

    if (!labelValid || !urlValid) return;

    // Enforce 50-link cap
    if (links.length >= 50) {
      const limitMsg = document.getElementById('link-limit-msg');
      if (limitMsg) limitMsg.hidden = false;
      return;
    }

    const link = {
      id: generateId(),
      label: label.trim(),
      url: url.trim(),
      createdAt: Date.now(),
    };
    links.push(link);
    _persist();
    _renderAll();
  }

  /**
   * Removes the link with the given id, then persists and re-renders.
   * @param {string} id
   */
  function deleteLink(id) {
    links = links.filter((l) => l.id !== id);
    _persist();
    _renderAll();
  }

  // ── init ───────────────────────────────────────────────────────────────────

  function init() {
    const saved = StorageService.read(KEY_QUICKLINKS);
    links = Array.isArray(saved) ? saved : [];

    // Form submit — add new link
    const form = document.getElementById('quicklink-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const labelInput = document.getElementById('link-label-input');
        const urlInput   = document.getElementById('link-url-input');
        if (labelInput && urlInput) {
          addLink(labelInput.value, urlInput.value);
          // Clear inputs only on successful add (errors stay visible otherwise)
          const labelErrorEl = document.getElementById('link-label-error');
          const urlErrorEl   = document.getElementById('link-url-error');
          if (
            labelErrorEl && urlErrorEl &&
            labelErrorEl.textContent === '' &&
            urlErrorEl.textContent === ''
          ) {
            labelInput.value = '';
            urlInput.value   = '';
          }
        }
      });
    }

    // Event delegation — handle delete clicks on the links panel
    const panel = document.getElementById('links-panel');
    if (panel) {
      panel.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="delete"]');
        if (!btn) return;
        const card = btn.closest('[data-id]');
        if (!card) return;
        deleteLink(card.dataset.id);
      });
    }

    _renderAll();
  }

  return {
    init,
    addLink,
    deleteLink,
    _validateUrl,
    _validateLabel,
    _persist,
    _renderAll,
    _renderLink,
  };
})();

// Bootstrap — wire up all widgets once the DOM is fully parsed.
// Initialisation order matters: ThemeManager first (prevents flash of unstyled theme),
// then NotificationService container readiness, then the four content widgets.
document.addEventListener('DOMContentLoaded', () => {
  // 1. Apply the saved (or OS-detected) theme before any content renders,
  //    to prevent a flash of the wrong colour scheme.
  ThemeManager.init();

  // 2. Ensure the #notifications-container exists so that any widget that calls
  //    NotificationService.show() during its own init() has a container ready.
  //    NotificationService itself is a lazy-init IIFE (it creates the container
  //    on first use), but we prime it here for clarity and robustness.
  if (!document.getElementById('notifications-container')) {
    const container = document.createElement('div');
    container.id = 'notifications-container';
    container.setAttribute('aria-live', 'polite');
    document.body.insertBefore(container, document.body.firstChild);
  }

  // 3–6. Initialise content widgets in display order.
  GreetingWidget.init();
  TimerWidget.init();
  TodoWidget.init();
  QuickLinksWidget.init();
});

// Conditional export for Jest/Node testing environment
// The browser never defines `module`, so this block is skipped in production.
if (typeof module !== 'undefined') {
  module.exports = {
    StorageService,
    NotificationService,
    ThemeManager,
    GreetingWidget,
    TimerWidget,
    TodoWidget,
    QuickLinksWidget,
    generateId,
  };
}
