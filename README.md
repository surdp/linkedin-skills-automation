# LinkedIn Skills Automation with Playwright

> A personal browser-automation prototype built with Node.js and
> Playwright to inspect LinkedIn profile skills, discover available
> skill-picker options, and assist with carefully selected changes.

**Status:** Prototype completed for a personal skills-cleanup workflow.\
**Last observed result:** The read-only final scan reported **60
skills** and made no changes.\
**Future direction:** Build a safer local web app with a
preview-and-confirm workflow.

## Contents

1.  [Overview](#overview)
2.  [Why I built this](#why-i-built-this)
3.  [What it does](#what-it-does)
4.  [Results and learnings](#results-and-learnings)
5.  [Technology stack](#technology-stack)
6.  [How it works](#how-it-works)
7.  [Example code patterns](#example-code-patterns)
8.  [Script inventory](#script-inventory)
9.  [Setup and usage](#setup-and-usage)
10. [Safety and privacy](#safety-and-privacy)
11. [Limitations](#limitations)
12. [Future website roadmap](#future-website-roadmap)
13. [Proposed repository structure](#proposed-repository-structure)
14. [Disclaimer](#disclaimer)

## Overview

LinkedIn skills can become disorganized as responsibilities and career
goals change. This project explores how browser automation can make
skills inspection and selected maintenance more systematic, repeatable,
and verifiable.

The prototype uses Playwright to connect to a separately launched Chrome
session using Chrome DevTools Protocol (CDP). The user signs in manually
in their own browser session; scripts do not need a LinkedIn password.

The project was developed as a practical learning exercise in browser
automation, DOM inspection, accessible selectors, asynchronous UI waits,
dialog handling, bounded retries, and post-action verification.

## Why I built this

The goal was to clean up a LinkedIn Skills section so it better
reflected career directions such as:

-   Healthcare IT and electronic health records
-   Business Analysis and requirements management
-   Product Management, backlogs, and user stories
-   Software QA and test automation
-   APIs, SQL, DevOps, and cloud-related skills

Manually opening edit dialogs, searching, waiting for suggestions,
saving, confirming removals, and verifying the results is repetitive.
This project tests whether parts of that workflow can be automated while
keeping the user in control.

**Guiding principle:** A skill should only be listed if the profile
owner can honestly explain their experience or knowledge. Popular
keywords alone are not a reason to add a skill.

## What it does

The scripts developed during this project cover these stages:

1.  **Inspect and diagnose** page elements and controls.
2.  **Scan** the current skills inventory and print the results.
3.  **Discover** which options appear in LinkedIn's skill picker for a
    search.
4.  **Add selected skills** from a predefined target list.
5.  **Remove selected skills** from a predefined cleanup list, including
    confirmation dialogs.
6.  **Retry and verify** operations affected by UI timing or selector
    issues, then run a read-only scan.

Not all scripts are meant to be run together. Several are historical
development and retry versions. Review each script before execution,
especially if it can change profile data.

### Final observed result

The command `node final-scan.js` reported:

``` text
CURRENT SKILLS: 60
SCAN COMPLETE - NO CHANGES MADE
```

This records the state observed by the scan at that time. It is not a
target count or a guarantee about future LinkedIn UI behavior.

## Results and learnings

### Practical outcomes

-   Built a repeatable, read-only inventory of the profile's skills.
-   Connected Playwright to a separate Chrome session through CDP.
-   Learned that skill suggestions can load asynchronously and need a
    bounded wait.
-   Learned to scope actions to the correct dialog when multiple buttons
    have similar names.
-   Used a final scan to verify the visible result instead of assuming
    that a click succeeded.
-   Kept discovery and final-scan workflows separate from scripts that
    modify the profile.
-   Developed a roadmap for turning command-line scripts into a safer
    web application.

### Skills demonstrated

JavaScript, Node.js, Playwright, DOM inspection, selector design,
asynchronous waits, debugging, bounded automation, verification, and
Markdown/Mermaid documentation.

## Technology stack

  -----------------------------------------------------------------------
  Technology                          Purpose
  ----------------------------------- -----------------------------------
  Node.js                             Runs JavaScript automation

  Playwright                          Controls and inspects browser UI

  Chrome DevTools Protocol (CDP)      Connects Playwright to an existing
                                      Chrome session

  Google Chrome                       Browser used for the LinkedIn
                                      session

  npm                                 Dependency management

  Markdown and Mermaid                Documentation and flowcharts
  -----------------------------------------------------------------------

Check `package.json` and `package-lock.json` for the exact dependency
versions.

## How it works

1.  Launch Chrome with remote debugging enabled and a dedicated
    user-data directory.
2.  Sign in to LinkedIn manually in that Chrome window.
3.  Run a Node.js script from the project folder.
4.  Playwright connects to the existing browser over CDP.
5.  The script locates page elements such as skill rows, edit links,
    inputs, suggestion options, and dialog buttons.
6.  Depending on the script, it either reads information or performs a
    selected UI action.
7.  Bounded waits allow dynamic suggestions and dialogs time to appear.
8.  Run the read-only final scan to check the visible skills inventory.

### Workflow flowchart

``` mermaid
flowchart TD
    A[Start Chrome with dedicated profile] --> B[Sign in manually]
    B --> C[Run Node.js script]
    C --> D[Connect Playwright over CDP]
    D --> E{Script type}
    E -->|Read-only| F[Scan visible skills]
    E -->|Discovery| G[Search skill picker]
    E -->|Change| H[Perform selected UI action]
    G --> I[Print result]
    F --> I
    H --> J[Save or confirm action]
    J --> K[Run read-only verification]
    K --> I
    I --> L[Review and stop]
```

## Example code patterns

The following are **illustrative examples**, not verbatim excerpts from
the current scripts. They explain the techniques used and should not be
mistaken for production-ready code.

### 1. Connect to a Chrome session

``` js
const { chromium } = require('playwright');

async function connectToChrome() {
  const browser = await chromium.connectOverCDP(
    'http://localhost:9222'
  );

  const context = browser.contexts()[0];
  const page = context.pages()[0];

  return { browser, context, page };
}
```

**Why:** The user signs in manually, so the script can use the existing
session without storing a password in code.

### 2. Wait for dynamic suggestions with a limit

``` js
async function waitForOptions(page, timeoutMs = 8000) {
  const options = page.locator('[role="option"]');
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await options.count() > 0) {
      return await options.allTextContents();
    }
    await page.waitForTimeout(500);
  }

  return [];
}
```

**Why:** Search suggestions may not appear immediately. A maximum wait
and polling interval prevent an endless loop.

### 3. Keep verification read-only

``` js
function printSkills(skills) {
  console.log(`CURRENT SKILLS: ${skills.length}`);
  skills.forEach((skill, index) => {
    console.log(`${index + 1}. ${skill}`);
  });
  console.log('SCAN COMPLETE - NO CHANGES MADE');
}
```

**Why:** A separate verification step makes it easier to check the
current state after a change. Only a genuinely read-only path should
print that final message.

### 4. Scope a confirmation action to its dialog

``` js
const dialog = page.getByRole('dialog');
const confirmButton = dialog.getByRole('button', {
  name: 'Delete',
  exact: true
});

await confirmButton.click();
```

**Why:** A page may contain more than one button with the same label.
Scoping to the active dialog reduces the risk of clicking the wrong one.
Destructive actions should still require a clear target preview and user
confirmation.

## Script inventory

This inventory is based on the filenames and the workflow used during
development. **Open and review each file before publishing** to confirm
its actual behavior.

  -----------------------------------------------------------------------
  File                    Intended purpose        Caution
  ----------------------- ----------------------- -----------------------
  `final-scan.js`         Read-only final skills  Recommended entry point
                          inventory

  `skill-options.js`      Read-only skill-picker  Intended not to modify
                          option discovery        profile

  `scan.js`               Earlier/general         Review before running
                          scanning

  `diagnose-skill.js`     Diagnose skill UI       Output may contain page
                          behavior                details

  `diagnose-delete.js`    Diagnose deletion       Review carefully
                          controls

  `add-skills.js`         Earlier add workflow    Can change profile

  `add-final-skills.js`   Batch add attempt       Can change profile

  `add-final-retry.js`    Retry selected          Can change profile
                          additions

  `cleanup.js`            Earlier cleanup         Can delete skills
                          workflow

  `cleanup-skills.js`     Cleanup workflow        Can delete skills

  `cleanup-all.js`        Broad cleanup attempt   Potentially destructive

  `cleanup_final.js`      Later cleanup version   Can delete skills

  `cleanup-final-6.js`    Later bounded cleanup   Can delete skills
                          attempt

  `cleanup-retry.js`      Earlier deletion retry  Can delete skills

  `cleanup-retry-v2.js`   Revised deletion retry  Can delete skills

  `package.json`          Project metadata and    Review before
                          npm                     publishing
                          scripts/dependencies

  `package-lock.json`     Locked dependency       Normally keep
                          versions

  `node_modules/`         Installed dependencies  Do not commit; recreate
                                                  with `npm install`
  -----------------------------------------------------------------------

### Keep private by default

The following were created during browser/page inspection and may
contain personal or session-specific information. Do not include them in
a public repository unless you inspect and sanitize them first:

-   `linkedin-controls.json`
-   `linkedin-dom-inspection.json`
-   `linkedin-page-diagnostic.json`
-   `linkedin-skills-page.txt`
-   `cleanup-targets-found.json`

## Setup and usage

### Prerequisites

-   Windows
-   Node.js and npm
-   Google Chrome
-   A LinkedIn account you are authorized to manage

### Install dependencies

From the project directory:

``` bat
npm install
```

### Launch a dedicated Chrome session

The development command used was:

``` bat
cmd /c start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\ChromeLinkedInAutomation"
```

Change the Chrome executable path if needed. Sign in manually in that
window.

### Run the read-only scan

``` bat
node final-scan.js
```

### Configure the skills page URL

Set the URL for your own LinkedIn skills page in Command Prompt:

```bat
set "LINKEDIN_SKILLS_URL=https://www.linkedin.com/in/YOUR-PROFILE/details/skills/"
```

Replace `YOUR-PROFILE` with your own LinkedIn profile slug. This setting applies only to the current Command Prompt window. Do not commit your personal profile URL to the repository.

### Run the read-only scan

Start Chrome with remote debugging enabled on port `9222`, sign in manually, and then run:

```bat
node final-scan.js
```

The script reads skill names from the skills page and prints a sorted list. It navigates to the supplied URL and scrolls the page to collect results. It does not intentionally add or delete skills.

### Scope

This public version contains the read-only skills scanner. Experimental scripts that add, delete, or modify profile skills are not included in the recommended public setup.

## Safety and privacy

-   Never hard-code passwords, cookies, access tokens, or session data.
-   Keep the CDP debugging port local; do not expose port `9222` to the
    public internet.
-   Use automation only on an account you are authorized to manage.
-   Preview exact targets before destructive actions.
-   Use bounded waits and finite retry counts.
-   Verify outcomes; a click does not prove a save succeeded.
-   Inspect diagnostic dumps for personal data before sharing them.
-   Do not commit `node_modules/`.
-   Generalize personal profile URLs and account-specific data in
    examples.
-   Review LinkedIn's current terms and applicable rules before using or
    extending browser automation.

## Limitations

-   LinkedIn may change its DOM, selectors, dialogs, and skill
    suggestions.
-   Available options can vary by account, locale, and UI version.
-   A suggestion missing within the timeout is not proof it can never be
    added.
-   Lazy loading may affect the number of skills visible to a scan.
-   The current prototype is a set of local scripts, not a standalone
    web application.
-   It does not guarantee that every possible UI state is handled.
-   The final count of 60 reflects one observed scan, not a required
    target.

## Future website roadmap

The next step could be a local website that gives users a safer, clearer
interface than running scripts manually.

### Proposed user journey

``` mermaid
flowchart TD
    A[Open local web app] --> B[Check browser connection]
    B --> C[Read current skills]
    C --> D[Search and filter inventory]
    D --> E[Select proposed changes]
    E --> F[Preview before and after]
    F --> G{User confirms?}
    G -->|No| H[Cancel with no changes]
    G -->|Yes| I[Run bounded browser actions]
    I --> J[Re-scan skills]
    J --> K[Show successful, skipped, and failed actions]
```

### Proposed architecture

``` mermaid
flowchart LR
    A[Web UI] --> B[Local controller/API]
    B --> C[Validation and preview]
    C --> D[Playwright worker]
    D --> E[User-controlled Chrome]
    E --> F[LinkedIn UI]
    D --> G[Action log and verification]
    G --> A
```

### Suggested development phases

**Phase 1 --- Read-only dashboard** - Show current skills and total
count. - Search and filter the list. - Export a sanitized inventory. -
Clearly label read-only operations.

**Phase 2 --- Change planning** - Select skills to add or remove. -
Preview all proposed changes. - Require explicit confirmation. - Detect
duplicates and skip ambiguous matches.

**Phase 3 --- Execution and verification** - Add finite timeouts and
retry limits. - Log attempted actions and outcomes. - Re-scan after
changes. - Report successes, skips, and failures clearly.

**Phase 4 --- Portfolio-ready application** - Build a responsive UI with
a suitable frontend framework. - Keep browser automation in a local
backend or controlled worker. - Add tests for parsing, selection, and
validation logic. - Provide a mock-data demo so visitors can explore the
interface without connecting LinkedIn.

### Proposed future folder layout

``` text
linkedin-skills-automation/
â”œâ”€â”€ README.md
â”œâ”€â”€ package.json
â”œâ”€â”€ package-lock.json
â”œâ”€â”€ .gitignore
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ browser/
â”‚   â”‚   â””â”€â”€ connect.js
â”‚   â”œâ”€â”€ skills/
â”‚   â”‚   â”œâ”€â”€ scan.js
â”‚   â”‚   â”œâ”€â”€ discover-options.js
â”‚   â”‚   â””â”€â”€ apply-changes.js
â”‚   â””â”€â”€ utils/
â”‚       â””â”€â”€ waits.js
â”œâ”€â”€ tests/
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ workflow.md
â”‚   â””â”€â”€ screenshots/
â””â”€â”€ examples/
    â””â”€â”€ mock-skills.json
```

This is a proposed future layout, not the current folder structure. Keep
existing scripts in place until they have been reviewed and safely
refactored.

## Disclaimer

This is an independent learning and portfolio project. It is not
affiliated with, sponsored by, or endorsed by LinkedIn. Use responsibly,
protect your account, and verify every profile change.

## Project summary

This prototype demonstrates how a repetitive profile-maintenance task
can be approached using browser automation, bounded waits, precise
selectors, and read-only verification. The next steps are to review and
sanitize the scripts, publish the safe files, and gradually evolve the
workflow into a safer local web application.
