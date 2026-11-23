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
 const editedSource=folder+'/edited.mp4',out=resolve('public',editedSource),filter=[];
 const n=keeps.length;
 filter.push(`[0:v:0]fps=${v.fps},setpts=PTS-STARTPTS,split=${n}`+keeps.map((_,i)=>`[vin${i}]`).join(''));
 if(audio){const lead=offset>=0?`adelay=${Math.round(offset*48000)}S:all=1`:`atrim=start=${-offset},asetpts=PTS-STARTPTS`;filter.push(`[0:a:0]aresample=48000,asetpts=PTS-STARTPTS,${lead},apad,asplit=${n}`+keeps.map((_,i)=>`[ain${i}]`).join(''));}
 for(const [i,k] of keeps.entries()){
  const start=Math.round(v.inSeconds*v.fps)+k.startFrame,end=Math.round(v.inSeconds*v.fps)+k.endFrame;
  filter.push(`[vin${i}]trim=start_frame=${start}:end_frame=${end},setpts=PTS-STARTPTS,scale=${v.width}:${v.height},setsar=1[v${i}]`);
  if(audio)filter.push(`[ain${i}]atrim=start_sample=${start*1600}:end_sample=${end*1600},asetpts=PTS-STARTPTS[a${i}]`);
 }
 filter.push(keeps.map((_,i)=>`[v${i}]${audio?`[a${i}]`:''}`).join('')+`concat=n=${n}:v=1:a=${audio?1:0}[vout]${audio?'[aout]':''}`);
 const args=['-v','error','-n','-i',source,'-filter_complex_threads','1','-filter_complex',filter.join(';'),'-map','[vout]'];if(audio)args.push('-map','[aout]','-c:a','aac','-ar','48000','-ac','2');
 args.push('-c:v','libx264','-preset','veryfast','-crf','18','-threads','1','-pix_fmt','yuv420p','-r','30','-frames:v',String(mapped.durationFrames),'-movflags','+faststart',out);
 run('ffmpeg',args);const meta=probe(out),outputVideo=meta.streams.find(s=>s.codec_type==='video');
 if(outputVideo.width!==v.width||outputVideo.height!==v.height||outputVideo.codec_name!=='h264'||outputVideo.pix_fmt!=='yuv420p'||Number(outputVideo.nb_frames)!==mapped.durationFrames||Math.abs(Number(outputVideo.duration)-mapped.durationFrames/v.fps)>1/v.fps||Boolean(audio)!==meta.streams.some(s=>s.codec_type==='audio'))throw Error('Edited media verification failed; original/state unchanged; preserve generated evidence');
 const cleanup={originalSectionFrames:v.durationFrames,sourceTranscriptFile:v.transcriptFile,sourceTranscriptSha256:fileHash(file),sourceCaptions:v.captions,planFile,planSha256:fileHash(planPath),editedSource,editedSourceSha256:fileHash(out),keepRanges:keeps,removedWordIndices:mapped.removedWordIndices,warnings:plan.warnings??[]};
 const transcriptFile=folder+'/edited-transcript.json';
 writeFileSync(resolve('public',transcriptFile),JSON.stringify({...data,timeline:'edited',durationSeconds:mapped.durationFrames/v.fps,words:mapped.words,cleanupPlanSha256:cleanup.planSha256,validation:mapped.validation},null,2));
 writeFileSync(resolve('public',folder+'/cut-report.json'),JSON.stringify({cuts:plan.cuts,keeps,boundaryChecks,removedWords:mapped.removedWordIndices.map(i=>({index:i,...data.words[i]})),keptWordCount:mapped.words.length,warnings:cleanup.warnings,listening:'Not assessed; final draft approval still required'},null,2));
 writeFileSync(resolve('public',folder+'/retained-transcript.txt'),mapped.words.map(w=>(w.cutBefore?'\n\n':'')+w.text).join(' ')+'\n');
 v.cleanup=cleanup;v.durationFrames=mapped.durationFrames;v.words=mapped.words;v.transcriptFile=transcriptFile;
 writeProject(project);const s=loadState(process.cwd());revise(s,id);saveState(process.cwd(),s);appendFileSync(`docs/briefs/${id}.local.md`,`\nCleanup: ${plan.cuts.length} cut(s), ${mapped.removedWordIndices.length} words omitted; source retained. Report ${folder}/cut-report.json. Review draft/listen; no final approval.\n`);
 console.log(JSON.stringify({durationSeconds:v.durationFrames/v.fps,editedSource,transcriptFile,removedWordCount:mapped.removedWordIndices.reduce((n,i)=>n+data.words[i].text.trim().split(/\s+/).length,0),keptWordCount:v.words.reduce((n,w)=>n+w.text.trim().split(/\s+/).length,0),captionIntervalCount:v.words.length,warnings:cleanup.warnings},null,2));return editedSource;
}
export function restoreCleanup(id){
 const p=readProject(),v=p.videos[id],c=v?.cleanup;if(!c)throw Error('No cleanup applied');
 if(v.effects.length||v.graphics.length||v.sounds.length)throw Error('Timed cues added after cleanup; preserve them and review remapping before restoring');
 const file=localAsset(c.sourceTranscriptFile,`videos/${id}`);if(fileHash(file)!==c.sourceTranscriptSha256)throw Error('Original transcript changed');
 v.durationFrames=c.originalSectionFrames;v.words=JSON.parse(readFileSync(file,'utf8')).words;v.transcriptFile=c.sourceTranscriptFile;v.captions=c.sourceCaptions;delete v.cleanup;writeProject(p);const s=loadState(process.cwd());revise(s,id);saveState(process.cwd(),s);console.log('Original section/timestamps restored; generated cuts/media preserved for comparison.');
}
