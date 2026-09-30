import ICAL from 'ical.js';
import type {CalendarInfo, Evidence, Issue, Json} from './types.js';
export const LIMITS = Object.freeze({bytes:2_097_152, lineLength:32_768, events:3_000, depth:8, lines:120_000, properties:60_000, timezoneBytes:65_536});
type Prop = [string, Record<string, Json>, string, ...Json[]];
type Component = [string, Prop[], Component[]];
export type Parsed = {info:CalendarInfo; records:Evidence[]; fatal:boolean};
const metadataNames=new Set(['dtstamp','last-modified','sequence','created']);
const semanticNames=new Set(['uid','recurrence-id','summary','location','description','dtstart','dtend','duration','status','rrule','rdate','exdate','categories','class','transp','url']);
const singleNames=new Set(['uid','recurrence-id','summary','location','description','dtstart','dtend','duration','status','rrule','class','transp','url','dtstamp','last-modified','sequence','created']);
export const stable=(v:unknown):string=>JSON.stringify(canonical(v));
export function canonical(v:unknown):Json {
  if(v===null || typeof v==='string'||typeof v==='boolean') return v;
  if(typeof v==='number') return Number.isFinite(v)?v:String(v);
  if(Array.isArray(v)) return v.map(canonical);
  if(typeof v==='object' && v) {const out:Record<string,Json>=Object.create(null);for(const k of Object.keys(v).sort())out[k]=canonical((v as Record<string,unknown>)[k]);return out;}
  return String(v);
}
const issue=(code:string,message:string,event?:number):Issue=>({code,message,...(event===undefined?{}:{event})});
function guard(text:string):{eventSources:string[];unfolded:string} {
  if(new TextEncoder().encode(text).length>LIMITS.bytes) throw Error(`Input exceeds ${LIMITS.bytes} bytes`);
  if(text.includes('\0'))throw Error('NUL bytes are not valid calendar text');
  const physical=text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').split('\n');
  if(physical.length>LIMITS.lines)throw Error(`Input exceeds ${LIMITS.lines} physical lines`);
  const lines:string[]=[];
  for(const line of physical){if(line.includes('\r'))throw Error('Bare carriage return in content');if(line.length>LIMITS.lineLength)throw Error('Content line exceeds limit');if(/^[ \t]/.test(line)){if(!lines.length)throw Error('Orphan folded line');lines[lines.length-1]+=line.slice(1);if(lines.at(-1)!.length>LIMITS.lineLength)throw Error('Unfolded line exceeds limit');}else if(line!=='') lines.push(line);}
  const stack:string[]=[], sources:string[]=[];let event:string[]|null=null, tzBytes=0, props=0, roots=0;
  for(const line of lines){const start=/^BEGIN:([A-Z0-9-]+)$/i.exec(line), end=/^END:([A-Z0-9-]+)$/i.exec(line);
    if(start){const name=start[1].toLowerCase();if(!stack.length){if(name!=='vcalendar'||roots++)throw Error('Expected exactly one VCALENDAR');}if(name==='vevent'){if(stack.length!==1)throw Error('VEVENT must be a direct VCALENDAR child');event=[];if(sources.length>=LIMITS.events)throw Error(`Input exceeds ${LIMITS.events} events`);}stack.push(name);if(stack.length>LIMITS.depth)throw Error('Component nesting exceeds limit');if(name==='vtimezone')tzBytes=0;}
    else if(end){if(stack.at(-1)!==end[1].toLowerCase())throw Error('Mismatched component boundary');}
    else {if(!stack.length||!line.includes(':'))throw Error('Content outside calendar or malformed property');if(++props>LIMITS.properties)throw Error('Property count exceeds limit');}
    if(stack.includes('vtimezone')){tzBytes+=new TextEncoder().encode(line).length;if(tzBytes>LIMITS.timezoneBytes)throw Error('VTIMEZONE definition exceeds limit');}
    if(event)event.push(line);
    if(end){if(end[1].toLowerCase()==='vevent'){sources.push(event!.join('\r\n'));event=null;}stack.pop();}
  }
  if(stack.length||roots!==1)throw Error('Unclosed or absent VCALENDAR');
  return {eventSources:sources,unfolded:lines.join('\r\n')+'\r\n'};
}
function propValue(p:Prop):Json {let vals=p.slice(3) as Json[];if(p[0]==='rrule') vals=vals.map(v=>sortRecur(v));if(['rdate','exdate','categories'].includes(p[0])) vals=vals.slice().sort((a,b)=>stable(a).localeCompare(stable(b),'en'));return canonical({type:p[2],params:p[1],values:vals});}
function sortRecur(v:Json):Json {if(!v||typeof v!=='object'||Array.isArray(v))return v;const out:Record<string,Json>={};for(const [k,x]of Object.entries(v))out[k]=Array.isArray(x)?x.slice().sort((a,b)=>stable(a).localeCompare(stable(b),'en')):x;return canonical(out);}
function grouped(props:Prop[]):Record<string,Json>{
  const sets=new Map<string,Prop>();const normalized:Prop[]=[];for(const p of props){if(['rdate','exdate','categories'].includes(p[0])){const key=stable(p.slice(0,3));const old=sets.get(key);if(old)old.push(...p.slice(3));else sets.set(key,[p[0],p[1],p[2],...p.slice(3)] as Prop);}else normalized.push(p);}
  for(const p of sets.values()){const values=[...new Map(p.slice(3).map(v=>[stable(v),v])).values()];normalized.push([p[0],p[1],p[2],...values] as Prop);}
  props=normalized;const out:Record<string,Json>=Object.create(null);for(const p of props){const list=(out[p[0]]??=[]) as Json[];list.push(propValue(p));}for(const k of Object.keys(out))(out[k] as Json[]).sort((a,b)=>stable(a).localeCompare(stable(b),'en'));return canonical(out) as Record<string,Json>;}
