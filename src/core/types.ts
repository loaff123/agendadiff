export type Classification = 'added' | 'removed' | 'modified' | 'cancelled' | 'unchanged' | 'indeterminate' | 'conflict';
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export interface Issue { code: string; message: string; event?: number; }
export interface Evidence { index: number; uid: string | null; recurrenceId: string | null; title: string; source: string; fields: Record<string, Json>; metadata: Record<string, Json>; issues: Issue[]; }
export interface FieldChange { field: string; before: Json; after: Json; kind: 'semantic' | 'representation' | 'metadata' | 'unsupported'; }
export interface Change { key: string; uid: string | null; recurrenceId: string | null; title: string; classification: Classification; before: Evidence[]; after: Evidence[]; changes: FieldChange[]; notes: string[]; }
export interface CalendarInfo { events: number; method: string | null; issues: Issue[]; metadata: Record<string, Json>; }
export interface Report { schemaVersion: '1.0'; toolVersion: '0.1.0'; before: CalendarInfo; after: CalendarInfo; summary: Record<Classification, number>; changes: Change[]; issues: Issue[]; complete: boolean; notices: string[]; }
