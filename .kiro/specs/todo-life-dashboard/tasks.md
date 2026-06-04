# Implementation Plan: Todo Life Dashboard

## Overview

This plan breaks the To-Do List Life Dashboard into 12 ordered implementation waves, progressing from project scaffolding through to full test coverage. Each task references the relevant requirements and design properties. All code is Vanilla JS / HTML / CSS — no frameworks, no build step.

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1"],
      "description": "Project scaffolding — file structure, package.json, Jest config"
    },
    {
      "wave": 2,
      "tasks": ["2"],
      "description": "StorageService — localStorage abstraction used by all widgets"
    },
    {
      "wave": 3,
      "tasks": ["3", "4", "5", "6", "7", "8"],
      "description": "All widgets (ThemeManager, GreetingWidget, TimerWidget, TodoWidget, QuickLinksWidget, NotificationService) — depend on StorageService"
    },
    {
      "wave": 4,
      "tasks": ["9"],
      "description": "Data persistence integration review — wire up all widgets to storage, bootstrap init()"
    },
    {
      "wave": 5,
      "tasks": ["10"],
      "description": "Responsive layout and accessibility — CSS grid, ARIA, touch targets"
    },
    {
      "wave": 6,
      "tasks": ["11", "12"],
      "description": "Property-based tests (fast-check, 27 properties) and unit/integration tests"
    }
  ]
}
```

## Tasks

- [x] 1. Project Scaffolding
  - [x] 1.1 Create the top-level entry point `index.html` with the standard HTML5 boilerplate: `<!DOCTYPE html>`, `<html lang="en">`, `<head>` (charset, viewport meta, title "Life Dashboard"), a `<link>` to `css/style.css`, and a `<script defer src="js/app.js">` tag at the end of `<body>`.
  - [x] 1.2 Create `css/style.css` as an empty placeholder file inside the `css/` directory.
  - [x] 1.3 Create `js/app.js` as an empty placeholder file inside the `js/` directory.
  - [x] 1.4 Create the `tests/unit/` and `tests/integration/` directory structure with `.gitkeep` files so directories are tracked by Git.
  - [x] 1.5 Create `package.json` at the project root with `"type": "commonjs"`, `"scripts": { "test": "jest --testEnvironment jsdom" }`, and dev dependencies for `jest@29.7.0`, `jest-environment-jsdom@29.7.0`, and `fast-check@3.19.0`. Run `npm install` to install them.
  - [x] 1.6 Create `jest.config.js` at the project root configuring `testEnvironment: 'jsdom'`, `testMatch: ['**/tests/**/*.test.js']`, and `coverageDirectory: 'coverage'`.
  - **References:** Requirement 10.1, 10.2, 10.3

- [x] 2. StorageService
  - [x] 2.1 In `js/app.js`, define a `StorageService` object literal with four methods: `isAvailable()`, `read(key)`, `write(key, value)`, and `remove(key)`.
  - [x] 2.2 Implement `isAvailable()`: attempt a test write/read/delete of a sentinel key inside a try/catch; return `true` if successful, `false` otherwise.
  - [x] 2.3 Implement `read(key)`: wrap `JSON.parse(localStorage.getItem(key))` in a try/catch; return the parsed value on success, `null` on any error or if the item is absent.
  - [x] 2.4 Implement `write(key, value)`: wrap `localStorage.setItem(key, JSON.stringify(value))` in a try/catch; return `true` on success, `false` on `QuotaExceededError` or any other error.
  - [x] 2.5 Implement `remove(key)`: call `localStorage.removeItem(key)` with no return value.
  - [x] 2.6 Define the six storage key constants as module-level constants: `KEY_USERNAME = 'tld_userName'`, `KEY_THEME = 'tld_theme'`, `KEY_TIMER_DURATION = 'tld_pomodoroDuration'`, `KEY_TASKS = 'tld_tasks'`, `KEY_QUICKLINKS = 'tld_quickLinks'`, `KEY_SORT_ORDER = 'tld_sortOrder'`.
  - **References:** Requirement 9.1, 9.2, 9.3, 9.4, 9.5; Design Properties 26, 27

- [x] 3. ThemeManager and CSS Custom Properties
  - [x] 3.1 In `css/style.css`, define CSS custom properties for the light theme under `[data-theme="light"]` and for the dark theme under `[data-theme="dark"]`. Include variables for: `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-border`, `--color-accent`, and `--color-accent-hover`.
  - [x] 3.2 Add base styles to `css/style.css`: set `body { font-size: 16px; ... }`, apply `var(--color-bg)` and `var(--color-text-primary)` to `body`, and ensure all transitions on theme-related properties use `transition: background-color 0.2s, color 0.2s`.
  - [x] 3.3 In `js/app.js`, define the `ThemeManager` object with methods: `init()`, `toggle()`, `apply(theme)`, and `_detect()`.
  - [x] 3.4 Implement `_detect()`: return `'dark'` if `window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches`, otherwise return `'light'`. Guard against `matchMedia` being unavailable.
  - [x] 3.5 Implement `apply(theme)`: set `document.documentElement.dataset.theme = theme`, update the toggle button's accessible label and visible text to reflect the new state, and call `StorageService.write(KEY_THEME, theme)`. If the write returns `false`, call `NotificationService.show(...)` with an informational message.
  - [x] 3.6 Implement `init()`: read `StorageService.read(KEY_THEME)`; if a valid value (`'light'` or `'dark'`) exists, call `apply()` with it; otherwise call `apply(_detect())`.
  - [x] 3.7 Implement `toggle()`: read the current `document.documentElement.dataset.theme`, flip it, and call `apply()` with the new value.
  - [x] 3.8 Add the theme toggle button to `index.html` inside a `<header>` element with `id="theme-toggle"`, an `aria-label`, and a visible text label.
  - **References:** Requirement 8.1–8.7, 10.7; Design Properties 24, 25

- [x] 4. GreetingWidget
  - [x] 4.1 Add the greeting section HTML to `index.html`: a `<section id="greeting-widget">` containing `<div id="clock">`, `<div id="date-display">`, `<p id="greeting-text">`, and a form with `<input id="name-input" maxlength="50" type="text">` and a submit button.
  - [x] 4.2 In `js/app.js`, define the `GreetingWidget` object with methods: `init()`, `_tick()`, `_getGreeting(hour)`, `_formatTime(date)`, `_formatDate(date)`, `_render(time, date, greeting)`, and `setName(name)`.
  - [x] 4.3 Implement `_formatTime(date)`: extract hours, minutes, seconds from the `Date` object and return a zero-padded `"HH:MM:SS"` string. Handle invalid dates by returning `"--:--:--"`.
  - [x] 4.4 Implement `_formatDate(date)`: use arrays of English day and month names to return `"DayName, D Month YYYY"`. Handle invalid dates by returning `"Unknown date"`.
  - [x] 4.5 Implement `_getGreeting(hour)`: return `"Good Morning"` for hours 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–20, and `"Good Night"` for 0–4 and 21–23.
  - [x] 4.6 Implement `_render(time, dateStr, greeting)`: update the `textContent` of `#clock`, `#date-display`, and `#greeting-text`. If a saved name exists, append `, {name}!` to the greeting.
  - [x] 4.7 Implement `_tick()`: create `new Date()`, call `_formatTime`, `_formatDate`, and `_getGreeting` with it, then call `_render`.
  - [x] 4.8 Implement `init()`: read `StorageService.read(KEY_USERNAME)`, store the trimmed name internally, attach the name form's `submit` event listener (calling `setName`), call `_tick()` once immediately, and then call `setInterval(_tick, 1000)`.
  - [x] 4.9 Implement `setName(name)`: trim the input; if non-empty, write to storage and update the internal name; if empty/whitespace, call `StorageService.remove(KEY_USERNAME)` and clear the internal name. Then call `_tick()` to refresh the display.
  - [x] 4.10 Add a character-limit guard on the name input: display a validation message in a `<span id="name-error">` adjacent to the input when the value reaches 50 characters.
  - **References:** Requirement 1.1–1.7, 2.1–2.6; Design Properties 1, 2, 3, 4, 5

