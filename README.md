# nx-developers-tools

![logo](./dist/icon_128.png)

Chrome extension with developer tools for Nexum teams.

## Features

### Domain Replacer
Swap the origin of your current tab with any stored domain — useful for quickly jumping between environments (localhost, staging, production).
- Type or select a stored domain and click **Replace Domain** to open the equivalent URL in a new tab
- Previously used domains are saved and suggested automatically
- Remove saved domains with the trash icon

### Git Branch Creator
Automatically generate a git branch name from the Jira ticket open in your current tab.
- Works on Atlassian Cloud (board view, modal view) and legacy Jira
- Define a branch name template using `$0` (type), `$1` (project), `$2` (ticket), `$3` (title) — e.g. `$0/$2-$3`
- Select the branch type (`feat`, `fix`, `chore`, …) from a dropdown; add or remove custom types, saved across sessions
- Set a single divider character to replace spaces and invalid git characters (e.g. `-`)
- Template, divider and selected type are saved per Jira project
- Edit the generated branch name inline before copying
- Click the copy icon to copy to clipboard

## Installation

Load the `/dist` folder as an unpacked extension in Chrome (`chrome://extensions` → **Load unpacked**).

To publish a new version, upload the `/dist` folder to the Chrome Web Store.

## Development

```bash
npm test           # run tests once
npm run test:watch # run tests in watch mode
```

No build step — all production code is in `/dist` and served directly to Chrome.
