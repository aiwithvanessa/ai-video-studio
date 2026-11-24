// Composition frames, not codec keyframes. Preserve original media until export.
export function sourceSegments(video){
 if(!Number.isFinite(video.inSeconds)||video.inSeconds<0||video.fps!==30||!Number.isInteger(video.durationFrames)||video.durationFrames<1)throw Error('Invalid source timeline metadata');
 const origin=Math.round(video.inSeconds*video.fps);
 if(!video.cleanup)return [{from:0,duration:video.durationFrames,trimBefore:origin,trimAfter:origin+video.durationFrames}];
 const ranges=video.cleanup.keepRanges;let cursor=0,previousEnd=0;
 if(!Array.isArray(ranges)||!ranges.length||ranges.length>40)throw Error('Invalid source timeline');
 const segments=ranges.map(k=>{if(![k.startFrame,k.endFrame,k.outStartFrame].every(Number.isInteger)||k.startFrame<previousEnd||k.endFrame<=k.startFrame||k.endFrame>video.cleanup.originalSectionFrames||k.outStartFrame!==cursor)throw Error('Source ranges must be ordered, bounded and contiguous in output');const duration=k.endFrame-k.startFrame;const s={from:cursor,duration,trimBefore:origin+k.startFrame,trimAfter:origin+k.endFrame};cursor+=duration;previousEnd=k.endFrame;return s;});
 if(cursor!==video.durationFrames)throw Error('Source timeline duration mismatch');return segments;
}
