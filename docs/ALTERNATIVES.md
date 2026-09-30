# Related tools and positioning

Reviewed 2026-09-30. This is a scoped comparison of documented project goals, not a comprehensive market survey or claim of algorithmic novelty.

- [ics-suite](https://github.com/asouqi/ics-suite) includes semantic calendar diff functionality. Semantic ICS comparison already exists; AgendaDiff does not claim to invent it.
- [ics-tools](https://github.com/martinp26/ics-tools) provides tools for working with and normalizing ICS data. Normalization is often the better solution when stable text diffs are the primary goal.
- [CalendarDIFF](https://github.com/lishehao/CalendarDIFF) provides an ongoing backend-assisted deadline workflow with calendar ingestion and review. AgendaDiff targets a much smaller two-file, one-session diagnostic task.
- [FileDiffs ICS Compare](https://filediffs.com/ics-compare) is an existing browser-based comparison option. Its current page could not be retrieved during this build, so no current feature, pricing or privacy claim is made here.

AgendaDiff's intended combination is a small inspectable codebase, a shared browser/CLI result format, free local report exports, exact recurrence identity preservation, and conservative uncertainty when timezone or unsupported material cannot be interpreted. Local processing alone is not novel. Its limited timezone scope is a tradeoff, not a superiority claim. Use a full calendaring engine when you need occurrence expansion, invitations, synchronization or timezone-correct scheduling.

Name availability was not legally cleared. A repository name being available is not trademark or npm package-name clearance.
