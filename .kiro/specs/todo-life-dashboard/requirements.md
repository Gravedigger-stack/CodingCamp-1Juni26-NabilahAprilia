# Requirements Document

## Introduction

The To-Do List Life Dashboard is a browser-based personal productivity homepage built with HTML, CSS, and Vanilla JavaScript. It requires no backend and stores all data in the browser's Local Storage. The dashboard combines four core widgets — a greeting with live clock, a customizable focus (Pomodoro) timer, a to-do list, and a quick-links panel — plus three challenge features: Light/Dark mode, a custom user name in the greeting, and an adjustable Pomodoro duration.

## Glossary

- **Dashboard**: The single HTML page that hosts all widgets.
- **Widget**: A self-contained UI component (Greeting, Timer, To-Do List, Quick Links).
- **Local_Storage**: The browser's `localStorage` API used for all client-side persistence.
- **Task**: A user-defined to-do item with a text description and a completion status.
- **Quick_Link**: A user-defined shortcut consisting of a label and a URL.
- **Pomodoro_Timer**: A countdown timer set to a user-configurable duration (default 25 minutes).
- **Theme**: The visual color scheme of the Dashboard — either Light or Dark.
- **User_Name**: A display name entered by the user that appears in the greeting.

---

## Requirements

### Requirement 1: Live Greeting and Clock

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the dashboard, so that I always know what day and time it is at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display the current time in HH:MM:SS format (zero-padded), updated every second (within ±500 ms tolerance), using the user's local timezone.
2. THE Dashboard SHALL display the current full date in the format "DayName, D Month YYYY" (e.g., "Monday, 2 June 2025"), derived from the user's local timezone.
3. IF the current local hour is between 05 and 11 (inclusive), THEN THE Dashboard SHALL display the greeting "Good Morning".
4. IF the current local hour is between 12 and 17 (inclusive), THEN THE Dashboard SHALL display the greeting "Good Afternoon".
5. IF the current local hour is between 18 and 20 (inclusive), THEN THE Dashboard SHALL display the greeting "Good Evening".
6. IF the current local hour is 21 or greater, OR 0 through 4 (inclusive), THEN THE Dashboard SHALL display the greeting "Good Night".
7. IF the system clock is unavailable or returns an invalid value, THEN THE Dashboard SHALL display "--:--:--" for the time and "Unknown date" for the date, and SHALL display no greeting text.

---

### Requirement 2: Custom Name in Greeting (Challenge)

**User Story:** As a user, I want to personalize the dashboard with my name in the greeting, so that the experience feels tailored to me.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input field (maximum 50 characters) for the user to enter a User_Name.
2. WHEN the user submits a non-empty, non-whitespace-only User_Name, THE Dashboard SHALL trim leading/trailing whitespace and append the trimmed value to the greeting (e.g., "Good Morning, Nabilah!").
3. WHEN the user submits a User_Name (including a cleared or whitespace-only value), THE Dashboard SHALL write the trimmed User_Name to Local_Storage immediately after submission.
4. WHEN Local_Storage contains a saved User_Name on page load, THE Dashboard SHALL display the greeting with that User_Name immediately without requiring re-entry.
5. WHEN the user submits an empty or whitespace-only User_Name, THE Dashboard SHALL display the greeting without a name suffix and remove any previously stored User_Name from Local_Storage.
6. IF the user attempts to enter more than 50 characters in the name input, THEN THE Dashboard SHALL prevent input beyond 50 characters and display a validation message indicating the character limit.

---

### Requirement 3: Focus (Pomodoro) Timer

**User Story:** As a user, I want a countdown focus timer so that I can work in structured sessions and stay productive.

#### Acceptance Criteria

1. THE Pomodoro_Timer SHALL default to a 25-minute countdown on initial load when no user-configured duration is stored in Local_Storage.
2. WHEN the user presses Start, THE Pomodoro_Timer SHALL begin counting down in one-second intervals and display the remaining time in MM:SS format (zero-padded).
3. WHEN the user presses Stop, THE Pomodoro_Timer SHALL pause the countdown at the current remaining time and re-enable the Start button so the user can resume from that point.
4. WHEN the user presses Reset, THE Pomodoro_Timer SHALL stop any active countdown and restore the display to the currently configured duration (the user-set duration if one exists, otherwise 25 minutes).
5. WHEN the countdown reaches 00:00, THE Pomodoro_Timer SHALL display a visible on-page completion message (not a blocking browser alert), and the timer SHALL remain at 00:00 until the user presses Reset.
6. WHILE the Pomodoro_Timer is running, THE Pomodoro_Timer SHALL disable the Start button to prevent duplicate intervals.

