import {AbsoluteFill,interpolate,useCurrentFrame} from 'remotion';
import type {Brand} from '../types';
import {Captions} from './Captions';

// Original, asset-free brand demonstration. Not simulated footage or subject masking.
export const EditorialStylePreview=({brand}:{brand:Brand})=>{
 const f=useCurrentFrame(),second=f>=120,start=second?120:40;
 const enter=interpolate(f,[start,start+12],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const fade=interpolate(f,[222,239],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 return <AbsoluteFill style={{background:'linear-gradient(150deg,#B7BCB6,#8C9A99 55%,#CAC8BE)',color:brand.text,fontFamily:brand.fontFamily,padding:90}}>
  <div style={{fontFamily:'Arial, sans-serif',fontSize:25,color:brand.primary}}>PROPOSED OVERLAYS · FOOTAGE PLACEHOLDER</div>
  <div style={{fontSize:52,marginTop:35,overflowWrap:'anywhere'}}>{brand.name==='My video'?'Your visual style':brand.name}</div>
  <div style={{opacity:fade}}>
   <div style={{position:'absolute',top:330,right:70,fontSize:460,lineHeight:1,color:second?(brand.secondary??brand.accent):brand.accent,opacity:.8}}>{second?'02':'01'}</div>
   <div style={{position:'absolute',top:850,left:90,right:90,fontSize:94,lineHeight:1.08,textShadow:'0 2px 5px #0007',opacity:enter,transform:`translateY(${(1-enter)*22}px)`}}>{second?<>Give ideas<br/>room to breathe.</>:<>Make your<br/>message clear.</>}</div>
   <Captions brand={brand} highlight={brand.style?.captionMode==='highlight'} words={[{text:'Make',start:1.5,end:1.9},{text:'your',start:1.9,end:2.2},{text:'message',start:2.2,end:2.8},{text:'clear.',start:2.8,end:3.3},{text:'Give',start:4.5,end:4.9},{text:'ideas',start:4.9,end:5.5},{text:'room',start:5.5,end:5.9},{text:'to',start:5.9,end:6.1},{text:'breathe.',start:6.1,end:6.8}]}/>
  </div>
  <div style={{position:'absolute',bottom:80,left:90,right:90,fontFamily:'Arial, sans-serif',fontSize:27,lineHeight:1.4}}>Your video will be the background · silent sample<br/>Footage framing and audio mix need a real draft.</div>
 </AbsoluteFill>;
};
