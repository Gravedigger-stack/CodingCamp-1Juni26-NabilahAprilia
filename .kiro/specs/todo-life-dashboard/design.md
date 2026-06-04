# Design Document

## Overview

The To-Do List Life Dashboard is a single-page, zero-dependency productivity homepage that runs entirely in the browser. There is no server, no build pipeline, and no external libraries — just one HTML file, one CSS file, and one JavaScript file communicating through the DOM and the browser's `localStorage` API.

The four core widgets (Greeting/Clock, Pomodoro Timer, To-Do List, Quick Links) plus three challenge features (Dark/Light mode, custom name, adjustable Pomodoro duration) are all coordinated by a lightweight module pattern inside `js/app.js`. Each widget owns its own slice of `localStorage` and is responsible for reading, rendering, and persisting its own state.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Single JS file, module pattern via IIFEs/objects | Keeps the "exactly one JS file" constraint while still separating concerns |
| CSS custom properties for theming | Instant, zero-JS theme switching; no class toggling on every element |
| `setInterval` for both clock and timer | Simple 1-second ticks; corrected against wall-clock on each fire |
| Dedicated `localStorage` keys per widget | Avoids parsing the whole state blob if one widget's data is corrupt |
| Sort order stored separately from task data | Sorting is a view concern; stored task order is preserved |

---

## Architecture

```
index.html
├── <link> css/style.css
└── <script> js/app.js
         │
         ├── StorageService      — thin wrapper around localStorage (read/write/remove)
         ├── GreetingWidget      — clock, date, greeting, custom name
         ├── TimerWidget         — Pomodoro countdown, configurable duration
         ├── TodoWidget          — CRUD tasks, sort, persistence
         ├── QuickLinksWidget    — add/delete links, open in new tab
         ├── ThemeManager        — light/dark toggle, OS preference detection
         └── init()              — bootstraps all widgets on DOMContentLoaded
```

All communication between widgets is event-based (custom `CustomEvent` dispatched on `document`). No widget reaches into another widget's DOM or state directly. This keeps each widget independently testable.

### Data Flow

```
User action
    │
    ▼
Widget handler
    │  validates input
    ▼
StorageService.write(key, data)
    │  serialises to JSON, catches QuotaExceededError
    ▼
localStorage
    │
    ▼  (on page load)
StorageService.read(key)
    │  parses JSON, returns null on missing/corrupt
    ▼
Widget.init()  →  render()
```

---

## Components and Interfaces

### StorageService

Provides a safe, centralised interface to `localStorage`. All widgets use this; nothing calls `localStorage` directly.

```js
StorageService = {
  read(key)          // → parsed value | null
  write(key, value)  // → true | false (false = QuotaExceededError)
  remove(key)        // → void
  isAvailable()      // → boolean
}
```

Error handling: `write()` catches `QuotaExceededError` and returns `false`; callers show a non-blocking notification. `read()` wraps `JSON.parse` in try/catch and returns `null` on failure.

**localStorage keys:**

| Key | Widget | Type |
|---|---|---|
| `tld_userName` | Greeting | `string` |
| `tld_theme` | ThemeManager | `"light" \| "dark"` |
| `tld_pomodoroDuration` | Timer | `number` (minutes) |
| `tld_tasks` | Todo | `Task[]` |
| `tld_quickLinks` | QuickLinks | `QuickLink[]` |
| `tld_sortOrder` | Todo | `"none" \| "incomplete-first" \| "completed-first"` |

---

### GreetingWidget

**Responsibilities:** Display live HH:MM:SS clock, full date string, contextual greeting, and the user's custom name.

```js
GreetingWidget = {
  init()                         // reads name from storage, starts interval
  _tick()                        // called every ~1000 ms via setInterval
  _getGreeting(hour)             // pure: number → string
  _formatTime(date)              // pure: Date → "HH:MM:SS"
  _formatDate(date)              // pure: Date → "DayName, D Month YYYY"
  _render(time, date, greeting)  // updates DOM
  setName(name)                  // called by name input handler
}
```

