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
      const label = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      const text  = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
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
