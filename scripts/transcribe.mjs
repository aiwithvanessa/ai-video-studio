import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {performance} from 'node:perf_hooks';
import {readProject,probe,run,fileHash} from './editor.mjs';
import {validateTranscript} from '../src/lib/timing.mjs';
export function convertEngine(raw,video){
 if(!Array.isArray(raw.transcription))throw Error('Expected whisper.cpp transcription array');
 const words=raw.transcription.filter(s=>s.text?.trim()).map(segment=>{
  if(!Number.isFinite(segment.offsets?.from)||!Number.isFinite(segment.offsets?.to))throw Error('Missing engine millisecond offsets');
  return {text:segment.text.trim(),start:segment.offsets.from/1000,end:segment.offsets.to/1000};
 });
 return {schemaVersion:1,source:video.source,sourceSha256:video.sourceSha256,sectionStart:video.inSeconds,durationSeconds:video.durationFrames/video.fps,language:raw.result?.language??raw.params?.language??'unknown',model:'whisper.cpp tiny',timingKind:'engine estimated word-split segment intervals',words};
}
export async function transcribe(id,language='auto',timing='words',options={}){
 if(!['words','phrases'].includes(timing))throw Error('Timing mode must be words or phrases');
 const project=readProject(),v=project.videos[id];if(!v)throw Error('Intake a source before transcription');
 if(v.cleanup)throw Error('Restore the original section before retranscription; existing original and edited transcripts are preserved');
 if(fileHash(resolve('public',v.source))!==v.sourceSha256)throw Error('Source changed since intake');
 const settings='.local/transcription/config.json';if(!existsSync(settings))throw Error('Local transcription not set up. Agent: explain ~75 MiB CPU model download and run npm.cmd run setup:transcription -- --download when authorized. No cloud upload.');
 const config=JSON.parse(readFileSync(settings,'utf8'));if(options.model){if(!['base.en','small.en-q5_1'].includes(options.model))throw Error('Supported editing model: base.en or small.en-q5_1');const extra=`.local/transcription/${options.model}.json`;if(!existsSync(extra))throw Error(`Run authorized setup-model.mjs ${options.model} --download first`);Object.assign(config,JSON.parse(readFileSync(extra,'utf8')));}
 if(!existsSync(config.engine)||!existsSync(config.model))throw Error('Engine/model missing; rerun local setup');
 if(config.modelSha256&&fileHash(config.model)!==config.modelSha256)throw Error('Configured model hash changed');
 const stamp=new Date().toISOString().replaceAll(/[:.]/g,'-'),work=resolve('.local/transcription/runs',id,stamp),out=resolve('public/videos',id,'generated/transcripts');mkdirSync(work,{recursive:true});mkdirSync(out,{recursive:true});
 const wav=resolve(work,'section.wav'),duration=v.durationFrames/v.fps;
 const sourceInfo=probe(resolve('public',v.source)),audio=sourceInfo.streams.find(s=>s.codec_type==='audio');if(!audio)throw Error('Source has no audio stream; captions can be omitted or supplied as reviewed text.');
 const origin=Number(sourceInfo.format.start_time??0),offset=Number(audio.start_time??origin)-origin;
 // Preserve the source timeline: trim existing audio, explicitly retain any missing leading/trailing silence.
 // This maps stream start offsets; it does not shift words to volume thresholds or alter engine timing.
 const audioStart=Math.max(0,v.inSeconds-offset),leadingSamples=Math.max(0,Math.round((offset-v.inSeconds)*16000));
 const filter=`aresample=16000,asetpts=PTS-STARTPTS,atrim=start=${audioStart}:end=${audioStart+duration},asetpts=PTS-STARTPTS,adelay=${leadingSamples}S:all=1,apad=whole_dur=${duration},atrim=duration=${duration}`;
 run('ffmpeg',['-v','error','-i',resolve('public',v.source),'-map','0:a:0','-vn','-af',filter,'-ac','1','-ar','16000','-c:a','pcm_s16le',wav]);
 const info=probe(wav),wavDuration=Number(info.format.duration);if(Math.abs(wavDuration-duration)>1/16000+.001)throw Error(`Prepared audio ${wavDuration}s differs from composition ${duration}s; inspect stream offsets`);
 if(options.vocabulary&&(typeof options.vocabulary!=='string'||options.vocabulary.length>500))throw Error('Vocabulary context must be at most 500 characters');
 const started=performance.now(),result=run(config.engine,['-m',config.model,'-f',wav,'-l',language,'-ng','-t','2','-ojf','-of',resolve(work,'engine'),'-ml',timing==='phrases'?'24':'1','-sow',...(options.dtw?['-nfa','-dtw',config.modelName.replace(/-q\d_\d$/,'')]:[]),...(options.vocabulary?['--prompt',options.vocabulary]:[])]);
 writeFileSync(resolve(work,'diagnostic.log'),result.stdout+'\n'+result.stderr);
 const raw=JSON.parse(readFileSync(resolve(work,'engine.json'),'utf8')),transcript=convertEngine(raw,v),validation=validateTranscript(transcript,duration),file=resolve(out,`automatic-${stamp}.json`);
 transcript.model='whisper.cpp '+config.modelName;transcript.modelSha256=config.modelSha256;transcript.dtwDiagnostics=Boolean(options.dtw);transcript.timingGranularity=timing==='phrases'?'phrase':'word-estimates';if(timing==='phrases')transcript.timingKind='native engine phrase intervals; no individual word boundaries';
 transcript.processingSeconds=(performance.now()-started)/1000;transcript.wavDurationSeconds=wavDuration;transcript.audioMapping={origin,streamOffsetSeconds:offset,trimAudioStart:audioStart,leadingSilenceSamples:leadingSamples,sampleRate:16000};transcript.validation=validation;
 transcript.preparedAudio={file:relative(process.cwd(),wav).replaceAll('\\','/'),sha256:fileHash(wav)};if(options.vocabulary)transcript.vocabularyContext=options.vocabulary;
 writeFileSync(file,JSON.stringify(transcript,null,2));writeFileSync(file+'.txt',transcript.words.map(w=>w.text).join(' ')+'\n');
 console.log(JSON.stringify({file,words:transcript.words.length,language:transcript.language,processingSeconds:transcript.processingSeconds,wavDuration,validation},null,2));
 if(!validation.valid&&!options.allowInvalidForAlignment)throw Error('Transcript preserved, but invalid estimated timings block caption import. Diagnose or align in a separate copy; do not clamp/drop/shift estimates.');
 return file;
}
if(process.argv[1]?.endsWith('transcribe.mjs'))await transcribe(process.argv[2],process.argv[3]??'auto');
