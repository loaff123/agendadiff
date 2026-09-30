# Semantics and scope

## Identity

A record is one explicit VEVENT. Its key is the JSON tuple `['event', exact UID, typed recurrence identity or null]`. The recurrence identity retains value type, date/time mode, exact canonical value and TZID. RANGE is a semantic property, not part of the match key. DATE, floating DATE-TIME, UTC DATE-TIME and TZID DATE-TIME are never silently collapsed. A timezone representation change can appear as removed + added exceptions because equivalence is unproven. Missing UIDs get side-local keys and remain unmatched. Duplicate keys produce one conflict containing all records. No title matching or sequence-based winner selection occurs.

## Classification precedence

1. Duplicate exact keys on either side: conflict
2. Missing identity, parse/validation issue, unresolved timezone, unsupported event material or unsupported calendar context: indeterminate
3. New or changed explicit cancellation signal: cancelled
4. Only after: added; only before: removed
5. Supported semantic field changed: modified
6. Otherwise: unchanged (metadata and representation differences can still be inspected)

`complete` means the supported comparison had no unresolved material, invalid input, identity conflict or calendar-level issue. It is not a complete RFC-conformance certification or a statement about every real calendar occurrence. No generated wall-clock timestamp is added to reports. Same input yields deterministic serialized output. Evidence retains original metadata and source order, so whole reports are not expected to be byte-identical for differently ordered input files.

## Supported fields

| Field | Handling |
|---|---|
| UID | Exact text identity; no case folding |
| RECURRENCE-ID | Typed/mode-preserving identity plus parameter evidence, including RANGE |
| SUMMARY, LOCATION, DESCRIPTION | Parsed escaped TEXT with parameter comparison |
| DTSTART, DTEND, DURATION | Validated Gregorian date/time; normalized endpoints for DATE, UTC and floating values |
| STATUS | TENTATIVE, CONFIRMED, CANCELLED; case-normalized |
| RRULE | Canonical key/list order; bounded syntax/range and key combination checks; no recurrence expansion or recurrence-set equivalence |
| RDATE, EXDATE | Sorted unique values grouped by type and parameters; PERIOD retained as unsupported |
| CATEGORIES | Sorted set of parsed text values and parameters |
| CLASS, TRANSP, URL | Parsed values/parameters; CLASS/TRANSP case-normalized; URLs are not visited |
| DTSTAMP, LAST-MODIFIED, SEQUENCE, CREATED | Retained metadata; do not change event classification |
| Other properties / nested components | Raw parsed evidence plus uncertainty; includes attendee, organizer, alarm, attachment and extensions |
| Calendar properties / components | VERSION, PRODID, METHOD, CALSCALE inspected; other material retained with uncertainty |
| VTIMEZONE | Preserved, bounded and definition changes flagged; no offset or DST evaluation |

Equivalent RRULE expressions beyond order normalization are not proven equal. Missing vs explicit default rule parts can be reported as changes. Multiple compatible RDATE/EXDATE lines are combined as sets. Other multi-valued collections preserve multiplicity conservatively. This can produce reviewable differences for redundant data, rather than hide a change.

## Dates and duration

DATE is a calendar date with no timezone. DTEND for a DATE is exclusive. Missing end/duration implies one day for DATE and zero duration for DATE-TIME. Explicit DTEND must be later than DTSTART. DURATION and DTEND cannot coexist. DATE duration must use days/weeks. UTC and floating duration endpoints are calculated in their own time frame; floating values are never converted through the host timezone. Years 0001–9999 are supported. Leap seconds are conservatively marked invalid/unsupported.

All TZID usage is unresolved, even if the label looks familiar. No Intl timezone database, network timezone lookup or VTIMEZONE expansion is used. Equal local strings with TZID do not prove equal instants. Differing time modes or start/end TZIDs make an endpoint comparison uncertain. A representation-only normalized endpoint change is inspectable separately from semantic changes.

## Cancellation

STATUS:CANCELLED is an explicit property in the after record. METHOD:CANCEL is a calendar-level cancellation instruction, including for matching identities; it is not evidence the scheduling recipient applied it. Already-cancelled equal records are unchanged. Other scheduling methods are unsupported and mark context indeterminate. Recurrence cancellation scope is shown as source/rule evidence; no recurring instances are generated. A missing record means only “not in this export.”

## Input guards (per input)

| Limit | Value |
|---|---:|
| UTF-8 bytes | 2,097,152 (2 MiB) |
| Physical lines | 120,000 |
| Physical or unfolded line characters | 32,768 |
| Explicit VEVENT records | 3,000 |
| Properties | 60,000 |
| Component nesting depth | 8 |
| Each VTIMEZONE definition's accumulated UTF-8 bytes | 65,536 |

Exactly one closed VCALENDAR is required. LF and CRLF accepted; orphan folds, NUL, bare CR, mismatched component boundaries, content outside root and nested VEVENT are rejected. No recurrence expansion is performed, regardless of COUNT. The browser runs synchronously within these finite bounds; very large allowed inputs may briefly occupy the main thread. This is not a real-time latency guarantee. CLI uses a bounded regular-file read and strict UTF-8 decoding; browser files also use strict UTF-8.

## Standards and parser

- [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), especially sections 3.3, 3.6.1, 3.8.2, 3.8.4.4 and 3.8.5
- [RFC 5546](https://www.rfc-editor.org/rfc/rfc5546.html), for scheduling methods and cancellation intent
- [ICAL.js](https://github.com/kewisch/ical.js), syntax parser, pinned at 2.2.1

AgendaDiff adds bounded validation and conservative comparison around the parser. It is not an implementation of the entire iCalendar/iTIP standard suite.
