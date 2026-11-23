import {validateTranscript} from './timing.mjs';
export const CTC_MODEL_SHA='1d9a366c27b2966625cd5035ac3db8847c53bba617169912bb251b42975a3a22';
export function requireAlignedSpeech(data,duration){
 const report=validateTranscript(data,duration);if(!report.valid)throw Error('Invalid speech timing: '+report.errors.join('; '));
 const a=data.alignment;
 if(a?.algorithm!=='ctc-viterbi'||a.modelSha256!==CTC_MODEL_SHA||a.sourceSha256!==data.sourceSha256||!a.wavSha256)throw Error('Acoustic word alignment required. Run studio prepare-speech before caption rendering or speech cleanup; phrase estimates are not a timing fallback.');
 if(data.words.some(w=>/\s/.test(w.text.trim())))throw Error('Individual acoustic word intervals required; do not split phrase timestamps evenly. Run prepare-speech.');
 if(data.words.some(w=>!Number.isFinite(w.alignmentConfidence)||w.alignmentConfidence<0||w.alignmentConfidence>1))throw Error('Acoustic word confidence data missing; rerun prepare-speech');
 return report;
}
export function checkCutBoundaries(data,keeps,totalFrames,fps=30){
 requireAlignedSpeech(data,totalFrames/fps);const warnings=[],boundaries=[];
 for(const range of keeps){
  const start=range.startFrame/fps,end=range.endFrame/fps,inside=data.words.filter(w=>w.start>=start-1e-7&&w.end<=end+1e-7);
  if(!inside.length){warnings.push(`Kept section ${start.toFixed(2)}–${end.toFixed(2)}s has no recognized speech`);continue;}
  const first=inside[0],last=inside.at(-1);
  if(data.words.some(w=>w.start<start&&w.end>start||w.start<end&&w.end>end))throw Error('Cut intersects acoustically aligned speech; keep a complete take');
  if(range.startFrame>0&&first.start-start<.12-1e-7)throw Error(`Cut too close to speech onset (${first.text}); leave at least 120 ms of measured context`);
  if(range.endFrame<totalFrames){
   if(end-last.end<.12-1e-7)throw Error(`Cut too close to speech ending (${last.text}); leave at least 120 ms of measured context`);
   if(!/[.!?]["'’”)]*$/.test(last.text))throw Error(`Kept sentence ends mid-thought at ${last.text}; choose a complete sentence boundary`);
  }
  for(const w of [...(range.startFrame>0?[first]:[]),...(range.endFrame<totalFrames?[last]:[])])if(w.alignmentConfidence<.1)throw Error(`Low-confidence cut-adjacent word ${w.text}; recheck acoustic boundary instead of guessing`);
  boundaries.push({sourceStart:start,sourceEnd:end,firstWord:first.text,lastWord:last.text,leadingContext:first.start-start,trailingContext:end-last.end});
 }
 return {boundaries,warnings,claim:'Computed boundary checks, not listening confirmation'};
}
