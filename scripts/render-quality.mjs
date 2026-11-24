export const qualityArgs=['--crf=16','--x264-preset=medium','--audio-bitrate=320k'];
export function sourceQualityReport(info,video){
 const stream=info.streams.find(s=>s.codec_type==='video');if(!stream)throw Error('Source video stream missing');
 if(['smpte2084','arib-std-b67'].includes(stream.color_transfer))throw Error('HDR source detected. HDR-to-SDR colour handling needs explicit implementation and review; no silent bt709 conversion. Preserve the original.');
 const warnings=[];if(Math.min(stream.width,stream.height)<720)warnings.push('Low-resolution source: preserve native detail; obtain the original camera file if a higher-resolution version exists. Upscaling cannot recover detail.');
 const rate=(stream.avg_frame_rate&&stream.avg_frame_rate!=='0/0'?stream.avg_frame_rate:stream.r_frame_rate??'0/1').split('/').map(Number),sourceFps=rate[0]/rate[1];if(Number.isFinite(sourceFps)&&Math.abs(sourceFps-video.fps)>.05)warnings.push(`Source is about ${sourceFps.toFixed(3)}fps; this studio outputs ${video.fps}fps. Frame conversion can change motion cadence.`);
 if(video.effects.some(e=>e.kind==='zoom'&&e.amount>0||e.kind==='pan'))warnings.push('Zoom/pan enlarges footage and may soften it. Inspect face detail at output size.');
 const max=Math.max(stream.width,stream.height),min=Math.min(stream.width,stream.height);if(Math.max(video.width,video.height)>max||Math.min(video.width,video.height)>min)warnings.push('Output exceeds source dimensions; do not describe upscaling as restored detail.');
 if(!video.cleanup&&video.renderSource)warnings.push('Compatibility transcode selected: an extra encoding generation remains. Use only for a demonstrated decoder failure.');
 return {profile:'h264-crf16-medium-png-bt709',source:{width:stream.width,height:stream.height,codec:stream.codec_name,pixelFormat:stream.pix_fmt,colorTransfer:stream.color_transfer??'unspecified',fps:stream.avg_frame_rate??stream.r_frame_rate},output:{width:video.width,height:video.height,fps:video.fps},footagePath:video.cleanup||!video.renderSource?'original-source':'compatibility-copy',warnings,limits:'Lossy MP4 export; not a zero-loss or restored-detail guarantee.'};
}
