#!/usr/bin/env node
import {open,writeFile,realpath} from 'node:fs/promises';
import {resolve} from 'node:path';
import {compareCalendars,LIMITS,reportToHtml} from './core/index.js';
const HELP=`AgendaDiff 0.1.0 — local iCalendar export comparison
Usage: agendadiff BEFORE.ics AFTER.ics [--format json|html] [--output FILE]
       agendadiff --help | --version

Default: deterministic JSON on stdout. Output files must not already exist.
Exit codes: 0 supported-field equality; 1 supported differences;
            2 incomplete / invalid / conflict; 3 CLI or I/O error.
No calendar writes, network calls, recurrence expansion or timezone lookups.
Reports contain calendar data. Review before sharing.
`;
async function readBounded(path:string):Promise<string>{const file=await open(path,'r');try{const stat=await file.stat();if(!stat.isFile())throw Error('Inputs must be regular files');if(stat.size>LIMITS.bytes)throw Error(`Input exceeds ${LIMITS.bytes} bytes`);const buf=Buffer.alloc(LIMITS.bytes+1);let n=0;while(n<buf.length){const got=await file.read(buf,n,buf.length-n,null);if(!got.bytesRead)break;n+=got.bytesRead;}if(n>LIMITS.bytes)throw Error('Input grew beyond byte limit');return new TextDecoder('utf-8',{fatal:true}).decode(buf.subarray(0,n));}finally{await file.close();}}
async function main(){const args=process.argv.slice(2);if(args.length===1&&args[0]==='--help'){process.stdout.write(HELP);return;}if(args.length===1&&args[0]==='--version'){process.stdout.write('0.1.0\n');return;}const positional:string[]=[];let format='json',output:string|undefined;
for(let i=0;i<args.length;i++){const arg=args[i];if(arg==='--format'){if(!args[i+1])throw Error('--format requires json or html');format=args[++i];}else if(arg==='--output'){if(!args[i+1])throw Error('--output requires a file path');output=args[++i];}else if(arg.startsWith('-'))throw Error(`Unknown option: ${arg}`);else positional.push(arg);}
if(positional.length!==2||!['json','html'].includes(format))throw Error('Expected BEFORE.ics AFTER.ics and --format json|html; use --help');
if(output){const out=resolve(output);for(const p of positional)if(out===resolve(p)||out===await realpath(p))throw Error('Output must not overwrite an input file');}
const [a,b]=await Promise.all(positional.map(readBounded));const report=compareCalendars(a,b),content=format==='json'?JSON.stringify(report,null,2)+'\n':reportToHtml(report);
if(output)await writeFile(output,content,{encoding:'utf8',flag:'wx',mode:0o600});else process.stdout.write(content);
process.exitCode=!report.complete?2:Object.entries(report.summary).some(([k,v])=>k!=='unchanged'&&v>0)?1:0;
}
main().catch(e=>{process.stderr.write(`AgendaDiff: ${e instanceof Error?e.message:'Unexpected error'}\n`);process.exitCode=3;});
