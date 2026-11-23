import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,dirname,basename} from 'node:path';import {createRequire} from 'node:module';import {performance} from 'node:perf_hooks';
import {fileHash,localAsset,probe} from './editor.mjs';import {validateTranscript} from '../src/lib/timing.mjs';import {ctcAlign} from '../src/lib/ctc-align.mjs';
import {alignmentLabel} from '../src/lib/alignment-text.mjs';
export async function alignTranscript(asset,wav){
 const file=localAsset(asset,'videos'),base=JSON.parse(readFileSync(file,'utf8'));
 if(base.timeline==='edited')throw Error('Align the full original transcript before selecting cuts');
 if(base.preparedAudio&&fileHash(wav)!==base.preparedAudio.sha256)throw Error('WAV differs from the audio prepared for this recognition pass');
 const model=resolve('.local/alignment/model.onnx');if(!existsSync(model))throw Error('Missing CPU model; run authorized setup-alignment.mjs --download (~95 MB)');
 if(fileHash(model)!=='1d9a366c27b2966625cd5035ac3db8847c53bba617169912bb251b42975a3a22')throw Error('Alignment model hash mismatch');
 const meta=probe(wav);if(Math.abs(Number(meta.format.duration)-base.durationSeconds)>.001)throw Error('Audio/transcript duration mismatch');
 const {spawnSync}=await import('node:child_process');const pcm=spawnSync('ffmpeg',['-v','error','-i',resolve(wav),'-ac','1','-ar','16000','-f','f32le','pipe:1'],{maxBuffer:32*1024*1024});if(pcm.status!==0)throw Error(pcm.stderr.toString());
 const samples=new Float32Array(pcm.stdout.buffer.slice(pcm.stdout.byteOffset,pcm.stdout.byteOffset+pcm.stdout.length));
 const require=createRequire(resolve('tools/alignment/package.json'));let ort;try{ort=require('onnxruntime-node');}catch{throw Error('Install tools/alignment package dependencies locally first');}
 const session=await ort.InferenceSession.create(model,{executionProviders:['cpu'],intraOpNumThreads:2,interOpNumThreads:1});
 const vocab=JSON.parse(readFileSync('.local/alignment/vocab.json','utf8')),config=JSON.parse(readFileSync('.local/alignment/config.json','utf8')),stride=config.conv_stride.reduce((a,b)=>a*b,1)/16000;
 const groups=[];let current=[];
 for(const [index,entry] of base.words.entries()){
  if(typeof entry.text!=='string'||!Number.isFinite(entry.start)||!Number.isFinite(entry.end)||entry.start<0||entry.end<entry.start||entry.end>base.durationSeconds+1e-6)throw Error('Invalid recognition search window; preserve and diagnose the engine output');
  // Expand text only. Shared search windows are hints, never claimed word timestamps.
  const labels=entry.text.trim().split(/\s+/);
  for(const [partIndex,text] of labels.entries()){const word={...entry,text,index,partIndex};current.push(word);if(/[.!?]$/.test(text)||word.end-current[0].start>10){groups.push(current);current=[];}}
 }if(current.length)groups.push(current);
 const words=[],diagnostics=[],started=performance.now();
 try{for(const [n,group] of groups.entries()){
  const from=Math.max(0,Math.floor((group[0].start-1.2)*16000)),to=Math.min(samples.length,Math.ceil((group.at(-1).end+1.2)*16000));const input=samples.slice(from,to);
  let mean=0;for(const x of input)mean+=x;mean/=input.length;let variance=0;for(const x of input)variance+=(x-mean)**2;const denom=Math.sqrt(variance/input.length+1e-7);for(let i=0;i<input.length;i++)input[i]=(input[i]-mean)/denom;
  const labels=[],ranges=[];
  for(const w of group){const text=alignmentLabel(w.text);if(labels.length)labels.push(vocab['|']);const start=labels.length;for(const c of text){if(vocab[c]===undefined)throw Error('Unsupported alignment character: '+c);labels.push(vocab[c]);}ranges.push({start,end:labels.length,word:w});}
  const feeds={input_values:new ort.Tensor('float32',input,[1,input.length])};if(session.inputNames.includes('attention_mask'))feeds.attention_mask=new ort.Tensor('int64',new BigInt64Array(input.length).fill(1n),[1,input.length]);
  const result=await session.run(feeds),logits=result.logits??Object.values(result)[0],frames=logits.dims[1],width=logits.dims[2],spans=ctcAlign(logits.data,frames,width,labels,config.pad_token_id??0);
  for(const a of ranges){const chars=spans.slice(a.start,a.end),confidence=Math.exp(chars.reduce((sum,c)=>sum+c.logProbability,0)/chars.reduce((sum,c)=>sum+c.count,0));words.push({text:a.word.text,start:from/16000+chars[0].start*stride,end:from/16000+chars.at(-1).end*stride,alignmentConfidence:confidence,automaticWordIndex:a.word.index,sourcePartIndex:a.word.partIndex});}
  const inverse=Object.fromEntries(Object.entries(vocab).map(([key,value])=>[value,key]));let greedy='',previous=-1;for(let t=0;t<frames;t++){let best=0;for(let j=1;j<width;j++)if(logits.data[t*width+j]>logits.data[t*width+best])best=j;if(best!==(config.pad_token_id??0)&&best!==previous)greedy+=inverse[best]??'?';previous=best;}
  diagnostics.push({group:n,firstIndex:group[0].index,lastIndex:group.at(-1).index,start:from/16000,end:to/16000,independentGreedyText:greedy.replaceAll('|',' ')});console.log(`Aligned ${n+1}/${groups.length} speech blocks`);
 }}finally{await session.release();}
 const validation=validateTranscript({schemaVersion:1,words},base.durationSeconds),output={...base,words,timingKind:'CPU wav2vec2 CTC acoustic Viterbi alignment; estimated 20 ms cells, not listening-approved',timingGranularity:'word-estimates',alignment:{algorithm:'ctc-viterbi',sourceSha256:base.sourceSha256,model:'onnx-community/wav2vec2-base-960h-ONNX',modelSha256:fileHash(model),baseSha256:fileHash(file),wavSha256:fileHash(wav),processingSeconds:(performance.now()-started)/1000,blocks:diagnostics,warnings:words.filter(w=>w.alignmentConfidence<.1).map(w=>`Low acoustic match: ${w.automaticWordIndex} ${w.text}`)},validation};
 const out=resolve(dirname(file),'aligned-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json');writeFileSync(out,JSON.stringify(output,null,2));console.log(JSON.stringify({file:out,validation,lowConfidence:output.alignment.warnings},null,2));if(!validation.valid)throw Error('Aligned output retained but invalid; no caption import');return out;
}
if(process.argv[1]?.endsWith('align-transcript.mjs'))await alignTranscript(process.argv[2],process.argv[3]);