- [x] 5. TimerWidget
  - [x] 5.1 Add the timer section HTML to `index.html`: a `<section id="timer-widget">` containing `<div id="timer-display">`, `<button id="timer-start">`, `<button id="timer-stop">`, `<button id="timer-reset">`, a `<div id="timer-complete-msg">` (hidden by default), a `<input id="duration-input" type="number" min="1" max="120">`, `<button id="duration-apply">`, and `<span id="duration-error">`.
  - [x] 5.2 In `js/app.js`, define the `TimerWidget` object with methods: `init()`, `start()`, `stop()`, `reset()`, `applyDuration(min)`, `_tick()`, `_onComplete()`, `_formatDisplay(s)`, `_render(seconds)`, and `_validateDuration(input)`.
  - [x] 5.3 Define the timer in-memory state object: `{ configured: 25, remaining: 1500, running: false, intervalId: null }`.
  - [x] 5.4 Implement `_validateDuration(input)`: parse the input string as an integer; return the integer if it is in [1, 120], otherwise return `null`.
  - [x] 5.5 Implement `_formatDisplay(totalSeconds)`: compute `MM = Math.floor(s / 60)` and `SS = s % 60`, return zero-padded `"MM:SS"`.
  - [x] 5.6 Implement `_render(seconds)`: update `#timer-display` textContent with `_formatDisplay(seconds)`.
  - [x] 5.7 Implement `start()`: guard against duplicate intervals (if `state.running` is `true`, return early); set `state.running = true`; disable `#timer-start`; call `setInterval(_tick, 1000)` and store the ID in `state.intervalId`.
  - [x] 5.8 Implement `stop()`: if not running, return early; clear the interval, set `state.running = false`, re-enable `#timer-start`.
  - [x] 5.9 Implement `reset()`: call `stop()`, set `state.remaining = state.configured * 60`, call `_render`, hide `#timer-complete-msg`.
  - [x] 5.10 Implement `_tick()`: decrement `state.remaining` by 1; call `_render(state.remaining)`; if `state.remaining <= 0`, call `_onComplete()`.
  - [x] 5.11 Implement `_onComplete()`: clear the interval, set `state.running = false`, set `state.remaining = 0`, call `_render(0)`, make `#timer-complete-msg` visible with the text "Focus session complete! Great work.".
  - [x] 5.12 Implement `applyDuration(min)`: call `_validateDuration(min.toString())`; if null, show validation error in `#duration-error` and revert the input field to `state.configured`; if valid, call `stop()`, set `state.configured = min`, call `StorageService.write(KEY_TIMER_DURATION, min)`, then call `reset()`. Clear `#duration-error` on valid input.
  - [x] 5.13 Implement `init()`: read `StorageService.read(KEY_TIMER_DURATION)`; if a valid number in [1, 120], set `state.configured` to it; otherwise default to 25. Attach click listeners for Start, Stop, Reset buttons, and the Apply button. Call `reset()` to set initial display.
  - **References:** Requirement 3.1–3.6, 4.1–4.5; Design Properties 6, 7, 8, 9

