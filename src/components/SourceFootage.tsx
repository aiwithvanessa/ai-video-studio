import {Video as MediaVideo} from '@remotion/media';
import {Sequence,staticFile} from 'remotion';
import type {Video} from '../types';
import {sourceSegments} from '../lib/source-timeline.mjs';
export const SourceFootage=({video}:{video:Video})=>{
 // Cleanup always references the original, including legacy plans with an edited MP4.
 const asset=video.cleanup?video.source:(video.renderSource??video.source);
 return <>{sourceSegments(video).map((segment:{from:number;duration:number;trimBefore:number;trimAfter:number})=><Sequence key={segment.from} from={segment.from} durationInFrames={segment.duration} layout="none"><MediaVideo src={staticFile(asset)} trimBefore={segment.trimBefore} durationInFrames={segment.duration} onError={()=>'fail'} volume={1} objectFit="contain" style={{width:'100%',height:'100%'}}/></Sequence>)}</>;
};
