import {interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {CSSProperties,ReactNode} from 'react';
import type {Effect} from '../types';
export const Effects=({effects,children}:{effects:Effect[];children:ReactNode})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig();let scale=1,x=0,opacity=1;
 for(const e of effects){const a=e.start*fps,b=e.end*fps;if(frame<a||frame>=b)continue;
  const ramp=Math.min(10,(b-a)/2);const progress=Math.max(0,Math.min(1,(frame-a)/ramp,(b-frame)/ramp));
  if(e.kind==='zoom')scale=Math.max(scale,1+e.amount*progress);
  if(e.kind==='pan'){scale=Math.max(scale,1+.04*progress);x=e.amount*progress*interpolate(frame,[a,b],[-1,1]);}
  if(e.kind==='fade')opacity*=progress;
 }
 const style:CSSProperties={width:'100%',height:'100%',transform:`translateX(${x}px) scale(${scale})`,transformOrigin:'50% 42%',opacity};
 return <div style={style}>{children}</div>;
};
