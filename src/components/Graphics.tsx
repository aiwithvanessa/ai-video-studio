import {Img,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import type {Brand,Graphic} from '../types';
export const Graphics=({graphic:g,brand}:{graphic:Graphic;brand:Brand})=>{
 const match=brand.style?.referenceMatch;
 const card=g.kind==='steps'&&match;
 const frame=useCurrentFrame(),{fps,width}=useVideoConfig(),a=g.start*fps,b=g.end*fps;
 if(frame<a||frame>=b)return null;
 const ramp=Math.min(8,(b-a)/2);const p=Math.max(0,Math.min(1,(frame-a)/ramp,(b-frame)/ramp));
 return <div style={{position:'absolute',top:'7%',left:'8%',right:'8%',opacity:p,transform:`translateY(${(1-p)*18}px)`,color:card?brand.primary:brand.text,fontFamily:match?.headingFontFamily??brand.fontFamily}}><div style={{background:card?(match?.graphicBackground??brand.text):match&&match.headingBacking!=='brand'&&g.kind!=='screenshot'?'transparent':brand.primary,padding:width*.025,borderRadius:20,borderLeft:card||!match||match.headingBacking==='brand'?`7px solid ${brand.accent}`:undefined,fontSize:width*(match?.headingSizeRatio??.052),fontWeight:match?.headingWeight??750}}>{g.text}{g.kind==='steps'&&g.items?.length&&<ol style={{fontSize:width*.045,marginBottom:0}}>{g.items.map((s,i)=><li key={i}>{s}</li>)}</ol>}{g.kind==='screenshot'&&g.asset&&<Img src={staticFile(g.asset)} style={{width:'100%',maxHeight:600,objectFit:'contain',marginTop:20}}/>}</div></div>;
};
