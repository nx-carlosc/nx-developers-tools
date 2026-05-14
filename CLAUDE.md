# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Chrome extension (Manifest V3) for Nexum developers with two tools:

1. **Domain Replacer** — swaps the origin of the current tab's URL with a stored domain. Domains are persisted via `chrome.storage.sync`.
2. **Git Branch Creator** — reads Jira ticket data from the active tab (via a content script) and generates a branch name from a user-defined template. Settings are stored per Jira project via `chrome.storage.sync`.

## Commands

```bash
npm test           # run all tests once
npm run test:watch # run tests in watch mode
```

No build step — the extension is served directly from `/dist`. Upload `/dist` to the Chrome Web Store to release.

## Architecture

All production code lives in `/dist` (no transpile/bundle step):

- [dist/manifest.json](dist/manifest.json) — Manifest V3, requests `tabs`, `storage`, `activeTab` permissions. Injects `jira-script.js` on all URLs.
- [dist/popup.html](dist/popup.html) — single popup page; loads `popup.js` and `branch-creator.js` as ES modules.
- [dist/popup.js](dist/popup.js) — Domain Replacer logic. Reads/writes `chrome.storage.sync` under the key from `consts.js`. Replaces the active tab's origin and opens the new URL in a new tab. Also sets the manifest version label.
- [dist/branch-creator.js](dist/branch-creator.js) — Branch Creator logic. Sends `"send-jira-data"` message to the active tab, receives `{ avatar, project, ticket, title }`, and calls `branchNameCreator`. Saves per-project `{ branchInputValue, charReplacerValue, typeValue }` in `chrome.storage.sync`.
- [dist/jira-script.js](dist/jira-script.js) — Content script. Handles `"send-jira-data"` message with three code paths: Atlassian modal URLs, Atlassian non-modal URLs, and legacy Jira selectors.
- [dist/utils/branchNameCreator.js](dist/utils/branchNameCreator.js) — Pure function that replaces `$0`/`$1`/`$2`/`$3` with type/project/ticket/title, then applies the character replacer. This is the only unit-tested module.
- [dist/consts.js](dist/consts.js) — `BRANCH_REGEXP` (invalid git branch characters), storage key names, `DEFAULT_BRANCH_TYPES`.

Tests in `/tests` use Node's built-in test runner (`node:test`) and import directly from `/dist`.

## Branch name template syntax

The template uses positional placeholders: `$0` = type (user-selected), `$1` = project, `$2` = ticket, `$3` = title. Spaces and characters matching `BRANCH_REGEXP` are replaced with the user-supplied single-character divider. Consecutive divider characters are collapsed to one.

`$0` values come from a `<select>` populated from `DEFAULT_BRANCH_TYPES` (`feat/`, `fix/`, `hotfix/`, `release/`, `chore/`) merged with any custom types saved under `STORED_BRANCH_TYPES` in `chrome.storage.sync`. The slash is part of the type value, so the template uses `$0$2-$3` (not `$0/$2-$3`). Types can be added with the `+` button or removed with the `−` button (disabled when only one type remains). The generated branch name is contenteditable — users can tweak it inline before clicking the copy icon.