- [ ] 6. TodoWidget
  - [x] 6.1 Add the to-do section HTML to `index.html`: a `<section id="todo-widget">` containing `<form id="todo-form">` with `<input id="todo-input" type="text" maxlength="250">`, an Add button, `<span id="todo-input-error">`, a `<select id="sort-order">` with options `none`, `incomplete-first`, `completed-first`, and `<ul id="task-list">`.
  - [x] 6.2 In `js/app.js`, define the `TodoWidget` object with methods: `init()`, `addTask(text)`, `deleteTask(id)`, `toggleTask(id)`, `beginEdit(id)`, `saveEdit(id, newText)`, `cancelEdit(id)`, `setSortOrder(order)`, `_getDisplayList()`, `_persist()`, `_renderAll()`, and `_renderTask(task)`.
  - [x] 6.3 Define module-level `tasks = []` and `sortOrder = 'none'` variables inside the TodoWidget closure.
  - [x] 6.4 Implement `addTask(text)`: trim the text; if empty, show validation in `#todo-input-error` and return; create a `Task` object `{ id: generateId(), text: trimmed, completed: false, createdAt: Date.now() }`; push to `tasks`; call `_persist()` and `_renderAll()`.
  - [ ] 6.5 Implement `deleteTask(id)`: filter `tasks` to remove the entry with the matching id; call `_persist()` and `_renderAll()`.
  - [x] 6.6 Implement `toggleTask(id)`: find the task by id; flip `task.completed`; call `_persist()` and `_renderAll()`.
  - [x] 6.7 Implement `beginEdit(id)`: in the DOM row for the given id, replace the text `<span>` with an `<input>` pre-filled with `task.text`, and replace the Edit button with Save and Cancel buttons.
  - [x] 6.8 Implement `saveEdit(id, newText)`: trim `newText`; if empty/whitespace, show inline validation and return; update `task.text`; call `_persist()` and `_renderAll()`.
  - [x] 6.9 Implement `cancelEdit(id)`: call `_renderAll()` to restore the list to its pre-edit state without making any data change.
  - [x] 6.10 Implement `_getDisplayList()`: return a shallow copy of `tasks` sorted according to `sortOrder` — no sort for `'none'`, incomplete-first for `'incomplete-first'`, completed-first for `'completed-first'`. The original `tasks` array MUST NOT be mutated.
  - [x] 6.11 Implement `setSortOrder(order)`: set `sortOrder`; call `_persist()` and `_renderAll()`.
  - [x] 6.12 Implement `_persist()`: call `StorageService.write(KEY_TASKS, tasks)` and `StorageService.write(KEY_SORT_ORDER, sortOrder)`; if either returns `false`, call `NotificationService.show(...)`.
  - [x] 6.13 Implement `_renderTask(task)`: create an `<li data-id="{task.id}">` containing a checkbox (or toggle button), a `<span>` with the task text (with `class="completed"` if done), an Edit button, and a Delete button. Return the element.
  - [x] 6.14 Implement `_renderAll()`: clear `#task-list` innerHTML; call `_getDisplayList()` and for each task call `_renderTask(task)` and append to the list. Use event delegation on `#task-list` for all clicks.
  - [x] 6.15 Implement `init()`: load `tasks` from `StorageService.read(KEY_TASKS)` (default `[]` on null); load `sortOrder` from `StorageService.read(KEY_SORT_ORDER)` (default `'none'` on null); attach form submit listener and sort-order change listener; call `_renderAll()`.
  - **References:** Requirement 5.1–5.9, 6.1–6.5; Design Properties 10, 11, 12, 13, 14, 15, 16, 17, 18, 19