Clock interval: `setInterval(_tick, 1000)`. On each tick, a fresh `new Date()` is created so the display self-corrects against wall-clock drift.

---

### TimerWidget

**Responsibilities:** Countdown timer with start/stop/reset, configurable duration, completion notification.

```js
TimerWidget = {
  init()              // reads duration from storage, renders display
  start()             // guards against duplicate intervals; disables Start button
  stop()              // pauses countdown
  reset()             // restores configured duration
  applyDuration(min)  // validates 1–120, persists, calls reset()
  _tick()             // decrements remaining seconds; fires _onComplete at 0
  _onComplete()       // clears interval, shows completion message, stays at 00:00
  _formatDisplay(s)   // pure: totalSeconds → "MM:SS"
  _render(seconds)    // updates DOM
  _validateDuration(input) // pure: string → number | null
}
```

State: `{ configured: number, remaining: number, running: boolean, intervalId: number|null }` — held in memory only; running state is never persisted (a reload always resets to the stored configured duration).

---

### TodoWidget

**Responsibilities:** CRUD tasks, inline edit, complete/incomplete toggle, sort, localStorage persistence.

```js
TodoWidget = {
  init()                    // loads tasks and sort order from storage
  addTask(text)             // validates, creates Task object, appends, persists
  deleteTask(id)            // removes by id, persists
  toggleTask(id)            // flips completed, persists
  beginEdit(id)             // swaps text span for <input>
  saveEdit(id, newText)     // validates newText, updates, persists
  cancelEdit(id)            // restores original text span
  setSortOrder(order)       // stores order, re-renders
  _getDisplayList()         // pure: returns sorted copy of tasks[]
  _persist()                // serialises tasks[] and sortOrder to storage
  _renderAll()              // clears list DOM, renders each task
  _renderTask(task)         // builds one task row
}
```

Each Task has a stable `id` generated with `crypto.randomUUID()` (or `Date.now() + Math.random()` as fallback). This id is used as the DOM element's `data-id` attribute for event delegation.

---

### QuickLinksWidget

**Responsibilities:** Add/delete links, render as cards, open in new tab, max-50 enforcement.

```js
QuickLinksWidget = {
  init()                       // loads links from storage, renders
  addLink(label, url)          // validates, appends, persists
  deleteLink(id)               // removes, persists
  _validateUrl(url)            // pure: string → boolean (http(s)://host check)
  _validateLabel(label)        // pure: string → boolean (non-empty, trimmed)
  _persist()                   // serialises links[] to storage
  _renderAll()                 // clears panel DOM, renders each link
  _renderLink(link)            // builds one link card
}
```

URL validation uses a URL constructor check:

```js
function _validateUrl(raw) {
  try {
    const u = new URL(raw.trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.host.length > 0;
  } catch { return false; }
}
```

---

### ThemeManager

**Responsibilities:** Toggle light/dark, OS preference detection, CSS custom property switching, localStorage persistence.

```js
ThemeManager = {
  init()          // reads storage → OS pref → default; applies theme
  toggle()        // flips current theme, persists, applies
  apply(theme)    // sets data-theme attribute on <html>; updates toggle label
  _detect()       // returns 'dark' if window.matchMedia prefers dark, else 'light'
}
```

The CSS file defines two sets of custom properties under `[data-theme="light"]` and `[data-theme="dark"]`. `ThemeManager.apply(theme)` sets `document.documentElement.dataset.theme = theme`. No per-element class changes are needed.

---

### NotificationService (shared utility)

```js
NotificationService = {
  show(message, type)  // type: 'error' | 'info' | 'validation'
                       // injects a dismissible banner; auto-removes after 4 s
  dismiss(id)
}
```

---

## Data Models

### Task