---

### Requirement 4: Adjustable Pomodoro Duration (Challenge)

**User Story:** As a user, I want to change the focus timer duration, so that I can adapt the session length to my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a numeric input that allows the user to set the Pomodoro_Timer duration in whole minutes (minimum 1, maximum 120).
2. WHEN the user enters a valid whole-minute value (1–120) and presses an explicit "Apply" or "Set" control, THE Pomodoro_Timer SHALL update its configured duration and immediately reset the display to the new duration (stopping any active countdown).
3. THE Dashboard SHALL persist the user-configured duration in Local_Storage so it is restored and applied to the timer display on page reload.
4. IF the user enters a non-integer, a value outside 1–120, or leaves the input empty, THEN THE Dashboard SHALL reject the input, revert the input field to the last valid duration, and display a validation message adjacent to the input.
5. IF the user changes the duration input WHILE the Pomodoro_Timer is running and presses the Apply control, THEN THE Pomodoro_Timer SHALL stop the current countdown and reset to the new duration.

---

### Requirement 5: To-Do List — Core Operations

**User Story:** As a user, I want to add, edit, complete, and delete tasks, so that I can manage what I need to do during the day.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a text input (maximum 250 characters) and an "Add" button for creating a new Task.
2. WHEN the user submits a non-empty, non-whitespace-only Task text, THE Dashboard SHALL trim the text and append the Task to the visible task list.
3. IF the user submits an empty or whitespace-only Task text, THEN THE Dashboard SHALL reject the input and display a validation message, leaving the task list unchanged.
4. WHEN the user clicks the complete toggle on an incomplete Task, THE Dashboard SHALL mark the Task as done, apply a strikethrough style to the task text, and persist the updated completion state to Local_Storage.
5. WHEN the user clicks the complete toggle on an already-completed Task, THE Dashboard SHALL restore the Task to an incomplete state, remove the strikethrough style, and persist the updated state to Local_Storage.
6. WHEN the user clicks the edit action on a Task, THE Dashboard SHALL display an inline editable field pre-filled with the current task text; IF the user saves with a non-empty, modified value, THEN THE Dashboard SHALL update the Task text and persist the change to Local_Storage.
7. IF the user attempts to save an inline edit with an empty or whitespace-only value, THEN THE Dashboard SHALL reject the save and display a validation message, leaving the original task text unchanged.
8. WHEN the user clicks the delete action on a Task, THE Dashboard SHALL remove the Task from the list and from Local_Storage permanently.
9. THE Dashboard SHALL persist all Tasks (text and completion state) in Local_Storage and restore them in their original order on page reload.

---

### Requirement 6: Sort Tasks (Challenge)

**User Story:** As a user, I want to sort my task list, so that I can prioritize and view my tasks in a meaningful order.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a sort control that allows the user to choose a sort order for the task list.
2. WHEN the user selects "Sort by Incomplete First", THE Dashboard SHALL reorder the visible task list so that all incomplete tasks appear before completed tasks, without permanently altering the stored task order.
3. WHEN the user selects "Sort by Completed First", THE Dashboard SHALL reorder the visible task list so that all completed tasks appear before incomplete tasks, without permanently altering the stored task order.
4. WHEN the user adds, edits, or deletes a task while a sort order is active, THE Dashboard SHALL re-apply the current sort order to the updated list immediately.
5. THE Dashboard SHALL persist the user's selected sort order in Local_Storage and restore it on page reload.

---

### Requirement 7: Quick Links

**User Story:** As a user, I want to save and access my favorite websites from the dashboard, so that I can navigate quickly without typing URLs.

#### Acceptance Criteria

1. THE Dashboard SHALL display all saved Quick_Links as clickable buttons or cards on page load.
2. WHEN the user provides a non-empty label and a valid URL and clicks "Add Link", THE Dashboard SHALL save the Quick_Link to Local_Storage and render it in the Quick Links panel within 300 ms.
3. WHEN the user clicks a Quick_Link button, THE Dashboard SHALL open the corresponding URL in a new browser tab.
4. WHEN the user clicks the delete action on a Quick_Link, THE Dashboard SHALL remove it from the visible panel and from Local_Storage immediately.
5. THE Dashboard SHALL persist all Quick_Links in Local_Storage and restore them on page reload.
6. IF the user submits a Quick_Link with an empty label, a whitespace-only label, an empty URL, a whitespace-only URL, or a URL that does not begin with "http://" or "https://" and contain a non-empty host, THEN THE Dashboard SHALL reject the input, display a specific validation message adjacent to the offending field, and clear the message when the user corrects the input.
7. THE Dashboard SHALL support a maximum of 50 saved Quick_Links; IF the user attempts to add a 51st link, THEN THE Dashboard SHALL reject the addition and display a message indicating the limit has been reached.
8. IF Local_Storage is unavailable when saving a Quick_Link, THEN THE Dashboard SHALL display an error message informing the user that the link could not be saved.

