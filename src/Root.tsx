import {AbsoluteFill,Composition} from 'remotion';
import registry from './studio.json';
import type {Project} from './types';
import {BrandPreview} from './compositions/BrandPreview';
import {EditedVideo} from './compositions/EditedVideo';
const project=registry as Project;
// Neutral readiness screen, not an edited video or copied template asset.
const Ready=()=> <AbsoluteFill style={{background:'#111111',color:'#ffffff',justifyContent:'center',alignItems:'center',fontFamily:'Arial, sans-serif',padding:80,textAlign:'center'}}><h1 style={{fontSize:90}}>Your studio is ready</h1><p style={{fontSize:44}}>Finish brand onboarding, then supply a short clip.</p></AbsoluteFill>;
export const Root=()=> <><Composition id="StarterReady" component={Ready} width={1080} height={1920} fps={30} durationInFrames={60}/><Composition id="BrandPreview" component={BrandPreview} defaultProps={{brand:project.brand}} width={1080} height={1920} fps={30} durationInFrames={240}/>{Object.values(project.videos).map(video=><Composition key={video.id} id={`Video-${video.id}`} component={EditedVideo} defaultProps={{video,brand:project.brand}} width={video.width} height={video.height} fps={video.fps} durationInFrames={video.durationFrames}/>)}</>;
