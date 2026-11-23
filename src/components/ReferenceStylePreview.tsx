import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import type {Brand} from '../types';
import {Captions} from './Captions';

// Original layout demonstration. No reference frames, creator branding or product UI.
export const ReferenceStylePreview=({brand}:{brand:Brand})=>{
 const frame=useCurrentFrame(),{width,fps}=useVideoConfig(),m=brand.style!.referenceMatch!;
 const scene=m.previewScenes?.find(s=>frame>=s.start*fps&&frame<s.end*fps),layout=scene?.layout??m.previewLayout;
 const second=frame>=120,sceneFrame=scene?frame-scene.start*fps:frame%120,enter=interpolate(sceneFrame,[0,12],[0,1],{extrapolateRight:'clamp'});
 const split=m.splitRatio??.5,stacked=layout==='stacked',graphic=layout==='graphic';
 const grid={backgroundColor:m.graphicBackground??'#EAE7DC',backgroundImage:'linear-gradient(#6666660B 1px,transparent 1px),linear-gradient(90deg,#6666660B 1px,transparent 1px)',backgroundSize:width*(m.gridSizeRatio??.025)+'px '+width*(m.gridSizeRatio??.025)+'px'};
 return <AbsoluteFill style={{fontFamily:brand.fontFamily,color:brand.text,background:'#777F82'}}>
  {(!graphic)&&<div key={'footage-'+layout} style={{position:'absolute',top:stacked?split*100+'%':0,bottom:0,left:0,right:0,background:'linear-gradient(125deg,#A6AFAC,#626F73)',display:'flex',alignItems:'center',justifyContent:'center',color:'#FFFFFF',fontSize:width*.027,textAlign:'center'}}>YOUR FOOTAGE HERE<br/>Framing placeholder</div>}
  {(stacked||graphic)&&<div key={'graphic-'+layout} style={{position:'absolute',top:0,left:0,right:0,bottom:stacked?(1-split)*100+'%':0,...grid}}>
   <div style={{position:'absolute',top:((m.headingTopRatio??(stacked ? .16 : .08))/(stacked?split:1))*100+'%',left:'10%',right:'10%',fontFamily:m.headingFontFamily,fontWeight:m.headingWeight,fontSize:width*m.headingSizeRatio,color:brand.primary,background:m.headingBacking==='brand'?brand.text:undefined}}><span style={{color:brand.accent}}>Step {second?'2':'1'}.</span> {second?'Show the detail':'One clear idea'}</div>
   <div style={{position:'absolute',top:graphic?'30%':'55%',left:'12%',right:'12%',display:'flex',gap:width*.06,opacity:enter,transform:'translateY('+((1-enter)*width*.018)+'px)'}}>
    {['Main point',second?'Helpful detail':'Supporting idea'].map((text,i)=><div key={i} style={{flex:1,height:width*.2,background:i?brand.text:(brand.secondary??brand.accent),border:'2px solid #0002',borderRadius:width*.015,boxShadow:'0 8px 20px #0002',color:brand.primary,fontSize:width*.033,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',transform:'rotate('+(i?3:-3)+'deg)'}}>{text}</div>)}
   </div>
  </div>}
  {!stacked&&!graphic&&<div style={{position:'absolute',top:'10%',left:'10%',right:'10%',fontFamily:m.headingFontFamily,fontWeight:m.headingWeight,fontSize:width*m.headingSizeRatio,opacity:enter}}>One clear idea</div>}
  <Captions captionCenterYRatio={scene?.captionCenterYRatio} brand={brand} highlight={brand.style?.captionMode==='highlight'} words={[{text:'Keep',start:.25,end:.8},{text:'it',start:.8,end:1.1},{text:'clear.',start:1.1,end:1.7},{text:'Show',start:2.25,end:2.8},{text:'one',start:2.8,end:3.1},{text:'idea.',start:3.1,end:3.7},{text:'Then',start:4.25,end:4.8},{text:'add',start:4.8,end:5.1},{text:'detail.',start:5.1,end:5.7},{text:'Make',start:6.25,end:6.8},{text:'it',start:6.8,end:7},{text:'readable.',start:7,end:7.7}]}/>
  <div style={{position:'absolute',bottom:'3%',left:'8%',right:'8%',fontFamily:'Arial, sans-serif',fontSize:width*.018,color:graphic?brand.primary:'#FFFFFF'}}>PROPOSED REFERENCE MATCH · silent · original demonstration<br/>Font/motion approximations are listed for review.</div>
 </AbsoluteFill>;
};
