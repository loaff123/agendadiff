# Third-party notices

## ICAL.js 2.2.1 — MPL-2.0

Source: https://github.com/kewisch/ical.js
Package: https://www.npmjs.com/package/ical.js

The distributed browser, CLI and core bundles include unmodified ICAL.js. Its original library source, package metadata and full Mozilla Public License 2.0 are included under `vendor/ical.js`. ICAL.js copyright and license notices are retained in those source files. You may obtain and modify that covered source under MPL-2.0. AgendaDiff's MIT license applies to AgendaDiff's own source; it does not relicense ICAL.js.

Build/test tools are pinned in package-lock.json and are not required by the standalone offline app: esbuild (MIT), TypeScript (Apache-2.0), tsx (MIT), jsdom (MIT), and the relevant DefinitelyTyped packages (MIT). Their dependencies retain their own licenses. Consult their installed package notices when redistributing development dependencies; the release ZIP excludes node_modules.
