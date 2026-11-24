import {qualityArgs,sourceQualityReport} from './render-quality.mjs';
import {sourceSegments} from '../src/lib/source-timeline.mjs';
import {keepRangesFromCuts} from '../src/lib/cleanup.mjs';
import {useProjectTemp} from './project-temp.mjs';
import {existsSync,readFileSync,writeFileSync,mkdirSync,appendFileSync,readdirSync,openSync,readSync,closeSync,copyFileSync,realpathSync} from 'node:fs';
import {resolve,relative,dirname,sep,extname} from 'node:path';
import {spawnSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createServer,createConnection} from 'node:net';
import {loadState,saveState,ensureVideo,revise} from './studio-state.mjs';
import {validateCaptionAppearance} from '../src/lib/caption-appearance.mjs';
import {validateTranscript} from '../src/lib/timing.mjs';
import {requireAlignedSpeech} from '../src/lib/speech-quality.mjs';
export const defaultProject=()=>({brand:{name:'My video',audience:'General audience',tone:'Clear and friendly',primary:'#17212B',accent:'#68B5AB',text:'#FFFFFF',fontFamily:'Arial, sans-serif'},videos:{}});
export const readProject=()=>JSON.parse(readFileSync('src/studio.json','utf8'));
export const writeProject=p=>writeFileSync('src/studio.json',JSON.stringify(p,null,2)+'\n');
export const digest=value=>createHash('sha256').update(typeof value==='string'?value:JSON.stringify(value)).digest('hex');
export function fileHash(file){const hash=createHash('sha256'),fd=openSync(file,'r'),buffer=Buffer.alloc(65536);try{let n;while((n=readSync(fd,buffer,0,buffer.length,null)))hash.update(buffer.subarray(0,n));}finally{closeSync(fd);}return hash.digest('hex');}
export const brandFingerprint=brand=>brand.logo?digest({brand,logoHash:fileHash(localAsset(brand.logo,'shared/brand'))}):digest(brand);
export function run(exe,args,options={}){const r=spawnSync(exe,args,{encoding:'utf8',maxBuffer:64*1024*1024,...options});if(r.error)throw Error(`${exe} unavailable or inaccessible: ${r.error.message}`);if(r.status!==0)throw Error(`${exe} failed (${r.status}): ${r.stderr||r.stdout||'See command output above'}`);return r;}
export const probe=file=>JSON.parse(run('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file]).stdout);
export function localAsset(file,prefix){const full=resolve('public',file),base=resolve('public',prefix);if(!full.startsWith(base+sep))throw Error('Asset must belong to '+prefix);if(!existsSync(full))throw Error('Missing local asset: '+file);const expected=resolve(realpathSync(process.cwd()),'public',prefix);if(realpathSync(base)!==expected||!realpathSync(full).startsWith(expected+sep))throw Error('Asset redirects outside its video/shared folder');return full;}
export function videoMetadata(info,inSeconds=0,length=15){
 inSeconds=Math.round(inSeconds*30)/30;
 const stream=info.streams.find(s=>s.codec_type==='video');if(!stream)throw Error('No video stream');
 const duration=Number(stream.duration??info.format.duration);if(!Number.isFinite(duration)||inSeconds<0||inSeconds>=duration||!Number.isFinite(length)||length<=0)throw Error('Invalid source duration or section');
 const frames=Math.floor(Math.min(length,duration-inSeconds)*30+1e-7);if(frames<1)throw Error('Section is shorter than one frame');
 const sar=(stream.sample_aspect_ratio??'1:1').split(':').map(Number);let w=stream.width*(sar[0]>0&&sar[1]>0?sar[0]/sar[1]:1),h=stream.height;
 const rotation=Number(stream.side_data_list?.find(x=>Number.isFinite(x.rotation))?.rotation??stream.tags?.rotate??0);if(Math.abs(rotation)%180===90)[w,h]=[h,w];
 const maxW=w<=h?1080:1920,maxH=w<=h?1920:1080,scale=Math.min(1,maxW/w,maxH/h);
 return {width:Math.max(2,Math.floor(w*scale/2)*2),height:Math.max(2,Math.floor(h*scale/2)*2),fps:30,durationFrames:frames,inSeconds};
}
export function fingerprint(project,video){
 const code=[];const walk=folder=>{for(const entry of readdirSync(folder,{withFileTypes:true})){const path=resolve(folder,entry.name);if(entry.isDirectory())walk(path);else if(entry.name!=='studio.json')code.push([relative('src',path),fileHash(path)]);}};walk('src');
 const assets=[video.source,...(video.cleanup?[...(video.cleanup.editedSource?[video.cleanup.editedSource]:[]),video.cleanup.planFile,video.cleanup.sourceTranscriptFile]:[]),...(video.renderSource?[video.renderSource]:[]),...video.graphics.filter(g=>g.asset).map(g=>g.asset),...video.sounds.map(s=>'audio/starter-pack/'+s.filename),...(project.brand.logo?[project.brand.logo]:[]),...(video.transcriptFile?[video.transcriptFile]:[])];
 return digest({brand:project.brand,video,code,qualityArgs,assets:assets.map(p=>[p,fileHash(resolve('public',p))])});
}
function options(args){const out={_:[]};for(let i=0;i<args.length;i++){if(args[i].startsWith('--')){const name=args[i].slice(2);if(args[i+1]===undefined||args[i+1].startsWith('--'))throw Error('Value required for --'+name);out[name]=args[++i];}else out._.push(args[i]);}return out;}
const bool=v=>{if(!['true','false'].includes(v))throw Error('Use true or false');return v==='true';};
const number=v=>{const n=Number(v);if(!Number.isFinite(n))throw Error('Expected finite number');return n;};
export function selectBundledSound(filename,volume){
 const catalogue=JSON.parse(readFileSync('public/audio/starter-pack/catalogue.json','utf8'));
 const asset=catalogue.assets.find(a=>a.filename===filename);
 if(!asset?.redistribution?.verified||!asset?.soundApproval?.approved)throw Error('Sound is not a verified/approved starter asset');
 if(!/^[a-zA-Z0-9][a-zA-Z0-9 _.-]*\.(wav|mp3|ogg)$/i.test(filename)||fileHash(resolve('public/audio/starter-pack',filename))!==asset.fileSha256)throw Error('Starter asset path/hash does not match approval');
 const gain=number(volume??String(asset.recommendedVolume??.1));if(gain<0||gain>.3)throw Error('Sound volume must be between 0 and 0.3; review the real mix');
 return {filename,volume:gain};
}
function brief(id,note){appendFileSync(`docs/briefs/${id}.local.md`,`\n- ${new Date().toISOString()}: ${note}\n`);}
function recordBrandChoices(brand,website){
 const file='brand/BRAND.md',start='<!-- studio-brand-choices:start -->',end='<!-- studio-brand-choices:end -->';
 let doc=readFileSync(file,'utf8');website??=/User-supplied website: (https?:\/\/[^\s]+)/.exec(doc)?.[1];const old=doc.indexOf(start),finish=doc.indexOf(end);
 if(old>=0&&finish>=old)doc=doc.slice(0,old)+doc.slice(finish+end.length);
 const block=`${start}\n## Current configured brand\n\nThese are configured choices, not automatic approval. Consult local state and recorded user approval.\n\n\`\`\`json\n${JSON.stringify(brand,null,2)}\n\`\`\`\n${website?`\nUser-supplied website: ${website}\n`:''}${end}\n`;
 writeFileSync(file,doc.trimEnd()+'\n\n'+block);
}
export function validateVideo(v){
 const duration=v.durationFrames/v.fps;sourceSegments(v);
 if(!Number.isInteger(v.durationFrames)||v.durationFrames<1||v.fps!==30||v.width%2||v.height%2)throw Error('Invalid video metadata');
 if(fileHash(localAsset(v.source,`videos/${v.id}`))!==v.sourceSha256)throw Error('Source changed since intake; inspect and intake again');
 if(v.cleanup){const c=v.cleanup;for(const [asset,hash] of [...(c.editedSource?[[c.editedSource,c.editedSourceSha256]]:[]),[c.planFile,c.planSha256],[c.sourceTranscriptFile,c.sourceTranscriptSha256]])if(fileHash(localAsset(asset,`videos/${v.id}`))!==hash)throw Error('Cleanup media/plan/original transcript changed; restore/review before rendering');const plan=JSON.parse(readFileSync(localAsset(c.planFile,`videos/${v.id}`)));if(JSON.stringify(keepRangesFromCuts(plan.cuts,c.originalSectionFrames))!==JSON.stringify(c.keepRanges))throw Error('Cleanup ranges differ from the bound cut plan');if(c.keepRanges.reduce((n,k)=>n+k.endFrame-k.startFrame,0)!==v.durationFrames)throw Error('Cleanup duration mismatch');}
 if(v.renderSource&&fileHash(localAsset(v.renderSource,`videos/${v.id}`))!==v.renderSourceSha256)throw Error('Render copy changed');
 if(v.captions){const result=validateTranscript({schemaVersion:1,words:v.words},duration);if(!result.valid)throw Error('Invalid caption timing: '+result.errors.join('; '));if(v.transcriptFile){const source=JSON.parse(readFileSync(localAsset(v.transcriptFile,`videos/${v.id}`),'utf8'));if(digest(source.words)!==digest(v.words))throw Error('Transcript changed; reimport it before rendering captions');}}
 for(const item of [...v.effects,...v.graphics])if(!Number.isFinite(item.start)||!Number.isFinite(item.end)||item.start<0||item.end<=item.start||item.end>duration)throw Error('Graphic/effect outside video duration');
 for(const list of [v.effects,v.graphics,v.sounds])if(new Set(list.map(x=>x.id)).size!==list.length)throw Error('Give each graphic/effect/sound a unique ID');
 for(const g of v.graphics){if(!['title','callout','steps','screenshot'].includes(g.kind))throw Error('Unknown graphic kind');if(g.kind==='screenshot'&&!g.asset)throw Error('Real screenshot asset required');if(g.asset)localAsset(g.asset,`videos/${v.id}`);if(g.text.length>180)throw Error('Shorten graphic text for readability');}
 for(const e of v.effects){if(!['zoom','pan','fade'].includes(e.kind)||!Number.isFinite(e.amount))throw Error('Invalid effect');if(e.kind==='zoom'&&(e.amount<0||e.amount>.12))throw Error('Zoom must be restrained (0–0.12)');if(e.kind==='pan'&&Math.abs(e.amount)>15)throw Error('Pan limited to 15px');}
 const catalogue=JSON.parse(readFileSync('public/audio/starter-pack/catalogue.json','utf8'));
 for(const s of v.sounds){const a=catalogue.assets.find(x=>x.filename===s.filename);if(!a?.redistribution?.verified||!a?.soundApproval?.approved)throw Error('Sound is not a verified/approved starter asset');if(fileHash(resolve('public/audio/starter-pack',s.filename))!==a.fileSha256)throw Error('Starter sound hash changed');if(!Number.isFinite(s.start)||s.start<0||s.start>=duration||!Number.isFinite(s.volume)||s.volume<0||s.volume>.3)throw Error('Sound position/level invalid');}
}
export function assertExportApproval(project,state,video){
 if(state.style?.status!=='complete'||state.brand.status!=='complete'||state.brand.previewHash!==brandFingerprint(project.brand))throw Error('Current brand proposal has not been approved');
 const record=state.videos[video.id];if(record?.approvedRevision!==record?.revision||!record?.approvalNote||record.approvedFingerprint!==fingerprint(project,video))throw Error('Current video is not approved, or files changed since approval. Review this draft first.');
}
export async function renderVideo(id,{draft=true}={}){
 const p=readProject(),s=loadState(process.cwd()),v=p.videos[id];if(!v)throw Error('Unknown video');validateVideo(v);
 if(draft&&s.videos[id]?.requiresEditBrief&&!s.videos[id]?.editBrief)throw Error('Before the first draft, ask for an optional opening hook, target length and editing instructions (or sensible defaults), then save studio brief. Do not ask again if conversation already contains the answer.');
 if(!draft)assertExportApproval(p,s,v);
 if(v.captions){if(!v.transcriptFile)throw Error('Captioned drafts require a bound acoustic transcript; run prepare-speech');const transcript=JSON.parse(readFileSync(localAsset(v.transcriptFile,`videos/${v.id}`),'utf8'));requireAlignedSpeech(transcript,v.durationFrames/v.fps);}
 const {requireTakeReview}=await import('./take-review.mjs');requireTakeReview(v,s);
 const quality=sourceQualityReport(probe(localAsset(v.source,`videos/${v.id}`)),v);for(const warning of quality.warnings)console.warn('Quality warning: '+warning);
 useProjectTemp();
 const version=s.videos[id]?.revision??1,out=`out/${id}/${draft?'draft':'final'}-v${version}.mp4`;mkdirSync(dirname(out),{recursive:true});if(existsSync(out))throw Error('Output exists; preserve it and revise before rendering another version: '+out);
 run(process.execPath,['node_modules/@remotion/cli/remotion-cli.js','render','src/index.ts',`Video-${id}`,out,'--codec=h264',...qualityArgs,'--pixel-format=yuv420p','--image-format=png','--color-space=bt709','--concurrency=1','--offthreadvideo-video-threads=1','--offthreadvideo-cache-size-in-bytes=134217728'],{stdio:'inherit'});
 const metadata=probe(out);writeFileSync(out+'.ffprobe.json',JSON.stringify(metadata,null,2));writeFileSync(out+'.quality.json',JSON.stringify(quality,null,2));
 const stream=metadata.streams.find(x=>x.codec_type==='video');const rate=stream.r_frame_rate.split('/').map(Number);
 if(stream.codec_name!=='h264'||stream.pix_fmt!=='yuv420p'||stream.width!==v.width||stream.height!==v.height||rate[0]/rate[1]!==v.fps||Math.abs(Number(stream.duration)-v.durationFrames/v.fps)>1/v.fps)throw Error('Rendered metadata did not match required output; preserve file and inspect its ffprobe report');
 if(probe(resolve('public',v.source)).streams.some(x=>x.codec_type==='audio')&&!metadata.streams.some(x=>x.codec_type==='audio'))throw Error('Expected source audio is absent from rendered file');
 s.videos[id].draftRevision=s.videos[id].revision;s.videos[id].draftPath=out;saveState(process.cwd(),s);console.log(resolve(out));return out;
}
async function preview(composition){
 useProjectTemp();
 // Remotion 4.0.542 uses this same endpoint to detect an existing Studio's project.
 const normalize=path=>path.replaceAll('\\','/').toLowerCase();
 const owned=async port=>{try{const r=await fetch(`http://127.0.0.1:${port}/__remotion_config`,{signal:AbortSignal.timeout(1000),cache:'no-store'});if(!r.ok)return false;const value=await r.json();return value.isRemotion===true&&typeof value.cwd==='string'&&normalize(value.cwd)===normalize(realpathSync(process.cwd()));}catch{return false;}};
 const available=async(port,host)=>await new Promise(res=>{const server=createServer();server.once('error',error=>res(error.code==='EAFNOSUPPORT'||error.code==='EADDRNOTAVAIL'));server.listen(port,host,()=>server.close(()=>res(true)));});
 const connected=async(port,host)=>await new Promise(res=>{const socket=createConnection({port,host});const done=value=>{socket.destroy();res(value);};socket.setTimeout(300);socket.once('connect',()=>done(true));socket.once('error',()=>done(false));socket.once('timeout',()=>done(false));});
 let port=3210;for(;port<3240;port++){
  const occupied=await connected(port,'127.0.0.1')||await connected(port,'::1');
  const free=!occupied&&await available(port,'127.0.0.1')&&await available(port,'::1');
  if(free)break;
  if(await owned(port)){const url=`http://127.0.0.1:${port}/${composition}`;const r=await fetch(url,{signal:AbortSignal.timeout(1000)});if(r.ok){await r.body.cancel();console.log(`Verified existing preview for this project: ${url}\nRestart here: node scripts/studio.mjs preview ${composition}`);return;}}
 }if(port===3240)throw Error('No free local preview port; unrelated Studio instances were not reused');
 const child=spawn(process.execPath,['node_modules/@remotion/cli/remotion-cli.js','studio','src/index.ts','--port='+port,'--no-open'],{stdio:'inherit'});
 const url=`http://127.0.0.1:${port}/${composition}`;let ready=false;
 for(let i=0;i<90;i++){if(child.exitCode!==null)throw Error('Studio exited before its project-owned preview became ready; inspect a port collision');await new Promise(res=>setTimeout(res,1000));try{const response=await fetch(url,{signal:AbortSignal.timeout(1000)});if(response.ok&&await owned(port)){await response.body.cancel();ready=true;break;}await response.body.cancel();}catch{}}
 if(!ready){child.kill();throw Error('Preview did not respond; inspect Studio output');}
 console.log(`Working preview: ${url}\nRestart from ${process.cwd()}: node scripts/studio.mjs preview ${composition}\nKeep this terminal running; Ctrl+C stops Studio.`);
 await new Promise(resolve=>child.on('exit',resolve));
}
export async function runEditor(command,args){
 const o=options(args),p=readProject(),s=loadState(process.cwd()),id=o._[0]??s.activeVideo;
 if(command==='take-review'){const {takeReview}=await import('./take-review.mjs');takeReview(id,o.file);return;}
 if(command==='prepare-render-source'){const {prepareRenderSource}=await import('./prepare-render-source.mjs');prepareRenderSource(id);return;}
 if(command==='sounds'){const catalogue=JSON.parse(readFileSync('public/audio/starter-pack/catalogue.json','utf8'));console.table(catalogue.assets.map(a=>({...selectBundledSound(a.filename),creator:a.creator,intendedUse:a.intendedUse,licence:a.licence})));console.log('Bundled locally; no download/cataloguing required. Optional cues only; gain is a starting suggestion, not a finished speech mix.');return;}
 if(['cleanup-analyze','cleanup-apply','cleanup-restore'].includes(command)){const c=await import('./cleanup.mjs');if(command==='cleanup-analyze')c.analyzeCleanup(id);else if(command==='cleanup-apply')c.applyCleanup(id,o.file);else c.restoreCleanup(id);return;}
 if(command==='transcribe'){const {transcribe}=await import('./transcribe.mjs');await transcribe(id,o.language??'auto',o.timing??'words',{model:o.model,dtw:o.dtw==='true'});return;}
 if(command==='reference-intake'){
  for(const folder of ['public/shared/brand','public/shared/references'])mkdirSync(folder,{recursive:true});
  s.style??={status:'pending',identityApproval:s.brand.evidence??null};saveState(process.cwd(),s);
  console.log('Optional brand materials: '+resolve('public/shared/brand')+'\nOptional 1–3 reference videos: '+resolve('public/shared/references'));return;
 }
 if(command==='style-plan'){
  if(!o.file)throw Error('Supply a local analysis JSON file');const plan=JSON.parse(readFileSync(o.file,'utf8'));
  if(!['supplied','declined'].includes(plan.referencesChoice))throw Error('Record the user reference choice: supplied or declined');
  if(!Array.isArray(plan.references)||plan.references.length>3||(plan.referencesChoice==='supplied'&&!plan.references.length))throw Error('Supply 1–3 reference records, or explicitly decline');
  const fields=['captions','framing','graphics','pacing','transitions','sound'];
  for(const ref of plan.references){localAsset(ref.asset,'shared/references');if(typeof ref.userLikes!=='string'||!ref.userLikes.trim())throw Error('Record preferences or that the user wants help identifying style');for(const key of fields){const item=ref.analysis?.[key];if(!item||!['observed','unassessed'].includes(item.status)||!item.notes?.trim())throw Error('Separate observed/unassessed evidence for '+key);}ref.sha256=fileHash(localAsset(ref.asset,'shared/references'));}
  for(const key of fields)if(typeof plan.direction?.[key]!=='string'||!plan.direction[key].trim())throw Error('Missing proposed direction: '+key);
  if(!['plain','highlight'].includes(plan.captionMode))throw Error('Choose plain or highlight captions');
  validateCaptionAppearance(plan.captionAppearance);
  if(plan.referencesChoice==='supplied'){
   const m=plan.referenceMatch,a=plan.captionAppearance;
   if(!m||!plan.references.some(r=>r.asset===m.referenceAsset))throw Error('A supplied reference needs referenceMatch bound to its asset, not the generic preview');
   if(!['presenter','stacked','graphic'].includes(m.previewLayout)||typeof m.headingFontFamily!=='string'||!m.headingFontFamily.trim()||!Number.isFinite(m.headingWeight)||m.headingWeight<100||m.headingWeight>900||!Number.isFinite(m.headingSizeRatio)||m.headingSizeRatio<.02||m.headingSizeRatio>.12||!Array.isArray(m.deviations)||m.deviations.some(d=>typeof d!=='string'||!d.trim()))throw Error('Invalid reference-match layout/heading/deviation settings');
   for(const [key,min,max] of [['headingTopRatio',0,.4],['splitRatio',.3,.7],['gridSizeRatio',.01,.1]])if(m[key]!==undefined&&(!Number.isFinite(m[key])||m[key]<min||m[key]>max))throw Error('Invalid reference-match '+key);
   if(m.headingBacking!==undefined&&!['none','brand'].includes(m.headingBacking))throw Error('Invalid heading backing');
   if(m.graphicBackground!==undefined&&!/^#[a-f\d]{6}$/i.test(m.graphicBackground))throw Error('Invalid reference-match graphic background');
   if(m.previewScenes!==undefined){if(!Array.isArray(m.previewScenes)||!m.previewScenes.length)throw Error('Preview scenes required');let end=0;for(const scene of m.previewScenes){if(!Number.isFinite(scene.start)||!Number.isFinite(scene.end)||scene.start<end||scene.end<=scene.start||scene.end>8||!['presenter','stacked','graphic'].includes(scene.layout)||!Number.isFinite(scene.captionCenterYRatio)||scene.captionCenterYRatio<.1||scene.captionCenterYRatio>.9)throw Error('Invalid/overlapping preview scene or caption position');end=scene.end;}}
   if(a?.bottomRatio===undefined&&a?.centerYRatio===undefined)throw Error('Measure caption position');
   for(const key of ['fontFamily','fontWeight','fontSizeRatio','strokeWidthRatio','wordsPerPhrase','maxLines'])if(a?.[key]===undefined)throw Error('Measure or explicitly approximate caption '+key+' before preparing the reference preview');
  }
  s.style={...s.style,status:'in-progress',plan,identityApproval:s.style?.identityApproval??s.brand.evidence??null};
  p.brand.style={...plan.direction,captionMode:plan.captionMode,...(plan.referenceMatch?{referenceMatch:plan.referenceMatch}:{}),...(plan.captionAppearance?{captionAppearance:plan.captionAppearance}:{})};writeProject(p);recordBrandChoices(p.brand,o.website);s.style.proposalHash=brandFingerprint(p.brand);
  for(const key of Object.keys(s.videos))revise(s,key);saveState(process.cwd(),s);console.log('Style proposal saved; review BrandPreview motion and plain-language direction before approval.');return;
 }
 if(command==='brand'){
  const old=digest(p.brand);for(const key of ['name','audience','tone','primary','secondary','accent','text','fontFamily'])if(o[key]!==undefined)p.brand[key]=o[key];
  if(o.logo!==undefined){if(o.logo==='none')delete p.brand.logo;else{localAsset(o.logo,'shared/brand');p.brand.logo=o.logo;}}
  for(const key of ['primary',...(p.brand.secondary?['secondary']:[]),'accent','text'])if(!/^#[a-f\d]{6}$/i.test(p.brand[key]))throw Error('Use six-digit hex colours');
  for(const key of ['name','audience','tone','fontFamily'])if(!p.brand[key].trim()||p.brand[key].length>100)throw Error('Keep brand fields between 1 and 100 characters');
  if(old!==digest(p.brand)){s.brand={status:'in-progress',evidence:null};for(const key of Object.keys(s.videos))revise(s,key);}
  writeProject(p);recordBrandChoices(p.brand,o.website);saveState(process.cwd(),s);console.log('BrandPreview and saved brand choices updated. Show the preview before asking approval.');return;
 }
 if(command==='approve-brand'){
  if(s.style?.status!=='in-progress'||s.style.proposalHash!==brandFingerprint(p.brand))throw Error('Offer optional materials/references, save style-plan and review the current motion preview before approval');if(!o.note?.trim())throw Error('Actual user approval note required');s.style={...s.style,status:'complete',approval:o.note,approvedAt:new Date().toISOString()};s.brand={status:'complete',evidence:o.note,previewHash:brandFingerprint(p.brand),approvedAt:new Date().toISOString()};saveState(process.cwd(),s);appendFileSync('brand/BRAND.md',`\nApproved choices: ${JSON.stringify(p.brand)}\nApproval: ${o.note}\n`);console.log('Style approved. Next: invite the user to attach their first video here, or continue to the edit brief if footage is already supplied.');return;
 }
 if(command==='preview'){const composition=o._[0]??(s.activeVideo?`Video-${s.activeVideo}`:'BrandPreview');if(!['StarterReady','BrandPreview',...Object.keys(p.videos).map(key=>`Video-${key}`)].includes(composition))throw Error('Unknown preview composition');await preview(composition);return;}
 if(!id)throw Error('Choose a video or create one first');
 if(command==='intake'){
  ensureVideo(process.cwd(),s,id);const source=o.source;if(!source)throw Error('Supply --source as public-relative path');const file=localAsset(source,`videos/${id}`);
  const sourceInfo=probe(file),start=number(o.in??'0'),length=o.duration==='full'?Number(sourceInfo.streams.find(x=>x.codec_type==='video')?.duration??sourceInfo.format.duration)-start:number(o.duration??'15');
  const metadata=videoMetadata(sourceInfo,start,length);
  if(p.videos[id])revise(s,id);
  p.videos[id]={id,source,sourceSha256:fileHash(file),...metadata,title:o.title??'',titleSize:p.brand.style?.referenceMatch?.headingSizeRatio??.065,captions:false,highlight:p.brand.style?.captionMode==='highlight',words:[],effects:[],graphics:[],sounds:[]};
  writeProject(p);saveState(process.cwd(),s);brief(id,`Source ${source}; section ${metadata.inSeconds}s, ${metadata.durationFrames}/30 seconds. ${o.note??'Original audio/proportions preserved; no optional effects.'}`);console.log(`Composition Video-${id} registered; ${metadata.width}×${metadata.height}; ${metadata.durationFrames} frames at 30fps.`);return;
 }
 const v=p.videos[id];if(!v)throw Error('Intake this video first');
 if(command==='prepare-speech'){const {prepareSpeech}=await import('./prepare-speech.mjs');await prepareSpeech(id,{setup:o.setup==='true',language:o.language??'en',vocabulary:o.vocabulary,recognitionFile:o['recognition-file']});return;}
 if(command==='brief'){
  if(!o.file)throw Error('Agent supplies a local answer JSON file');const answer=JSON.parse(readFileSync(o.file,'utf8'));
  if(typeof answer.instructions!=='string'||!answer.instructions.trim()||answer.instructions.length>10000)throw Error('Record the actual editing request or explicit sensible-defaults answer');
  if(answer.hook!==undefined&&answer.hook!==null&&typeof answer.hook!=='string')throw Error('Hook must be text or omitted');
  if(answer.targetSeconds!==undefined&&answer.targetSeconds!==null&&(!Number.isFinite(answer.targetSeconds)||answer.targetSeconds<=0))throw Error('Target seconds must be positive or omitted');
  if(answer.cleanup!==undefined&&typeof answer.cleanup!=='boolean')throw Error('Cleanup intent must be true or false');
  if(answer.platform!==undefined&&typeof answer.platform!=='string')throw Error('Platform must be text or omitted');
  const record=s.videos[id];if(record.editBrief&&digest(record.editBrief)!==digest(answer))revise(s,id);
  record.editBrief=answer;saveState(process.cwd(),s);brief(id,'Editing brief from conversation: '+JSON.stringify(answer));console.log('Brief saved. Apply the instructions with existing editing commands, then render the draft.');return;
 }
 if(command==='draft'||command==='export'){await renderVideo(id,{draft:command==='draft'});return;}
 if(command==='approve-video'){
  if(!o.note?.trim())throw Error('Explicit approval note for this actual draft is required');validateVideo(v);const record=s.videos[id];record.approvedRevision=record.revision;record.approvalNote=o.note;record.approvedFingerprint=fingerprint(p,v);saveState(process.cwd(),s);brief(id,`Current draft approved: ${o.note}`);return;
 }
 if(command==='set'){
  if(o.title!==undefined)v.title=o.title;
  if(o['title-size']!==undefined){v.titleSize=number(o['title-size']);if(v.titleSize<.025||v.titleSize>.12)throw Error('Title size must be 0.025–0.12 of frame width');}
  if(o.captions!==undefined)v.captions=bool(o.captions);
  if(o.highlight!==undefined)v.highlight=bool(o.highlight);
  if(o['caption-style-file']){const appearance=JSON.parse(readFileSync(o['caption-style-file'],'utf8'));validateCaptionAppearance(appearance);v.captionAppearance=appearance;}
  if(o['highlight-words']!==undefined)v.captionHighlightWords=o['highlight-words'].split('|').map(w=>w.trim()).filter(Boolean);
  if(o['remove-effect'])v.effects=o['remove-effect']==='all'?[]:v.effects.filter(e=>e.id!==o['remove-effect']);
  if(o['remove-graphic'])v.graphics=v.graphics.filter(e=>e.id!==o['remove-graphic']);
  if(o['remove-sound'])v.sounds=v.sounds.filter(e=>e.id!==o['remove-sound']);
 }else if(command==='effect')v.effects.push({id:o.name??`effect-${v.effects.length+1}`,kind:o.kind??'zoom',start:number(o.start??'0'),end:number(o.end??String(v.durationFrames/30)),amount:number(o.amount??'.05')});
 else if(command==='graphic')v.graphics.push({id:o.name??`graphic-${v.graphics.length+1}`,kind:o.kind??'callout',text:o.text??'',items:o.steps?.split('|'),asset:o.asset,start:number(o.start??'0'),end:number(o.end??String(v.durationFrames/30))});
 else if(command==='sound')v.sounds.push({id:o.name??`sound-${v.sounds.length+1}`,...selectBundledSound(o.file,o.volume),start:number(o.start??'0')});
 else if(command==='transcript'){
  const file=localAsset(o.file,`videos/${id}`),data=JSON.parse(readFileSync(file,'utf8'));
  if(v.cleanup&&data.cleanupPlanSha256!==v.cleanup.planSha256)throw Error('Import the transcript derived from this cleanup timeline, or restore the original first');
  if(data.sourceSha256!==v.sourceSha256||data.sectionStart!==v.inSeconds||Math.abs(data.durationSeconds-v.durationFrames/30)>1e-6)throw Error('Transcript source/section does not match this edit');
  const report=validateTranscript(data,v.durationFrames/30);if(!report.valid)throw Error(report.errors.join('\n'));v.words=data.words;v.captions=true;v.transcriptFile=o.file;if(data.timingGranularity==='phrase'){v.highlight=false;console.log('Native phrase captions: individual word highlighting disabled; no word boundaries invented');}console.log(report.warnings.join('\n')||'Structural timing validation passed; listening review still required');
 }else throw Error('Unknown editor command: '+command);
 validateVideo(v);revise(s,id);s.activeVideo=id;writeProject(p);saveState(process.cwd(),s);brief(id,`${command}: ${o.note??JSON.stringify(o)}; approval cleared.`);console.log(`Video-${id} updated; revision ${s.videos[id].revision}.`);
}