- [ ] 7. QuickLinksWidget
  - [ ] 7.1 Add the quick-links section HTML to `index.html`: a `<section id="quicklinks-widget">` containing `<form id="quicklink-form">` with `<input id="link-label-input">`, `<input id="link-url-input">`, an Add Link button, `<span id="link-label-error">`, `<span id="link-url-error">`, `<p id="link-limit-msg">` (hidden), and `<div id="links-panel">`.
  - [x] 7.2 In `js/app.js`, define the `QuickLinksWidget` object with methods: `init()`, `addLink(label, url)`, `deleteLink(id)`, `_validateUrl(url)`, `_validateLabel(label)`, `_persist()`, `_renderAll()`, and `_renderLink(link)`.
  - [x] 7.3 Define module-level `links = []` inside the QuickLinksWidget closure.
  - [x] 7.4 Implement `_validateUrl(url)`: use `new URL(raw.trim())` inside a try/catch; return `true` only if `u.protocol === 'http:' || u.protocol === 'https:'` and `u.host.length > 0`, otherwise `false`.
  - [x] 7.5 Implement `_validateLabel(label)`: return `true` if `label.trim().length > 0`, otherwise `false`.
  - [x] 7.6 Implement `addLink(label, url)`: validate both fields, populating `#link-label-error` and `#link-url-error` as needed; if both valid AND `links.length < 50`, create a `QuickLink` object `{ id: generateId(), label: label.trim(), url: url.trim(), createdAt: Date.now() }`, push to `links`, call `_persist()` and `_renderAll()`; if `links.length >= 50`, show `#link-limit-msg` and return without adding.
  - [x] 7.7 Implement `deleteLink(id)`: filter `links` to remove the matching entry; call `_persist()` and `_renderAll()`.
  - [x] 7.8 Implement `_persist()`: call `StorageService.write(KEY_QUICKLINKS, links)`; if it returns `false`, call `NotificationService.show(...)`.
  - [x] 7.9 Implement `_renderLink(link)`: create a card element with an `<a href="{link.url}" target="_blank" rel="noopener noreferrer">` labeled with `link.label`, and a delete button. Return the element.
  - [x] 7.10 Implement `_renderAll()`: clear `#links-panel`; for each link in `links` call `_renderLink(link)` and append; show or hide `#link-limit-msg` based on `links.length >= 50`.
  - [x] 7.11 Implement `init()`: load `links` from `StorageService.read(KEY_QUICKLINKS)` (default `[]`); attach form submit listener; call `_renderAll()`.
  - **References:** Requirement 7.1–7.8; Design Properties 20, 21, 22, 23

- [x] 8. NotificationService
  - [x] 8.1 In `js/app.js`, define the `NotificationService` object with methods `show(message, type)` and `dismiss(id)`.
  - [x] 8.2 Implement `show(message, type)`: generate a unique notification id; create a `<div role="alert" class="notification notification--{type}">` with the message text and a close button; append it to a `#notifications-container` div (create the container if absent); store a `setTimeout` for 4000 ms that calls `dismiss(id)`; return the id.
  - [x] 8.3 Implement `dismiss(id)`: find the notification element by its data-id, remove it from the DOM, and clear the timeout if it hasn't fired yet.
  - [x] 8.4 Add the `#notifications-container` to `index.html` as a `<div id="notifications-container" aria-live="polite">` near the top of `<body>`.
  - [x] 8.5 Add CSS for `.notification`, `.notification--error`, `.notification--info`, `.notification--validation` in `css/style.css`: position fixed (top-right), appropriate background colors per type, a dismiss button, and a fade-in/out animation.
  - **References:** Requirement 9.5, 7.8, 8.7; Design — Error Handling section