```js
{
  id: string,           // crypto.randomUUID()
  text: string,         // trimmed, 1–250 chars
  completed: boolean,   // false on creation
  createdAt: number     // Date.now() — for stable re-ordering after sort-then-revert
}
```

### QuickLink

```js
{
  id: string,           // crypto.randomUUID()
  label: string,        // trimmed, non-empty
  url: string,          // trimmed, validated http(s)://host
  createdAt: number
}
```

### Timer state (in-memory only)

```js
{
  configured: number,   // minutes, default 25
  remaining: number,    // seconds
  running: boolean,
  intervalId: number | null
}
```

### Persisted theme value

`"light"` or `"dark"` — a raw string, not an object.

### Persisted sort order

`"none"`, `"incomplete-first"`, or `"completed-first"`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Time formatting always produces valid HH:MM:SS

*For any* valid `Date` object, `_formatTime(date)` SHALL return a string that matches the pattern `HH:MM:SS` where HH is in [00–23], MM is in [00–59], and SS is in [00–59], with all fields zero-padded to two digits.

**Validates: Requirements 1.1**

---

### Property 2: Date formatting always produces correctly structured date string

*For any* valid `Date` object, `_formatDate(date)` SHALL return a string of the form `"DayName, D Month YYYY"` where DayName is one of the seven English weekday names, D is the non-padded day of month (1–31), Month is one of the twelve English month names, and YYYY is the four-digit year.

**Validates: Requirements 1.2**

---

### Property 3: Greeting matches the correct hour partition

*For any* integer `hour` in the range [0, 23], `_getGreeting(hour)` SHALL return:
- `"Good Morning"` when hour ∈ [5, 11]
- `"Good Afternoon"` when hour ∈ [12, 17]
- `"Good Evening"` when hour ∈ [18, 20]
- `"Good Night"` when hour ∈ [0, 4] ∪ [21, 23]

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 4: Valid name submission persists trimmed name and appears in greeting

*For any* non-empty, non-whitespace-only string `name` (up to 50 chars, optionally with leading/trailing whitespace), submitting it SHALL: (a) store `name.trim()` under `tld_userName` in localStorage, and (b) cause the greeting display to contain `, {name.trim()}!` as a suffix. A subsequent `GreetingWidget.init()` SHALL restore the greeting with the same name without re-entry.

**Validates: Requirements 2.2, 2.3, 2.4**

---

### Property 5: Whitespace-only name clears name from greeting and storage

*For any* string composed entirely of whitespace characters (including the empty string, up to 50 chars), submitting it as a User_Name SHALL result in: (a) the greeting displaying no `, ...!` name suffix, and (b) `tld_userName` being absent from localStorage.

**Validates: Requirements 2.5**

---

### Property 6: Timer reset restores the configured duration exactly

*For any* integer `d` in [1, 120], after calling `TimerWidget.applyDuration(d)` and then `TimerWidget.reset()`, the `remaining` value SHALL equal `d × 60` seconds and the display SHALL show `MM:SS` corresponding to that total.

**Validates: Requirements 3.4, 4.2**

---

### Property 7: Valid duration input persists and is restored on reload

*For any* integer `d` in [1, 120], after calling `applyDuration(d)`, `StorageService.read('tld_pomodoroDuration')` SHALL return `d`. A subsequent `TimerWidget.init()` (with no further changes) SHALL display `d` minutes remaining.

**Validates: Requirements 4.3**

---

### Property 8: Invalid duration inputs are always rejected

*For any* input value that is a non-integer, a value outside [1, 120], an empty string, or a non-numeric string, `TimerWidget._validateDuration(input)` SHALL return `null` and the configured duration SHALL remain unchanged.

**Validates: Requirements 4.4**

---

### Property 9: Applying a new duration while running stops the timer

*For any* valid duration `d` in [1, 120], if the timer is currently running (`running === true`) and `applyDuration(d)` is called, THEN `running` SHALL become `false` and `remaining` SHALL equal `d × 60`.

