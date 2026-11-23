// One maintained path: recognition -> acoustic words -> validation -> caption import.
import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {readProject,localAsset,fileHash,run,runEditor} from './editor.mjs';
import {transcribe} from './transcribe.mjs';import {alignTranscript} from './align-transcript.mjs';
import {requireAlignedSpeech} from '../src/lib/speech-quality.mjs';
export async function prepareSpeech(id,{setup=false,language='en',vocabulary,recognitionFile}={}){
 if(language!=='en')throw Error('The maintained acoustic-caption/cleanup path currently supports English. Preserve footage; do not silently fall back to unaligned phrase captions for another language.');
 const v=readProject().videos[id];if(!v)throw Error('Intake footage first');if(v.cleanup)throw Error('Prepare speech on the original section before cuts. Preserve the old edit and restore or create a separate revision first.');
 if(fileHash(localAsset(v.source,`videos/${id}`))!==v.sourceSha256)throw Error('Footage changed since intake');
 if(v.transcriptFile&&!recognitionFile){try{const current=JSON.parse(readFileSync(localAsset(v.transcriptFile,`videos/${id}`),'utf8'));requireAlignedSpeech(current,v.durationFrames/v.fps);if(current.sourceSha256===v.sourceSha256&&current.sectionStart===v.inSeconds){console.log('Current acoustic transcript retained; no recognition/alignment rerun.');return {aligned:v.transcriptFile,reused:true,warnings:current.alignment.warnings};}}catch{/* Unprepared/legacy data stays preserved; prepare a separate version below. */}}
 const need=(condition,message,script,args=[])=>{if(!condition)return;if(!setup)throw Error(message+' Run prepare-speech with --setup true after disclosing the local dependency download plan.');run(process.execPath,[script,...args],{stdio:'inherit'});};
 need(!existsSync('.local/transcription/config.json'),'Missing CPU recognizer (~142 MiB English model plus engine).','scripts/setup-transcription.mjs',['--download','--model','base.en']);
 need(!existsSync('.local/transcription/base.en.json'),'Missing verified base.en model (~142 MiB).','scripts/setup-model.mjs',['base.en','--download']);
 if(!existsSync('tools/alignment/node_modules/onnxruntime-node/package.json')){if(!setup)throw Error('Missing project-local CPU alignment runtime; run prepare-speech --setup true after disclosing downloads');run('cmd.exe',['/d','/s','/c','npm.cmd ci --prefix tools/alignment --ignore-scripts --no-audit --no-fund'],{stdio:'inherit'});}
 need(!existsSync('.local/alignment/model.onnx'),'Missing English acoustic model (~95 MB).','scripts/setup-alignment.mjs',['--download']);
 mkdirSync('.local/speech-preparation',{recursive:true});const checkpoint=`.local/speech-preparation/${id}.json`;let automatic;
 if(recognitionFile)automatic=localAsset(recognitionFile,`videos/${id}`);
 if(!automatic&&existsSync(checkpoint)){const saved=JSON.parse(readFileSync(checkpoint,'utf8'));if(saved.sourceSha256===v.sourceSha256&&saved.sectionStart===v.inSeconds&&saved.durationFrames===v.durationFrames&&saved.vocabulary===(vocabulary??null)&&existsSync(resolve('public',saved.automatic))&&fileHash(resolve('public',saved.automatic))===saved.automaticSha256){automatic=resolve('public',saved.automatic);console.log('Resuming preserved recognition; only alignment/import remain.');}}
 automatic??=await transcribe(id,language,'words',{model:'base.en',vocabulary,allowInvalidForAlignment:true});
 const data=JSON.parse(readFileSync(automatic,'utf8'));if(!data.preparedAudio)throw Error('Recognition has no bound prepared audio; do not align an unrelated WAV');
 if(data.sourceSha256!==v.sourceSha256||data.sectionStart!==v.inSeconds||Math.abs(data.durationSeconds-v.durationFrames/v.fps)>1e-6)throw Error('Recognition proposal belongs to another source/section');
 const asset=relative(resolve('public'),automatic).replaceAll('\\','/');
 writeFileSync(checkpoint,JSON.stringify({phase:'recognized',sourceSha256:v.sourceSha256,sectionStart:v.inSeconds,durationFrames:v.durationFrames,vocabulary:vocabulary??null,automatic:asset,automaticSha256:fileHash(automatic)},null,2));
 const aligned=await alignTranscript(asset,resolve(data.preparedAudio.file));
 const result=JSON.parse(readFileSync(aligned,'utf8'));requireAlignedSpeech(result,v.durationFrames/v.fps);
 const alignedAsset=relative(resolve('public'),aligned).replaceAll('\\','/');await runEditor('transcript',[id,'--file',alignedAsset]);
 const receipt={phase:'complete',sourceSha256:v.sourceSha256,sectionStart:v.inSeconds,durationFrames:v.durationFrames,vocabulary:vocabulary??null,automatic:asset,automaticSha256:fileHash(automatic),aligned:alignedAsset,alignedSha256:fileHash(aligned),warnings:result.alignment.warnings,listening:'not assessed',next:'Compare the complete recognition with supplied script; select full takes; guarded cleanup; render and inspect'};
 writeFileSync(`.local/speech-preparation/${id}.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));return receipt;
}
