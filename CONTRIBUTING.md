# Contributing

Use Node.js 22 or newer. Run `npm ci`, then `npm run verify` and `npm run verify:package` before submitting changes. Include synthetic fixtures and a regression test that fails before the fix. Do not include personal calendar exports, tokens or private paths.

Keep parsing, semantic normalization, reporting and UI separate. Changes to supported semantics should update docs/SEMANTICS.md and the report schema/version contract. Never silently coerce unknown timezones, collapse ambiguous identities, treat missing exports as cancellations or declare unsupported material equivalent. Recurrence expansion is outside v0.1.0 scope.

Report test command results and environments actually checked. DOM tests are not visual-browser tests, and configured CI jobs are not evidence of a successful run. Cross-platform filesystem tests must avoid platform-specific shell syntax.

Original contributions use the MIT license. Unmodified ICAL.js source remains MPL-2.0; preserve its license and corresponding source notices. Do not edit generated dist files directly; rebuild from src/web.
