import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {digest,localAsset} from './editor.mjs';
import {validateTranscript} from '../src/lib/timing.mjs';
export function applyCorrections(base,baseBytes,corrections){
 if(corrections.baseSha256!==digest(baseBytes))throw Error('Correction base hash does not match this transcript');
 if(typeof corrections.note!=='string'||!corrections.note.trim()||!Array.isArray(corrections.changes))throw Error('Listening/wording review note and changes required');
 const result=structuredClone(base),seen=new Set();
 for(const change of corrections.changes){if(!Number.isInteger(change.index)||seen.has(change.index)||result.words[change.index]?.text!==change.expectedText)throw Error('Correction index/text mismatch');seen.add(change.index);const word=result.words[change.index];for(const key of ['text','start','end'])if(change[key]!==undefined)word[key]=change[key];}
 const validation=validateTranscript(result,result.durationSeconds);if(!validation.valid)throw Error(validation.errors.join('; '));
 result.review={baseSha256:corrections.baseSha256,note:corrections.note,at:new Date().toISOString()};result.validation=validation;return result;
}
if(process.argv[1]?.endsWith('review-transcript.mjs')){
 const [input,patch]=process.argv.slice(2);if(!input||!patch)throw Error('Agent supplies public-relative transcript and local correction JSON; user gives plain-language corrections.');
 const file=localAsset(input,'videos'),bytes=readFileSync(file,'utf8'),base=JSON.parse(bytes),corrections=JSON.parse(readFileSync(resolve(patch),'utf8'));
 const output=resolve(dirname(file),'reviewed-'+new Date().toISOString().replaceAll(/[:.]/g,'-')+'.json');if(existsSync(output))throw Error('Reviewed output already exists');writeFileSync(output,JSON.stringify(applyCorrections(base,bytes,corrections),null,2));console.log(output);
}
