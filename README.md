# AgendaDiff

**Compare two calendar exports without confusing missing records with cancellations.**

A small, inspectable iCalendar comparison tool for calendar-integration developers, timetable maintainers and migration reviews. Runs in a local browser or a Node.js CLI, with the same TypeScript comparison core.

[中文说明](README.zh-CN.md) · [Semantics](docs/SEMANTICS.md) · [Security](SECURITY.md) · [Alternatives](docs/ALTERNATIVES.md)

## Try it

Open `dist/AgendaDiff-Offline.html` directly in a modern browser. No server, account, installation or network connection is required. A synthetic example is loaded immediately. Replace either side with local UTF-8 `.ics` files or pasted text, then choose **Compare calendars**.

The UI includes change filters, title/UID search, metadata inspection, raw source evidence, and free local JSON/HTML downloads. Reports contain calendar data; review them before sharing. “Local processing” describes this application's handling of your file contents; a hosting provider can still receive ordinary page-access information.

## Quick start from source

Node.js **22 or newer**:

```sh
npm ci
npm run verify
node dist/cli.js fixtures/before.ics fixtures/after.ics
```

The sample comparison exits **1** because it contains real differences. This is expected.

```sh
node dist/cli.js before.ics after.ics --format html --output report.html
node dist/cli.js before.ics after.ics --output report.json
```

Output files are created exclusively; existing files and input files are never overwritten. Use a new filename for each report. Paths beginning with `-` can be passed with a `./` prefix.

### Local package, without publishing

```sh
npm pack
npm install --global ./agendadiff-0.1.0.tgz
agendadiff before.ics after.ics
```

There is no claimed npm registry release. `private: true` protects against accidental publication. The archive bundles the CLI and core; package installation may still resolve its declared ICAL.js dependency. The standalone offline HTML needs no installation.

### Shared core

```js
import { compareCalendars, reportToHtml, LIMITS } from './dist/core/index.js';
const report = compareCalendars(beforeIcs, afterIcs);
console.log(report.schemaVersion, report.complete, report.summary);
```

An installed local package also exposes these functions with TypeScript declarations. Input errors become report diagnostics. CLI I/O and usage errors go to stderr.

## What makes it useful

- Matches exact `UID` and typed `RECURRENCE-ID`; never guesses by title
- Keeps recurrence masters and explicit exceptions separate
- Retains every duplicate-ID record and reports a conflict
- Distinguishes added, removed-from-export, modified, explicit cancellation, unchanged, indeterminate and conflict
- Compares titles, locations, descriptions, schedule endpoints, status, recurrence rules/dates and selected properties
- Ignores timestamp/sequence churn for classification while keeping evidence available
- Leaves all-day dates and floating times in their original modes
- Makes uncertainty visible instead of claiming unsupported data is equivalent

This is a diagnostic comparison, not an iTIP scheduling client, complete RFC validator, calendar backup service or recurrence engine. It does not modify calendars, monitor accounts, send notifications or authenticate to calendar services.

## Important limits

**All TZID values are unresolved in v0.1.0**, including familiar IANA names. Embedded VTIMEZONE definitions remain visible but are not evaluated. An affected record is indeterminate. A UTC timestamp is compared as UTC; no machine-local timezone conversion occurs.

**No recurrence expansion.** RRULE, RDATE, EXDATE and explicit exceptions are inspected, but generated instances, cancellations' application to recipients, and total affected occurrence counts are not inferred. Calendar export windows cannot be proven equal.

**Unsupported material stays visible.** Attendees, organizers, alarms, attachments, unknown extensions and non-VEVENT components prevent a complete verdict. The report shows their source. A modified event can be classified indeterminate when any material part cannot be interpreted.

See [the exact support matrix and limits](docs/SEMANTICS.md).

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Supported fields are equal; metadata or representation changes may still be present |
| 1 | At least one supported event-level difference; report is complete within scope |
| 2 | Invalid input, uncertainty, conflict or unsupported material; inspect diagnostics |
| 3 | Command usage, file read/write, UTF-8 decoding or resource I/O error |

## Development

```sh
npm test
npm run check
npm run build
npm run verify:package
npm audit --omit=dev
```

Tests cover ordering/folding, escapes/Unicode, identity collisions, cancellation vs absence, recurrence definitions, date/time modes, duration equivalence, malformed/bounded input, HTML safety, browser interactions, async file loading, CLI parity and packed installation. CI runs on Linux/Windows with Node 22/24. See [QA notes](docs/QA.md) for actual verification and untested surfaces.

## License

AgendaDiff code is MIT licensed. The bundled unmodified **ICAL.js 2.2.1** parser is **MPL-2.0**, with its corresponding source and license in `vendor/ical.js`. This dependency does not become MIT licensed. See [third-party notices](THIRD_PARTY_NOTICES.md). The name is a project name, not a trademark or package-name clearance claim.
