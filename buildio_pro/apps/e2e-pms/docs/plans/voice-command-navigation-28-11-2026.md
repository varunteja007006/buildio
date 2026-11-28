---
model: gpt-6.2-sol
last-updated: 28-11-2026
user: varunteja
---

# E2E PMS voice command navigation

A demo user can say **“Show completed tasks for Product launch”** from the dashboard and land on `/tasks?project=Product%20launch&status=Done`. The Tasks page shows **Product launch** and **Done** selected, with **Write launch checklist** as the only result. Typing the same command produces the same result. Both filters can still be changed manually, and the resulting URL can be shared or reloaded.

The original discussion established the voice-to-UI goal and prioritized the SQLite scaffold first. The milestones below propose how to build on it. [Voice Commands for Filtered Navigation](t3-thread://v2/def6981b-f33a-47ae-bde0-af4dddcc9668/9d711cd6-0d21-4893-8ead-eb600317bf12)

## Current scaffold

- The dashboard shows project completion counts and links to tasks for each project. [Dashboard source](../../app/page.tsx)
- The Tasks page reads `project` and `status` from the URL, renders the corresponding controls, and queries SQLite. It already handles an empty result. [Tasks page source](../../app/tasks/page.tsx)
- SQLite seeds six read-only tasks across Website refresh, Product launch, and Internal tools. The statuses are Todo, In progress, In review, and Done. [Task store source](../../lib/tasks.ts)

## Milestone 1 — Filtered navigation by voice or text

- [x] Add one command control on the dashboard with a labeled text input, submit button, example command, and **Speak command** button. Text entry works with a keyboard and stays available during microphone errors.
- [x] Add a small rule-based parser for the `showTasks` action. Support `Show tasks`, `Show tasks for <project>`, `Show <status> tasks`, and `Show <status> tasks for <project>`. Match case-insensitively, tolerate extra whitespace and sentence-ending punctuation, and treat `completed` as `Done`. Share the existing project and status values through a module that the browser can import independently of SQLite.
- [x] Validate the action and filter values before navigating. Build the `/tasks` query string from the validated values and omit filters the command leaves unspecified. An unknown project, unknown status, or unsupported request gives the user a short hint and keeps them on the current page.
- [x] Use browser speech recognition when available. Start listening only when the user activates **Speak command**. Show a listening state and process a final transcript through the same path as a typed command. If recognition is unavailable, permission is denied, or speech produces no usable transcript, show a short message and keep text entry usable. [SpeechRecognition browser reference](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)

| Command                                   | Expected result                                            |
| ----------------------------------------- | ---------------------------------------------------------- |
| `Show tasks`                              | All six tasks.                                             |
| `Show tasks for Website refresh`          | The two Website refresh tasks.                             |
| `Show in progress tasks`                  | The two In progress tasks across projects.                 |
| `Show completed tasks for Product launch` | Only Write launch checklist, with both filters selected.   |
| `Show completed tasks for Internal tools` | Both filters selected and the existing empty state.        |
| `Show tasks for Finance`                  | Stay on the current page and show an unknown-project hint. |

## Verification

- [x] Check the parser against the examples above, mixed case, extra whitespace, sentence-ending punctuation, and an unsupported action such as `Delete tasks`.
- [x] Submit the example command by typing and with a mocked speech transcript. Confirm the destination URL, selected filters, and exact SQLite result. Reload the filtered URL and change a filter manually.
- [x] Check keyboard submission and simulate microphone permission denial, unavailable speech recognition, and no speech result. Confirm that typed commands remain usable in each case.
- [x] Run the E2E PMS lint, typecheck, and production build. Exercise the flow with Node.js 22.13+ on port `3026`.
- [ ] Speak the example command into a real microphone in a browser that supports speech recognition.

## Milestone 2 — AI tool calling

Once the first milestone works, evaluate whether a model improves requests outside the supported phrases, such as “What’s already finished on the launch?” The first model integration would expose only `showTasks({ project?, status? })`. Validate its structured result against the same allowed values and use the same navigation path. Choose a model provider at that point and keep credentials server-side.

The scope of this demo is read-only navigation on seeded data.

## What I need from you

Test with your microphone on the dashboard at `http://localhost:3026/`. The AI milestone needs a provider choice and credentials configured in the implementation environment.

## What’s next

Verify that **Speak command** opens the filtered Tasks page after you say “Show completed tasks for Product launch.”
