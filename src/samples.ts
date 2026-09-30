const wrap=(events:string)=>`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//AgendaDiff Synthetic Demo//EN\r\n${events}END:VCALENDAR\r\n`;
const event=(uid:string,title:string,more:string)=>`BEGIN:VEVENT\r\nUID:${uid}\r\nSUMMARY:${title}\r\n${more}END:VEVENT\r\n`;
export const sampleBefore=wrap(
event('design@example.test','Design review','DTSTART:20261005T090000Z\r\nDTEND:20261005T100000Z\r\nLOCATION:Studio 2\r\n')+
event('weekly@example.test','Weekly planning','DTSTART:20261006T140000Z\r\nDURATION:PT30M\r\nRRULE:FREQ=WEEKLY;COUNT=4\r\n')+
event('weekly@example.test','Weekly planning · exception','RECURRENCE-ID:20261013T140000Z\r\nDTSTART:20261013T150000Z\r\nDURATION:PT30M\r\n')+
event('launch@example.test','Launch retrospective','DTSTART:20261007T160000Z\r\nDURATION:PT1H\r\nSTATUS:CONFIRMED\r\n')+
event('focus@example.test','Focus block','DTSTART:20261008T090000\r\nDTEND:20261008T110000\r\nDTSTAMP:20260901T000000Z\r\n')+
event('archive@example.test','Archive-window meeting','DTSTART:20260901T090000Z\r\n'));
export const sampleAfter=wrap(
event('focus@example.test','Focus block','DTSTAMP:20260930T000000Z\r\nDTEND:20261008T110000\r\nDTSTART:20261008T090000\r\n')+
event('design@example.test','Design review','DTSTART:20261005T100000Z\r\nDTEND:20261005T110000Z\r\nLOCATION:Studio 4\r\n')+
event('weekly@example.test','Weekly planning','DTSTART:20261006T140000Z\r\nDURATION:PT30M\r\nRRULE:COUNT=6;FREQ=WEEKLY\r\n')+
event('weekly@example.test','Weekly planning · exception','RECURRENCE-ID:20261013T140000Z\r\nDTSTART:20261013T160000Z\r\nDURATION:PT30M\r\n')+
event('launch@example.test','Launch retrospective','DTSTART:20261007T160000Z\r\nDURATION:PT1H\r\nSTATUS:CANCELLED\r\n')+
event('workshop@example.test','Accessibility workshop','DTSTART;VALUE=DATE:20261009\r\nDTEND;VALUE=DATE:20261010\r\n'));