**Validates: Requirements 4.5**

---

### Property 10: Adding a valid task grows the list by one with trimmed text

*For any* non-empty, non-whitespace-only string `text` (up to 250 chars, with optional surrounding whitespace), calling `TodoWidget.addTask(text)` SHALL increase `tasks.length` by exactly 1, and the newly created task's `text` field SHALL equal `text.trim()`.

**Validates: Requirements 5.2**

---

### Property 11: Adding a whitespace-only task leaves the list unchanged

*For any* string composed entirely of whitespace (including the empty string, up to 250 chars), calling `TodoWidget.addTask(text)` SHALL leave `tasks.length` unchanged and SHALL not add any entry to localStorage.

**Validates: Requirements 5.3**

---

### Property 12: Toggling completion twice restores the original state

*For any* task in the task list (whether initially complete or incomplete), calling `TodoWidget.toggleTask(id)` twice SHALL return the task's `completed` field to its original value. The intermediate state after the first toggle SHALL be the logical inverse of the original.

**Validates: Requirements 5.4, 5.5**

---

### Property 13: Valid inline edit updates task text and persists it

*For any* task and *any* non-empty, non-whitespace-only edit string `newText` (up to 250 chars), calling `TodoWidget.saveEdit(id, newText)` SHALL set `task.text` to `newText.trim()` and the updated text SHALL be reflected in `StorageService.read('tld_tasks')`.

**Validates: Requirements 5.6**

---

### Property 14: Whitespace-only inline edit leaves task text unchanged

*For any* task and *any* string composed entirely of whitespace characters, calling `TodoWidget.saveEdit(id, text)` SHALL leave `task.text` unchanged and SHALL not write a modified value to localStorage.

**Validates: Requirements 5.7**

---

### Property 15: Deleting a task removes it from the list and storage

*For any* non-empty task list and *any* task `id` present in it, calling `TodoWidget.deleteTask(id)` SHALL decrease `tasks.length` by exactly 1, the deleted `id` SHALL no longer appear in the array, and `StorageService.read('tld_tasks')` SHALL not contain that `id`.

**Validates: Requirements 5.8**

---

### Property 16: Task list round-trip through storage preserves order and data

*For any* array of `Task` objects, persisting them via `TodoWidget._persist()` and then calling `TodoWidget.init()` SHALL restore a task array with the same length, same `id`/`text`/`completed` values, and the same ordering.

**Validates: Requirements 5.9**

---

### Property 17: Incomplete-first sort places all incomplete tasks before all completed tasks

*For any* array of tasks containing a mix of complete and incomplete items, calling `TodoWidget.setSortOrder('incomplete-first')` and then `_getDisplayList()` SHALL return an array where every task with `completed === false` precedes every task with `completed === true`.

**Validates: Requirements 6.2**

---

### Property 18: Completed-first sort places all completed tasks before all incomplete tasks

*For any* array of tasks, calling `TodoWidget.setSortOrder('completed-first')` and then `_getDisplayList()` SHALL return an array where every task with `completed === true` precedes every task with `completed === false`.

**Validates: Requirements 6.3**

---

### Property 19: Sort order is persisted and restored on reload

*For any* value in `{"none", "incomplete-first", "completed-first"}`, after calling `TodoWidget.setSortOrder(order)`, `StorageService.read('tld_sortOrder')` SHALL equal `order`. A subsequent `TodoWidget.init()` SHALL restore and apply the same sort order.

**Validates: Requirements 6.5**

---

### Property 20: Valid Quick Link addition persists and is rendered

*For any* valid pair `(label, url)` — where `label` is a non-empty, non-whitespace-only string and `url` is a trimmed string beginning with `http://` or `https://` with a non-empty host — calling `QuickLinksWidget.addLink(label, url)` SHALL increase `links.length` by 1 and the link SHALL appear in `StorageService.read('tld_quickLinks')`.

