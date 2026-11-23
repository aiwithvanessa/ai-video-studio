import {useMemo} from 'react';
import {interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {captionWordColor} from '../lib/caption-appearance.mjs';
import {layoutCaptions} from '../lib/caption-layout.mjs';
import type {Brand,Word} from '../types';
import {activeWord} from '../lib/timing.mjs';
type Layout={words:Word[];lines:Word[][];fontSize:number};
export const Captions=({words,brand,highlight,highlightWords,captionCenterYRatio,appearance:appearanceOverride}:{words:Word[];brand:Brand;highlight:boolean;highlightWords?:string[];captionCenterYRatio?:number;appearance?:NonNullable<Brand['style']>['captionAppearance']})=>{
 const frame=useCurrentFrame(),{fps,width}=useVideoConfig(),a=appearanceOverride??brand.style?.captionAppearance;
 const fontSize=width*(a?.fontSizeRatio??.064),margin=a?.sideMarginRatio??.09,backing=a?.backing??'dark',pad=backing==='dark'?width*.025:0,stroke=width*(a?.strokeWidthRatio??0),family=a?.fontFamily??brand.fontFamily,weight=a?.fontWeight??800;
 const groups=useMemo(()=>{
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('Caption font measurement unavailable');ctx.font=`${weight} ${fontSize}px ${family}`;
  return layoutCaptions(words,{maxWords:a?.wordsPerPhrase??4,maxLines:a?.maxLines??2,maxWidth:width*(1-2*margin)-2*pad,fontSize,gap:.35},(text:string)=>ctx.measureText(text).width+2*stroke+Math.max(0,text.length-1)*width*(a?.letterSpacingRatio??0)) as Layout[];
 },[words,width,margin,pad,fontSize,family,weight,stroke,a?.wordsPerPhrase,a?.maxLines,a?.letterSpacingRatio]);
 const group=groups.find(g=>frame>=Math.ceil(g.words[0].start*fps)&&frame<Math.ceil(g.words[g.words.length-1].end*fps));if(!group)return null;
 const centerY=captionCenterYRatio??a?.centerYRatio;
 const progress=a?.entrance&&a.entrance!=='none'&&a.entranceFrames?interpolate(frame,[Math.ceil(group.words[0].start*fps),Math.ceil(group.words[0].start*fps)+a.entranceFrames],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):1;
 const appearance=highlightWords?{textColor:a?.textColor??'#FFFFFF',highlightColor:a?.highlightColor??brand.accent,backing,...a,highlightWords}:a;
 return <div data-caption-font-size={fontSize} style={{position:'absolute',top:centerY!==undefined?centerY*100+'%':undefined,bottom:centerY===undefined?(a?.bottomRatio??.2)*100+'%':undefined,left:margin*100+'%',right:margin*100+'%',display:'flex',justifyContent:a?.align==='left'?'flex-start':a?.align==='right'?'flex-end':'center',fontFamily:family,fontWeight:weight,fontSize,lineHeight:a?.lineHeight??1.22,letterSpacing:width*(a?.letterSpacingRatio??0),opacity:progress,transform:(centerY!==undefined?'translateY(-50%) ':'')+(a?.entrance==='rise'?'translateY('+((1-progress)*width*.012)+'px)':'')}}>
  <div style={{background:backing==='none'?'transparent':'rgba(0,0,0,.83)',textShadow:backing==='none'?'0 1px 3px rgba(0,0,0,.65)':'none',borderRadius:width*.025,padding:backing==='none'?0:`${width*.015}px ${pad}px`,textAlign:a?.align??'center'}}>
   {group.lines.map((line,i)=><div key={i} style={{whiteSpace:'nowrap'}}>{line.map((w,j)=><span key={j} style={{color:captionWordColor(w.text,activeWord(w,frame,fps),highlight,appearance,brand.accent),WebkitTextStroke:stroke+'px '+(a?.strokeColor??'#111111'),paintOrder:'stroke fill'}}>{j?' ':''}{w.text}</span>)}</div>)}
  </div>
 </div>;
};