function componentValue(c:Component):Json{return canonical({component:c[0],properties:grouped(c[1]),children:c[2].map(componentValue).sort((a,b)=>stable(a).localeCompare(stable(b),'en'))});}
interface Time {type:string; mode:'date'|'utc'|'floating'|'tzid'; value:string; tzid?:string;}
function parseTime(p:Prop,issues:Issue[],index:number):Time {
  const value=String(p[3]), date=p[2]==='date';const tzid=typeof p[1].tzid==='string'?p[1].tzid:undefined;
  const mode=date?'date':tzid?'tzid':value.endsWith('Z')?'utc':'floating';
  const m=(date?/^(\d{4})-(\d{2})-(\d{2})$/:/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z)?$/).exec(value);
  if(!m)issues.push(issue('invalid-date',`Invalid ${p[0].toUpperCase()} ${p[2]} value`,index));
  else {const [y,mo,d,h=0,mi=0,s=0]=m.slice(1,7).map(Number);const days=[31,((y%4===0&&y%100!==0)||y%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];if(y<1||mo<1||mo>12||d<1||d>(days[mo-1]??0)||h>23||mi>59||s>59)issues.push(issue('invalid-date','Invalid date/time or unsupported leap second',index));}
  if(tzid){issues.push(issue('unresolved-timezone',`${p[0].toUpperCase()} uses TZID=${tzid}; no timezone database or VTIMEZONE instant evaluation is performed`,index));if(date||value.endsWith('Z'))issues.push(issue('invalid-timezone','TZID cannot qualify DATE or UTC values',index));}
  if(!['date','date-time'].includes(p[2]))issues.push(issue('invalid-date-type',`${p[0]} must use DATE or DATE-TIME`,index));
  return {type:p[2],mode,value,...(tzid?{tzid}:{})};
}
function shift(t:Time,seconds:number):Time|null {
  if(t.mode==='tzid')return null;
  const m=/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/.exec(t.value);if(!m)return null;
  const d=new Date(0);d.setUTCFullYear(+m[1],+m[2]-1,+m[3]);d.setUTCHours(+(m[4]??0),+(m[5]??0),+(m[6]??0),0);d.setTime(d.getTime()+seconds*1000);
  if(d.getUTCFullYear()<1||d.getUTCFullYear()>9999)return null;
  const iso=d.toISOString();return {...t,value:t.mode==='date'?iso.slice(0,10):iso.slice(0,19)+(t.mode==='utc'?'Z':'')};
}
function duration(value:string):number|null {const m=/^P(?:(\d+)W|(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?)$/.exec(value);if(!m||!m.slice(1).some(Boolean)||value.endsWith('T'))return null;const sec=(+(m[1]??0)*7+ +(m[2]??0))*86400+ +(m[3]??0)*3600+ +(m[4]??0)*60+ +(m[5]??0);return Number.isSafeInteger(sec)&&sec>0&&sec<=315_360_000_000?sec:null;}
function validateRule(p:Prop,issues:Issue[],index:number,st:Time|null){
  const bad=(message:string)=>issues.push(issue('invalid-rule',message,index));const v=p[3];if(!v||typeof v!=='object'||Array.isArray(v)){bad('Malformed recurrence rule');return;}
  if(!['SECONDLY','MINUTELY','HOURLY','DAILY','WEEKLY','MONTHLY','YEARLY'].includes(String(v.freq)))bad('RRULE FREQ missing or invalid');
  for(const n of ['count','interval'])if(v[n]!==undefined&&(!Number.isInteger(v[n])||Number(v[n])<1||Number(v[n])>2147483647))bad(`RRULE ${n.toUpperCase()} must be a positive 32-bit integer`);
  if(v.count!==undefined&&v.until!==undefined)bad('RRULE COUNT and UNTIL cannot both occur');
  if(v.until!==undefined){const until=String(v.until),type=until.includes('T')?'date-time':'date';const t=parseTime(['until',{},type,until],issues,index);if(st&&(st.type!==type||st.mode==='utc'&&t.mode!=='utc'||st.mode==='floating'&&t.mode!=='floating'||st.mode==='tzid'&&t.mode!=='utc'))bad('RRULE UNTIL does not match DTSTART type / required time mode');}
  const ranges:Record<string,[number,number,boolean]>={bysecond:[0,59,false],byminute:[0,59,false],byhour:[0,23,false],bymonthday:[-31,31,true],byyearday:[-366,366,true],byweekno:[-53,53,true],bymonth:[1,12,false],bysetpos:[-366,366,true]};
  for(const [key,[min,max,noZero]]of Object.entries(ranges))if(v[key]!==undefined){const vals=Array.isArray(v[key])?v[key]:[v[key]];if(vals.some(x=>!Number.isInteger(x)||Number(x)<min||Number(x)>max||noZero&&Number(x)===0))bad(`RRULE ${key.toUpperCase()} values out of range`);}
  if(v.byday!==undefined){const vals=Array.isArray(v.byday)?v.byday:[v.byday];for(const x of vals){const m=/^([+-]?\d{1,2})?(MO|TU|WE|TH|FR|SA|SU)$/.exec(String(x));if(!m||m[1]&&(Number(m[1])===0||Math.abs(Number(m[1]))>53||!['MONTHLY','YEARLY'].includes(String(v.freq))||v.freq==='YEARLY'&&v.byweekno!==undefined))bad('RRULE BYDAY value or ordinal/frequency combination is invalid');}}
  if(v.wkst!==undefined&&!['MO','TU','WE','TH','FR','SA','SU'].includes(String(v.wkst)))bad('Invalid RRULE WKST');
  if(v.bymonthday!==undefined&&v.freq==='WEEKLY')bad('BYMONTHDAY is not allowed with WEEKLY');
  if(v.byyearday!==undefined&&['DAILY','WEEKLY','MONTHLY'].includes(String(v.freq)))bad('BYYEARDAY is invalid for this frequency');
  if(v.byweekno!==undefined&&v.freq!=='YEARLY')bad('BYWEEKNO requires YEARLY');
  if(v.bysetpos!==undefined&&!Object.keys(v).some(k=>k.startsWith('by')&&k!=='bysetpos'))bad('BYSETPOS requires another BY part');
  if(st?.type==='date'&&['byhour','byminute','bysecond'].some(k=>v[k]!==undefined))bad('Time-of-day BY parts are invalid for DATE DTSTART');
  const known=new Set(['freq','count','interval','until','wkst','byday',...Object.keys(ranges)]);for(const k of Object.keys(v))if(!known.has(k))bad(`Unsupported RRULE part ${k.toUpperCase()}`);
}
function record(c:Component,index:number,source:string,method:string|null):Evidence {
  const props=c[1].map(p=>(['status','class','transp'].includes(p[0])?[p[0],p[1],p[2],...p.slice(3).map(v=>typeof v==='string'?v.toUpperCase():v)]:p) as Prop),issues:Issue[]=[];const get=(n:string)=>props.find(p=>p[0]===n);const value=(n:string)=>get(n)?.[3];
  const parameterKeys:Record<string,string[]>={uid:[],summary:['language','altrep'],description:['language','altrep'],location:['language','altrep'],categories:['language'],dtstart:['tzid'],dtend:['tzid'],duration:[],status:[],rrule:[],rdate:['tzid'],exdate:['tzid'],'recurrence-id':['tzid','range'],class:[],transp:[],url:[]};
  const valueTypes:Record<string,string[]>={uid:['text'],summary:['text'],description:['text'],location:['text'],categories:['text'],duration:['duration'],status:['text'],rrule:['recur'],class:['text'],transp:['text'],url:['uri']};
  for(const p of props){if(parameterKeys[p[0]])for(const key of Object.keys(p[1]))if(!parameterKeys[p[0]].includes(key))issues.push(issue('unsupported-parameter',`Unsupported ${p[0].toUpperCase()} parameter ${key.toUpperCase()}`,index));if(valueTypes[p[0]]&&!valueTypes[p[0]].includes(p[2]))issues.push(issue('invalid-value-type',`Unexpected ${p[0].toUpperCase()} value type ${p[2]}`,index));}
  for(const n of singleNames)if(props.filter(p=>p[0]===n).length>1)issues.push(issue('duplicate-property',`Multiple ${n.toUpperCase()} properties`,index));
  for(const line of source.split('\r\n'))if(/^RRULE(?:;[^:]*)?:/i.test(line)){const rule=line.slice(line.indexOf(':')+1);const seen=new Set<string>();for(const part of rule.split(';')){const pair=part.split('=');const key=pair[0]?.toUpperCase(),val=pair[1];if(pair.length!==2||!key||!val||seen.has(key))issues.push(issue('invalid-rule','Empty, malformed or duplicate RRULE part',index));seen.add(key);if(!['FREQ','COUNT','INTERVAL','UNTIL','WKST','BYDAY','BYSECOND','BYMINUTE','BYHOUR','BYMONTHDAY','BYYEARDAY','BYWEEKNO','BYMONTH','BYSETPOS'].includes(key))issues.push(issue('invalid-rule',`Unsupported RRULE part ${key}`,index));if(['COUNT','INTERVAL'].includes(key)&&(!/^\d+$/.test(val??'')||Number(val)<1||Number(val)>2147483647))issues.push(issue('invalid-rule',`Invalid raw RRULE ${key}`,index));if(['BYSECOND','BYMINUTE','BYHOUR','BYMONTHDAY','BYYEARDAY','BYWEEKNO','BYMONTH','BYSETPOS'].includes(key)&&!(val??'').split(',').every(x=>/^[+-]?\d+$/.test(x)))issues.push(issue('invalid-rule',`Invalid raw RRULE ${key}`,index));}}
  const status=get('status');if(status&&!['TENTATIVE','CONFIRMED','CANCELLED'].includes(String(status[3])))issues.push(issue('invalid-status','VEVENT STATUS must be TENTATIVE, CONFIRMED or CANCELLED',index));
  const uid=typeof value('uid')==='string'&&String(value('uid')).length?String(value('uid')):null;
  if(!uid)issues.push(issue('missing-uid','Missing or empty UID; this record is not matched',index));
  const rid=get('recurrence-id'),ridTime=rid?parseTime(rid,issues,index):null;
  const recurrenceId=ridTime?stable(ridTime):null;
  const fields=grouped(props.filter(p=>semanticNames.has(p[0])&&!['dtstart','dtend','duration','uid'].includes(p[0])));
  const metadata=grouped(props.filter(p=>metadataNames.has(p[0])));
  const unsupported=props.filter(p=>!semanticNames.has(p[0])&&!metadataNames.has(p[0]));
  if(unsupported.length){fields.unsupported=grouped(unsupported);issues.push(issue('unsupported-property',`Properties retained without semantic interpretation: ${[...new Set(unsupported.map(p=>p[0].toUpperCase()))].join(', ')}`,index));}
  if(c[2].length){fields.components=c[2].map(componentValue);issues.push(issue('unsupported-component','Nested components (including alarms) are retained but not semantically interpreted',index));}
  const start=get('dtstart'),end=get('dtend'),dur=get('duration');
  const st=start?parseTime(start,issues,index):null;
  if(!st&&method!=='CANCEL'&&String(value('status')).toUpperCase()!=='CANCELLED')issues.push(issue('missing-start','DTSTART missing for a non-cancellation event',index));
  if(st)fields.dtstart=canonical(st);
  if(st&&ridTime&&st.type!==ridTime.type)issues.push(issue('recurrence-type','RECURRENCE-ID must match DTSTART value type',index));
  if(end&&dur)issues.push(issue('conflicting-end','DTEND and DURATION are mutually exclusive',index));
  let et=end?parseTime(end,issues,index):null;
  if(dur){const seconds=duration(String(dur[3]));if(seconds===null)issues.push(issue('invalid-duration','DURATION must be a positive bounded RFC5545 duration',index));else if(st){if(st.mode==='date'&&(seconds%86400!==0||String(dur[3]).includes('T')))issues.push(issue('invalid-duration','DATE events require day or week duration',index));et=shift(st,seconds);if(!et){fields.duration=propValue(dur);if(st.mode!=='tzid')issues.push(issue('end-out-of-range','Duration endpoint outside supported years',index));}}else issues.push(issue('missing-start','Cannot interpret DURATION without DTSTART',index));}
  if(st&&!end&&!dur)et=shift(st,st.mode==='date'?86400:0);
  if(et)fields.dtend=canonical(et);
  if(st&&et){if(st.type!==et.type||st.mode!==et.mode||st.tzid!==et.tzid)issues.push(issue('incomparable-end','Start/end types or time modes differ; duration is uncertain',index));else if(et.value<st.value || (end&&et.value===st.value))issues.push(issue('invalid-end','DTEND must follow DTSTART (DATE end is exclusive)',index));}
  fields.endpointRepresentation=canonical({dtstart:start?propValue(start):null,dtend:end?propValue(end):null,duration:dur?propValue(dur):null});
  if(rid?.[1].range!==undefined&&rid[1].range!=='THISANDFUTURE')issues.push(issue('invalid-range','Unsupported RECURRENCE-ID RANGE',index));
  for(const p of props){if(p[0]==='rrule')validateRule(p,issues,index,st);if(['rdate','exdate'].includes(p[0])){for(const v of p.slice(3)){if(p[2]==='period')issues.push(issue('unsupported-period','RDATE PERIOD is retained without endpoint interpretation',index));else {const t=parseTime([p[0],p[1],p[2],v],issues,index);if(st&&t.type!==st.type)issues.push(issue('recurrence-type','Recurrence dates do not match DTSTART value type',index));}}}}
  return {index,uid,recurrenceId,title:typeof value('summary')==='string'?String(value('summary')):'Untitled event',source,fields:canonical(fields) as Record<string,Json>,metadata,issues};
}
export function parseCalendar(text:string):Parsed {
  const info:CalendarInfo={events:0,method:null,issues:[],metadata:{}};
  try{
    const gated=guard(text);const c=ICAL.parse(gated.unfolded) as unknown as Component;
    if(c[0]!=='vcalendar')throw Error('Expected VCALENDAR');
    const method=c[1].find(p=>p[0]==='method')?.[3];info.method=typeof method==='string'?method.toUpperCase():null;
    if(c[1].filter(p=>p[0]==='method').length>1)info.issues.push(issue('duplicate-method','Multiple METHOD properties'));
    if(c[1].find(p=>p[0]==='version')?.[3]!=='2.0')info.issues.push(issue('unsupported-version','VERSION:2.0 is required'));
    if(c[1].find(p=>p[0]==='calscale')?.[3]&&String(c[1].find(p=>p[0]==='calscale')?.[3]).toUpperCase()!=='GREGORIAN')info.issues.push(issue('unsupported-scale','Only GREGORIAN calendar scale is supported'));
    if(info.method&&!['PUBLISH','CANCEL'].includes(info.method))info.issues.push(issue('unsupported-method',`METHOD:${info.method} scheduling semantics are not interpreted`));
    if(c[1].some(p=>!['version','prodid','method','calscale'].includes(p[0])))info.issues.push(issue('unsupported-calendar-property','Additional calendar-level properties are retained, not interpreted'));
    const other=c[2].filter(x=>!['vevent','vtimezone'].includes(x[0]));if(other.length)info.issues.push(issue('unsupported-calendar-component','Non-VEVENT components are retained, not compared as events'));
    const zones=c[2].filter(x=>x[0]==='vtimezone');info.metadata={properties:grouped(c[1]),timezones:zones.map(componentValue).sort((a,b)=>stable(a).localeCompare(stable(b),'en')),otherComponents:other.map(componentValue).sort((a,b)=>stable(a).localeCompare(stable(b),'en'))};
    const zoneIds=zones.map(z=>stable(z[1].find(p=>p[0]==='tzid')?.[3]??null));if(new Set(zoneIds).size!==zoneIds.length)info.issues.push(issue('duplicate-timezone','Duplicate VTIMEZONE identifiers'));
    const events=c[2].filter(x=>x[0]==='vevent');info.events=events.length;
    const records=events.map((event,i)=>record(event,i+1,gated.eventSources[i]??ICAL.stringify(event as never),info.method));
    return {info,records,fatal:false};
  }catch(e){info.issues.push(issue('invalid-input',e instanceof Error?e.message:'Cannot parse calendar'));return {info,records:[],fatal:true};}
}