---

### Requirement 8: Light / Dark Mode (Challenge)

**User Story:** As a user, I want to toggle between a light and a dark visual theme, so that I can use the dashboard comfortably in any lighting condition.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a visible toggle control that clearly indicates the currently active Theme (e.g., a labeled button or icon-annotated switch showing "Light" or "Dark").
2. WHEN the user activates Dark Theme, THE Dashboard SHALL apply a dark color scheme to the text, backgrounds, borders, and icons of all widgets within 3 seconds; IF the theme assets fail to apply within 3 seconds, THEN THE Dashboard SHALL remain in the current Theme and display an error notification.
3. WHEN the user activates Light Theme, THE Dashboard SHALL apply a light color scheme to the text, backgrounds, borders, and icons of all widgets within 3 seconds; IF the theme assets fail to apply within 3 seconds, THEN THE Dashboard SHALL remain in the current Theme and display an error notification.
4. WHEN the user changes the Theme, THE Dashboard SHALL write the selected Theme to Local_Storage immediately.
5. WHEN the Dashboard loads and Local_Storage contains a saved Theme, THE Dashboard SHALL restore that Theme before rendering any content.
6. WHEN the Dashboard loads for the first time (no Theme stored in Local_Storage), THE Dashboard SHALL check the OS-level color scheme preference (via `prefers-color-scheme`); IF the OS preference is dark, THEN THE Dashboard SHALL default to Dark Theme; OTHERWISE THE Dashboard SHALL default to Light Theme.
7. IF Local_Storage is unavailable when saving the Theme, THE Dashboard SHALL apply the selected Theme for the current session only and display an informational message that the preference could not be persisted.

---

### Requirement 9: Data Persistence

**User Story:** As a user, I want my tasks, links, timer settings, name, and theme preference to survive page refreshes, so that I never lose my data.

#### Acceptance Criteria

1. THE Dashboard SHALL read all persisted data from Local_Storage on every page load before rendering any Widget.
2. WHEN any user action modifies a Task, Quick_Link, User_Name, Theme, or Pomodoro duration, THE Dashboard SHALL write the updated data to Local_Storage within 100 ms of the change.
3. THE Dashboard SHALL store each data category as a valid JSON string under a dedicated Local_Storage key.
4. IF Local_Storage data for a given Widget is missing or cannot be parsed as valid JSON on page load, THEN THE Dashboard SHALL silently discard the corrupt entry and initialize that Widget with its default empty or default state.
5. IF a Local_Storage write operation fails (e.g., storage quota exceeded), THEN THE Dashboard SHALL display a non-blocking error notification informing the user that the change could not be saved.

---

### Requirement 10: Technical Constraints and Non-Functional Requirements

**User Story:** As a developer/maintainer, I want the project to follow a clean and constrained structure, so that the codebase stays simple and maintainable.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented with exactly one main HTML file as the entry point, exactly one CSS file inside `css/`, and exactly one JavaScript file inside `js/`.
2. THE Dashboard SHALL use no JavaScript frameworks, libraries, or package managers; all scripting SHALL be Vanilla JavaScript.
3. THE Dashboard SHALL require no backend server, build step, or compilation to function; opening the HTML file directly in a browser SHALL be sufficient.
4. THE Dashboard SHALL be fully functional (all widgets operational, no console errors) in the latest stable release versions of Chrome, Firefox, Edge, and Safari at the time of deployment.
5. WHEN the page loads on a standard broadband connection (≥ 25 Mbps), THE Dashboard SHALL become fully interactive (all event listeners attached, Local_Storage data rendered) within 2 seconds of the initial navigation.
6. THE Dashboard SHALL apply responsive CSS layout rules so that all widgets are readable and usable on viewport widths from 320 px to 2560 px without horizontal scrolling.
7. THE Dashboard CSS SHALL define a minimum body font size of 16 px and a minimum interactive-element touch target size of 44 × 44 px to maintain readability and accessibility.
