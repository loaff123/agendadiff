# Security and privacy

Calendar files can contain personal titles, locations, participant addresses, notes and identifiers. JSON/HTML reports intentionally retain source evidence, including unsupported fields. Treat them with the same care as original exports. Sharing the report can share that personal information.

The application has no telemetry, API calls, persistence, cookie use or remote assets. It never opens calendar URLs, executes content, fetches attachments, modifies accounts or writes input files. Hosted page access is still visible to the hosting service. For sensitive data, use the downloaded offline HTML or local CLI in an environment you trust.

All untrusted browser content is inserted as text. HTML reports escape all evidence and contain no scripts. Content Security Policy disallows network connections, external scripts, forms and base URLs. Input limits are enforced before ICAL.js parsing. No recurrence expansion or timezone transition expansion is invoked.

CLI inputs must be regular UTF-8 files; reads are bounded even if a file grows. Output uses exclusive creation, refusing existing paths and input paths. Unix new-output mode is 0600; operating-system policy and Windows ACLs still determine effective protection. Standard output may be redirected by the caller; shell redirection can overwrite files before the application starts, so do not redirect over an input.

This is not a formal security audit. Dependency versions are pinned in the lockfile, and ICAL.js corresponding source is bundled. npm audit is a point-in-time advisory check, not a proof of safety. Bounds mitigate but do not guarantee latency against every adversarial input.

To report a vulnerability, use GitHub's private vulnerability reporting facility if enabled; otherwise contact the repository maintainer through an existing trusted channel. Do not post real calendar contents or exploitable private details in public issues. A minimal synthetic reproduction is preferred.
