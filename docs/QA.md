# Verification record

Release: 0.1.0. Local verification on 2026-09-30, Linux, Node.js 24.19.0.

- TypeScript check: passed
- Automated suite: 39 tests passed, including core semantics, browser DOM interactions, asynchronous file loading and CLI behavior
- Build: shared bundled core, CLI, TypeScript declarations and self-contained browser HTML passed
- Packed package: installed in a fresh temporary project, CLI version and comparison exercised, package import and declaration/source-license inclusion checked
- Production dependency audit: 0 known vulnerabilities at verification time
- Synthetic capacity probe: two 3,000-event exports (441,870 input bytes in total), 3,000 unchanged, complete within supported scope, approximately 487 ms in this one local run

This benchmark is an observation, not a performance guarantee. No recurrence expansion occurs. Input sizes and material complexity affect runtime.

## Regression coverage

Property/event order and folds; TEXT escapes and Unicode; missing/duplicate UID; master/override separation; typed recurrence identities; explicit cancellation versus export absence; unchanged cancellation; all-day exclusive ends; floating and UTC duration normalization; known and unknown TZID and embedded timezone uncertainty; recurrence rule ordering, raw syntax and ranges; multiple recurrence date properties; unsupported material and parameters; invalid dates/statuses/endpoints; byte/line/event/depth limits; deterministic reports; source escaping; filtering; stale-export disabling; file-loading races; safe output creation; timezone-independent CLI output.

## Honest verification limits

Browser behavior was exercised with jsdom, including the built standalone HTML. Real-browser visual QA, native file chooser interaction, mobile touch, screen-reader interaction and actual browser downloads were not exercised. Responsive CSS and accessibility labels are implemented but those manual surfaces remain unverified. This is not a formal RFC conformance or security audit.

The GitHub workflow configures Ubuntu/Windows × Node 22/24. The authoritative execution status is the repository's Actions page for the exact published commit; configuration alone is not a pass claim.