- [ ] 9. Data Persistence and localStorage Integration
  - [x] 9.1 Verify that every widget calls `StorageService.write(...)` within its mutation methods (`addTask`, `deleteTask`, `toggleTask`, `saveEdit`, `setSortOrder`, `addLink`, `deleteLink`, `applyDuration`, `setName`, `apply` in ThemeManager). Add any missing write calls found during review.
  - [ ] 9.2 Verify that every widget's `init()` calls `StorageService.read(...)` before rendering, and that a `null` return from `read()` causes the widget to initialize with its documented default state (empty array, `'none'` sort, 25 min timer, no name, light/OS theme).
  - [ ] 9.3 Add the `generateId()` helper before any widget that uses it: `const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);` and use `generateId()` in all widget id generation calls.
  - [ ] 9.4 Implement the `init()` bootstrap function at the bottom of `js/app.js`: attach a `DOMContentLoaded` listener that calls `ThemeManager.init()`, then `NotificationService` setup, then `GreetingWidget.init()`, `TimerWidget.init()`, `TodoWidget.init()`, `QuickLinksWidget.init()` in that order.
  - [ ] 9.5 Verify the 100 ms persistence requirement: ensure all `StorageService.write` calls are synchronous (they are, since `localStorage.setItem` is synchronous) and document this in a comment near the `write` method.
  - **References:** Requirement 9.1–9.5; Design — Data Flow, StorageService sections

- [ ] 10. Responsive Layout and Accessibility
  - [ ] 10.1 In `css/style.css`, implement a CSS Grid or Flexbox layout for the four widget sections: on viewports ≥ 768 px use a two-column grid; on viewports ≤ 767 px stack widgets in a single column. Verify no horizontal scrolling at 320 px width.
  - [ ] 10.2 Add CSS media queries to ensure the layout adapts from 320 px to 2560 px: `@media (max-width: 767px)` for mobile and `@media (min-width: 1440px)` for large screens.
  - [ ] 10.3 Audit all interactive elements in `index.html` (buttons, inputs, links, toggles) and ensure each has an `aria-label` or associated `<label>`. Add missing labels.
  - [ ] 10.4 Ensure all interactive elements have a minimum CSS touch target size of 44 × 44 px via `min-width: 44px; min-height: 44px` on buttons and links.
  - [ ] 10.5 Ensure `body` has `font-size: 16px` and that no element in `css/style.css` sets `font-size` below `14px`.
  - [ ] 10.6 Add `:focus-visible` styles to all interactive elements for keyboard navigation accessibility.
  - [ ] 10.7 Add `<meta name="description">` to `index.html`. Ensure `<html lang="en">` is set. Add `role="region"` with `aria-labelledby` to each widget `<section>`.
  - [ ] 10.8 Open `index.html` directly in a browser (no server required) and verify all four widgets render, the clock ticks, and no console errors appear.
  - **References:** Requirement 10.4–10.7
  - [ ] 12.8 Run the full test suite with `npm test` and verify all tests pass. Fix any test failures caused by implementation bugs (not by incorrect test logic).
  - **References:** Requirement 9.1–9.5, 10.1–10.7; Design — Unit Test Focus Areas, Integration Test Focus Areas

## Notes

- All tasks reference the spec files at `.kiro/specs/todo-life-dashboard/requirements.md` and `.kiro/specs/todo-life-dashboard/design.md`.
- Tasks within Wave 3 (Tasks 3–8) are independent of each other and can be implemented in any order, but all depend on StorageService (Task 2) being complete first.
- Property-based tests (Task 11) require that pure functions (`_formatTime`, `_formatDate`, `_getGreeting`, `_validateDuration`, `_validateUrl`, `_validateLabel`, `_getDisplayList`) are exported or otherwise accessible from `js/app.js` for testing. Consider a conditional export pattern: `if (typeof module !== 'undefined') module.exports = { ... }`.
- The project must remain functional by simply opening `index.html` in a browser — the `package.json` and `jest` setup are for testing only and do not affect the production runtime.
- Each property-based test MUST include a comment referencing its design property number (e.g., `// Feature: todo-life-dashboard, Property 3: Greeting matches the correct hour partition`) and use `numRuns: 100` minimum.
