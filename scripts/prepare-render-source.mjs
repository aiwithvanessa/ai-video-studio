// Explicit decoder compatibility recovery. Original source/transcript binding stays intact.
import {existsSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {readProject,writeProject,fileHash,localAsset,run,probe,videoMetadata} from './editor.mjs';
import {loadState,saveState,revise} from './studio-state.mjs';
export function prepareRenderSource(id){
 const p=readProject(),v=p.videos[id];if(!v)throw Error('Intake a video first');
 const original=localAsset(v.source,`videos/${id}`);if(fileHash(original)!==v.sourceSha256)throw Error('Original changed');
 const asset=`videos/${id}/generated/render-source/${v.sourceSha256.slice(0,16)}-h264-gop5.mp4`,out=resolve('public',asset);
 mkdirSync(dirname(out),{recursive:true});
 if(!existsSync(out))run('ffmpeg',['-v','error','-n','-i',original,'-map','0:v:0','-map','0:a:0?','-c:v','libx264','-preset','veryfast','-crf','18','-g','5','-keyint_min','5','-bf','0','-threads','1','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',out]);
 const a=probe(original),b=probe(out),am=videoMetadata(a,v.inSeconds,v.durationFrames/v.fps),bm=videoMetadata(b,v.inSeconds,v.durationFrames/v.fps);
 if(JSON.stringify(am)!==JSON.stringify(bm)||Math.abs(Number(a.format.duration)-Number(b.format.duration))>1/v.fps)throw Error('Render copy metadata differs; preserve and inspect');
 const audioHash=file=>run('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-vn','-f','hash','-hash','sha256','-']).stdout.trim();
 if(a.streams.some(s=>s.codec_type==='audio')&&audioHash(original)!==audioHash(out))throw Error('Decoded audio differs; do not use render copy');
 v.renderSource=asset;v.renderSourceSha256=fileHash(out);writeProject(p);const s=loadState(process.cwd());revise(s,id);saveState(process.cwd(),s);
 console.log('Render-friendly H.264 copy verified; dimensions/section and decoded audio match. Original and transcript unchanged. '+out);
}
