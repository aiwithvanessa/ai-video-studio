import {Video as MediaVideo} from '@remotion/media';
import {AbsoluteFill,Audio,Sequence,staticFile,useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
import type {Brand,Video} from '../types';
import {Effects} from '../components/Effects';
import {Captions} from '../components/Captions';
import {Graphics} from '../components/Graphics';
export const EditedVideo=({video:v,brand}:{video:Video;brand:Brand})=>{
 const f=useCurrentFrame(),{width}=useVideoConfig();
 const referenceTitle=brand.style?.referenceMatch,outlinedTitle=referenceTitle&&referenceTitle.headingBacking!=='brand';
 const titleEnd=Math.min(80,v.durationFrames),ramp=Math.min(8,titleEnd/3);
 const titleOpacity=interpolate(f,[0,ramp,titleEnd-ramp,titleEnd],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{background:'#111',overflow:'hidden'}}><Effects effects={v.effects}><MediaVideo src={staticFile(v.cleanup?.editedSource??v.renderSource??v.source)} trimBefore={v.cleanup?0:Math.round(v.inSeconds*v.fps)} onError={() => 'fail'} volume={1} objectFit="contain" style={{width:'100%',height:'100%'}}/></Effects>
 {v.title&&<div style={{position:'absolute',top:'7%',left:'8%',right:'8%',background:outlinedTitle?'transparent':'#000B',padding:width*.025,borderRadius:16,color:'#fff',fontFamily:referenceTitle?.headingFontFamily??brand.fontFamily,fontSize:width*v.titleSize,fontWeight:referenceTitle?.headingWeight??800,opacity:titleOpacity,overflowWrap:'anywhere',textAlign:outlinedTitle?'center':undefined,WebkitTextStroke:outlinedTitle?`${width*.008}px #171717`:undefined,paintOrder:outlinedTitle?'stroke fill':undefined}}>{v.title}</div>}
 {v.graphics.map(g=><Graphics key={g.id} graphic={g} brand={brand}/>)}
 {v.captions&&<Captions appearance={v.captionAppearance} words={v.words} brand={brand} highlight={v.highlight} highlightWords={v.captionHighlightWords}/>}
 {v.sounds.map(s=><Sequence key={s.id} from={Math.ceil(s.start*v.fps)}><Audio src={staticFile(`audio/starter-pack/${s.filename}`)} volume={s.volume}/></Sequence>)}
 </AbsoluteFill>;
};
