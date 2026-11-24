import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {readProject,writeProject,localAsset,fileHash,probe,run} from './editor.mjs';
import {loadState,saveState,revise} from './studio-state.mjs';
import {validateTranscript} from '../src/lib/timing.mjs';
import {keepRangesFromCuts,mapKeptWords,proposeRetakeCuts} from '../src/lib/cleanup.mjs';
import {checkCutBoundaries} from '../src/lib/speech-quality.mjs';
const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');
function loadOriginal(v){
 if(v.cleanup)throw Error('Restore the original timeline before changing a cleanup plan; previous outputs remain preserved');
 if(!v.transcriptFile)throw Error('Transcribe/import the full intended source section before cleanup');
 const file=localAsset(v.transcriptFile,`videos/${v.id}`),data=JSON.parse(readFileSync(file,'utf8'));
 if(data.sourceSha256!==v.sourceSha256||data.sectionStart!==v.inSeconds||Math.abs(data.durationSeconds-v.durationFrames/v.fps)>1e-6)throw Error('Transcript does not match original section');
 const validation=validateTranscript(data,v.durationFrames/v.fps);if(!validation.valid)throw Error('Invalid source transcript timing: '+validation.errors.join('; '));
 return {file,data};
}
export function analyzeCleanup(id){
 const v=readProject().videos[id];if(!v)throw Error('Intake footage first');const {file,data}=loadOriginal(v),analysis=proposeRetakeCuts(data,v.durationFrames,v.fps);
 const folder=`videos/${id}/generated/cleanup`;mkdirSync(resolve('public',folder),{recursive:true});
 const asset=folder+`/proposal-${stamp()}.json`,plan={schemaVersion:1,sourceSha256:v.sourceSha256,transcriptSha256:fileHash(file),sectionStart:v.inSeconds,sourceDurationFrames:v.durationFrames,fps:v.fps,...analysis};
 writeFileSync(resolve('public',asset),JSON.stringify(plan,null,2));
 writeFileSync(resolve('public',asset+'.txt'),['AUTOMATIC CLEANUP PROPOSAL — not final approval',...analysis.suggestions.map(s=>`${s.automatic?'Proposed removal':'Retained / review'} ${s.sourceStart.toFixed(2)}–${s.sourceEnd.toFixed(2)}s: ${s.earlierText}\nReason: ${s.reason}\nFollowing take: ${s.laterText}`),...analysis.warnings].join('\n\n'));
 console.log(JSON.stringify({planFile:asset,automaticCuts:analysis.cuts.length,reviewItems:analysis.suggestions.filter(s=>!s.automatic).length,warnings:analysis.warnings},null,2));return asset;
}
export function applyCleanup(id,planFile){
 const project=readProject(),v=project.videos[id];if(!v)throw Error('Intake footage first');const {file,data}=loadOriginal(v);
 if(v.effects.length||v.graphics.length||v.sounds.length)throw Error('Cleanup must precede timed effects/graphics/sounds. Preserve this edit; plan a separate cleanup revision rather than silently moving existing cues.');
 if(!planFile)throw Error('Supply the public-relative cleanup plan');
 const planPath=localAsset(planFile,`videos/${id}`),plan=JSON.parse(readFileSync(planPath,'utf8'));
 if(plan.schemaVersion!==1||plan.sourceSha256!==v.sourceSha256||plan.transcriptSha256!==fileHash(file)||plan.sectionStart!==v.inSeconds||plan.sourceDurationFrames!==v.durationFrames||plan.fps!==v.fps)throw Error('Cleanup plan source/transcript/section has changed');
 if(!plan.cuts?.length)throw Error('No supported automatic cuts; keep the original and review suggestions. No empty cleanup is applied.');
 const keeps=keepRangesFromCuts(plan.cuts,v.durationFrames),boundaryChecks=checkCutBoundaries(data,keeps,v.durationFrames,v.fps),mapped=mapKeptWords(data,keeps,v.fps);
 if(keeps.length>40)throw Error('More than40 kept sections; review a smaller pass for this CPU workflow');
 const source=localAsset(v.source,`videos/${id}`);if(fileHash(source)!==v.sourceSha256)throw Error('Original media changed');
 const info=probe(source),vs=info.streams.find(s=>s.codec_type==='video'),audio=info.streams.find(s=>s.codec_type==='audio'),offset=audio?Number(audio.start_time??0)-Number(vs.start_time??0):0;
 if(Math.abs(Number(vs.start_time??0)-Number(info.format.start_time??0))>1/v.fps)throw Error('Video/media-origin offset needs normalization and timing review before cleanup');
 const folder=`videos/${id}/generated/cleanup/run-${stamp()}`;mkdirSync(resolve('public',folder),{recursive:true});
 const cleanup={mode:'source-timeline',originalSectionFrames:v.durationFrames,sourceTranscriptFile:v.transcriptFile,sourceTranscriptSha256:fileHash(file),sourceCaptions:v.captions,planFile,planSha256:fileHash(planPath),keepRanges:keeps,removedWordIndices:mapped.removedWordIndices,warnings:plan.warnings??[]};
 // No video/audio intermediate: Remotion consumes these original-source ranges.
 const transcriptFile=folder+'/edited-transcript.json';
 writeFileSync(resolve('public',transcriptFile),JSON.stringify({...data,timeline:'edited',durationSeconds:mapped.durationFrames/v.fps,words:mapped.words,cleanupPlanSha256:cleanup.planSha256,validation:mapped.validation},null,2));
 writeFileSync(resolve('public',folder+'/cut-report.json'),JSON.stringify({cuts:plan.cuts,keeps,boundaryChecks,removedWords:mapped.removedWordIndices.map(i=>({index:i,...data.words[i]})),keptWordCount:mapped.words.length,warnings:cleanup.warnings,listening:'Not assessed; final draft approval still required'},null,2));
 writeFileSync(resolve('public',folder+'/retained-transcript.txt'),mapped.words.map(w=>(w.cutBefore?'\n\n':'')+w.text).join(' ')+'\n');
 v.cleanup=cleanup;v.durationFrames=mapped.durationFrames;v.words=mapped.words;v.transcriptFile=transcriptFile;
 writeProject(project);const s=loadState(process.cwd());revise(s,id);saveState(process.cwd(),s);appendFileSync(`docs/briefs/${id}.local.md`,`\nCleanup: ${plan.cuts.length} cut(s), ${mapped.removedWordIndices.length} words omitted; source retained. Report ${folder}/cut-report.json. Review draft/listen; no final approval.\n`);
 console.log(JSON.stringify({durationSeconds:v.durationFrames/v.fps,timeline:'original-source',transcriptFile,removedWordCount:mapped.removedWordIndices.reduce((n,i)=>n+data.words[i].text.trim().split(/\s+/).length,0),keptWordCount:v.words.reduce((n,w)=>n+w.text.trim().split(/\s+/).length,0),captionIntervalCount:v.words.length,warnings:cleanup.warnings},null,2));return planFile;
}
export function restoreCleanup(id){
 const p=readProject(),v=p.videos[id],c=v?.cleanup;if(!c)throw Error('No cleanup applied');
 if(v.effects.length||v.graphics.length||v.sounds.length)throw Error('Timed cues added after cleanup; preserve them and review remapping before restoring');
 const file=localAsset(c.sourceTranscriptFile,`videos/${id}`);if(fileHash(file)!==c.sourceTranscriptSha256)throw Error('Original transcript changed');
 v.durationFrames=c.originalSectionFrames;v.words=JSON.parse(readFileSync(file,'utf8')).words;v.transcriptFile=c.sourceTranscriptFile;v.captions=c.sourceCaptions;delete v.cleanup;writeProject(p);const s=loadState(process.cwd());revise(s,id);saveState(process.cwd(),s);console.log('Original section/timestamps restored; generated cuts/media preserved for comparison.');
}
