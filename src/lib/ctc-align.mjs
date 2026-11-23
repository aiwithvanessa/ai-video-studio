// Original Viterbi CTC implementation: monotonic labels with blank/repeat transitions.
// No script-driven text rewriting and no interpolation of missing words.
export function ctcAlign(logits,frames,vocabulary,labels,blank=0){
 const states=labels.length*2+1;if(!labels.length||frames<1||frames*states>30000000)throw Error('Unsupported alignment size; split into shorter speech sections');
 const back=new Uint8Array(frames*states);let prev=new Float64Array(states).fill(-Infinity);prev[0]=0;
 let best=-Infinity,bestTime=-1,bestState=-1;
 for(let t=0;t<frames;t++){
  const off=t*vocabulary,max=Math.max(...logits.subarray(off,off+vocabulary));let sum=0;for(let j=0;j<vocabulary;j++)sum+=Math.exp(logits[off+j]-max);const norm=max+Math.log(sum);
  const next=new Float64Array(states).fill(-Infinity);
  for(let s=0;s<states;s++){
   const label=s%2?labels[(s-1)/2]:blank;let value=prev[s],step=0;
   if(s>0&&prev[s-1]>value){value=prev[s-1];step=1;}
   if(s>1&&s%2&&label!==labels[(s-3)/2]&&prev[s-2]>value){value=prev[s-2];step=2;}
   if(s===0)value=0; // Unconstrained leading context, not a forced first-word onset.
   next[s]=value+logits[off+label]-norm;back[t*states+s]=step;
  }
  for(const s of [states-1,states-2])if(next[s]>best){best=next[s];bestTime=t;bestState=s;}
  prev=next;
 }
 if(!Number.isFinite(best))throw Error('No complete CTC path; retain original estimates for review');
 const spans=labels.map(()=>({start:Infinity,end:-1,logProbability:0,count:0}));let s=bestState;
 for(let t=bestTime;t>=0;t--){if(s%2){const a=spans[(s-1)/2],off=t*vocabulary,max=Math.max(...logits.subarray(off,off+vocabulary));let sum=0;for(let j=0;j<vocabulary;j++)sum+=Math.exp(logits[off+j]-max);a.start=Math.min(a.start,t);a.end=Math.max(a.end,t+1);a.logProbability+=logits[off+labels[(s-1)/2]]-max-Math.log(sum);a.count++;}s-=back[t*states+s];}
 if(spans.some(a=>!a.count))throw Error('Incomplete CTC path; no word times fabricated');return spans;
}
