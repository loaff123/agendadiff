import type {CalendarInfo,Change,Classification,Evidence,FieldChange,Json,Report} from './types.js';
import {canonical,LIMITS,parseCalendar,stable} from './parse.js';
export {LIMITS};
export type * from './types.js';
export {reportToHtml} from './report.js';
const classifications:Classification[]=['added','removed','modified','cancelled','unchanged','indeterminate','conflict'];
function differences(a:Record<string,Json>,b:Record<string,Json>,kind:FieldChange['kind']):FieldChange[]{return [...new Set([...Object.keys(a),...Object.keys(b)])].sort().flatMap(field=>stable(a[field]??null)===stable(b[field]??null)?[]:[{field,before:a[field]??null,after:b[field]??null,kind:field==='endpointRepresentation'?'representation':field==='unsupported'||field==='components'?'unsupported':kind}]);}
function groups(records:Evidence[],side:string):Map<string,Evidence[]>{const m=new Map<string,Evidence[]>();for(const r of records){const key=r.uid===null?stable(['missing',side,r.index]):stable(['event',r.uid,r.recurrenceId]);const list=m.get(key)??[];list.push(r);m.set(key,list);}return m;}
function cancelled(r:Evidence|undefined,info:CalendarInfo):boolean{return !!r&&(info.method==='CANCEL'||Array.isArray(r.fields.status)&&r.fields.status.some(v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Array.isArray(v.values)&&v.values.length===1&&v.values[0]==='CANCELLED'));}
export function compareCalendars(beforeText:string,afterText:string):Report {
  const before=parseCalendar(beforeText),after=parseCalendar(afterText),a=groups(before.records,'before'),b=groups(after.records,'after');
  const summary=Object.fromEntries(classifications.map(k=>[k,0])) as Record<Classification,number>;
  const changes:Change[]=[];
  for(const key of [...new Set([...a.keys(),...b.keys()])].sort()){
    const left=a.get(key)??[],right=b.get(key)??[],x=left[0],y=right[0],r=y??x;
    const changeset=x&&y?[...differences(x.fields,y.fields,'semantic'),...differences(x.metadata,y.metadata,'metadata')]:[];
    if(x&&y&&before.info.method!==after.info.method)changeset.push({field:'calendarMethod',before:before.info.method,after:after.info.method,kind:'semantic'});
    const notes:string[]=[];let classification:Classification;
    if(left.length>1||right.length>1){classification='conflict';notes.push('Duplicate UID + RECURRENCE-ID identity. All source records are retained; no winner selected.');}
    else if(!r.uid||[...left,...right].some(e=>e.issues.length)||before.fatal||after.fatal||before.info.issues.length||after.info.issues.length){classification='indeterminate';notes.push('A supported semantic verdict cannot be proven. Inspect issues and raw source.');}
    else if(y&&cancelled(y,after.info)&&(!x||!cancelled(x,before.info)||changeset.some(c=>c.kind==='semantic'))){classification='cancelled';}
    else if(!x)classification='added';else if(!y)classification='removed';else if(changeset.some(c=>c.kind==='semantic'||c.kind==='unsupported'))classification='modified';else classification='unchanged';
    if(!x)notes.push('Present only in the after export; no inference about when the event was created.');
    if(!y)notes.push('Absent from the after export; this is not evidence of cancellation. Export windows and filters may differ.');
    if(after.info.method==='CANCEL'&&y)notes.push('METHOD:CANCEL is a scheduling cancellation instruction, not proof the recipient applied it.');
    if(cancelled(y,after.info)&&after.info.method!=='CANCEL')notes.push('After record explicitly declares STATUS:CANCELLED.');
    if(r.recurrenceId)notes.push('Explicit recurrence exception; identity preserves date/time mode and TZID. No generated occurrences were compared.');
    if(changeset.some(c=>c.field==='rrule'||c.field==='rdate'||c.field==='exdate'))notes.push('Recurrence definition changed. This tool does not expand or count affected occurrences.');
    if(changeset.some(c=>c.kind==='representation'))notes.push('Endpoint representation differs; compare normalized start/end fields for proven schedule changes.');
    if(changeset.some(c=>c.kind==='metadata'))notes.push('Metadata differences are shown separately and do not determine event classification.');
    changes.push({key,uid:r.uid,recurrenceId:r.recurrenceId,title:r.title,classification,before:left,after:right,changes:changeset,notes});summary[classification]++;
  }
  const issues=[...before.info.issues.map(x=>({...x,message:`Before: ${x.message}`})),...after.info.issues.map(x=>({...x,message:`After: ${x.message}`}))];
  if(stable(before.info.metadata.timezones)!==stable(after.info.metadata.timezones))issues.push({code:'timezone-definitions-changed',message:'VTIMEZONE definitions changed; instant impact is not evaluated.'});
  return {schemaVersion:'1.0',toolVersion:'0.1.0',before:before.info,after:after.info,summary,changes,issues,complete:!issues.length&&!summary.indeterminate&&!summary.conflict&&!before.fatal&&!after.fatal,notices:[
    'Removed records mean absent from an export, not cancelled. Check that export windows and filters match.',
    'Exact UID + typed RECURRENCE-ID matching only; titles are never fuzzy-matched. Masters and exceptions are separate.',
    'Recurrence definitions are compared without expanding occurrences. TZID and embedded VTIMEZONE instants are not resolved.',
    'All-day DTEND is exclusive. Floating date-times remain floating, independent of the computer timezone.',
    'DTSTAMP, LAST-MODIFIED, SEQUENCE and CREATED are metadata noise by default; all remain inspectable.',
    'Reports and source evidence may contain personal calendar data. Review before sharing.'
  ]};
}