**Validates: Requirements 7.2**

---

### Property 21: Invalid Quick Link inputs are always rejected

*For any* input pair where the label is empty or whitespace-only, or the URL is empty, whitespace-only, or does not begin with `http://`/`https://` with a non-empty host, calling `QuickLinksWidget.addLink(label, url)` SHALL leave `links.length` unchanged and SHALL return a validation error identifying the offending field.

**Validates: Requirements 7.6**

---

### Property 22: Deleting a Quick Link removes it from the list and storage

*For any* non-empty links array and *any* link `id` present in it, calling `QuickLinksWidget.deleteLink(id)` SHALL decrease `links.length` by 1 and the deleted `id` SHALL not appear in `StorageService.read('tld_quickLinks')`.

**Validates: Requirements 7.4**

---

### Property 23: Quick Links round-trip through storage preserves all links

*For any* array of `QuickLink` objects (up to 50), persisting them and calling `QuickLinksWidget.init()` SHALL restore an array with the same length, `id`, `label`, and `url` values.

**Validates: Requirements 7.5**

---

### Property 24: Theme application is reflected immediately in the DOM

*For any* value in `{"light", "dark"}`, calling `ThemeManager.apply(theme)` SHALL set `document.documentElement.dataset.theme` to exactly that value.

**Validates: Requirements 8.2, 8.3**

---

### Property 25: Theme change is persisted and restored on reload

*For any* value in `{"light", "dark"}`, after `ThemeManager.apply(theme)`, `StorageService.read('tld_theme')` SHALL equal `theme`. A subsequent `ThemeManager.init()` (with that value in storage) SHALL apply the same theme to the DOM before rendering.

**Validates: Requirements 8.4, 8.5**

---

### Property 26: StorageService serialization is a faithful round-trip

*For any* JSON-serializable value `v` (object, array, string, number, boolean), calling `StorageService.write(key, v)` followed by `StorageService.read(key)` SHALL return a value deeply equal to `v`.

**Validates: Requirements 9.3**

---

### Property 27: Corrupt or missing localStorage data produces default widget state

*For any* non-JSON string written directly to a storage key (e.g., `tld_tasks`), `StorageService.read(key)` SHALL return `null`, and the corresponding widget's `init()` SHALL initialize with its default empty/default state without throwing an error.

**Validates: Requirements 9.4**

---

## Error Handling

### Validation Errors (user-facing, non-blocking)

All validation errors are displayed as inline messages adjacent to the offending input. They are cleared automatically when the user corrects or changes the value.

| Scenario | Message location | Auto-clear trigger |
|---|---|---|
| Empty/whitespace task text | Below task input | On valid input submission |
| Empty/whitespace name | Below name input | On next submission |
| Invalid duration (non-integer, out-of-range) | Adjacent to duration input | On valid Apply |
| Empty/whitespace link label | Adjacent to label input | On next Add attempt |
| Invalid URL | Adjacent to URL input | On next Add attempt |
| Inline edit cleared/whitespace | Adjacent to inline edit field | On valid save |

### Storage Errors (non-blocking banner notifications)

Displayed by `NotificationService.show(message, 'error')`. Auto-dismissed after 4 seconds.

| Scenario | Message |
|---|---|
| `localStorage` write fails (quota exceeded) | "Could not save your changes — storage is full." |
| `localStorage` unavailable (security restriction) | "Storage is unavailable. Changes will not be saved." |
| Theme write fails | "Theme preference could not be saved. Applying for this session only." |

### Runtime Errors

| Scenario | Behaviour |
|---|---|
| Invalid `Date` from system clock | Display `--:--:--`, `"Unknown date"`, no greeting |
| `crypto.randomUUID` unavailable | Fall back to `Date.now() + '-' + Math.random().toString(36).slice(2)` |
| `window.matchMedia` unavailable | Default to Light theme |

---

