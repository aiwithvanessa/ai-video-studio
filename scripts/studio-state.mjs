import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
export const initialState=()=>({schemaVersion:1,setup:{checks:{},complete:false},brand:{status:'pending',evidence:null},activeVideo:null,videos:{}});
export function loadState(root){const p=resolve(root,'.local/studio-state.json');if(!existsSync(p))return initialState();const s=JSON.parse(readFileSync(p,'utf8'));if(s.schemaVersion!==1||!s.setup||!s.brand||!s.videos)throw Error('Unsupported/invalid studio state; preserve it and inspect before repair.');return s;}
export function saveState(root,state){const p=resolve(root,'.local/studio-state.json');mkdirSync(dirname(p),{recursive:true});writeFileSync(p,JSON.stringify(state,null,2)+'\n');}
export function recognize(text){
 const t=text.toLowerCase();
 if(/\b(brand|onboarding)\b/.test(t))return 'brand';
 if(/\b(setup|set up|resume setup)\b/.test(t))return 'setup';
 if(/\b(export|render|mp4)\b/.test(t))return 'export';
 if(/\b(cleanup|clean up|bad takes|retakes|false starts)\b/.test(t))return 'edit';
 if(/\b(revise|revision|change|adjust|remove|shorter|smaller|bigger)\b/.test(t))return 'revision';
 if(/\b(brand|onboarding|colou?r|font)\b/.test(t))return 'brand';
 if(/\b(edit|video|clip)\b/.test(t))return 'edit';
 if(/\b(setup|set up|start|resume|install)\b/.test(t))return 'setup';
 return 'clarify';
}
export function nextStep(state,intent,root){
 if(!['setup','brand','edit','revision','export','clarify'].includes(intent))throw Error('Unknown intent');
 if(intent==='clarify')return 'clarify';
 const required=['node','npm','dependencies','ffmpeg','ffprobe'];
 if(!state.setup.complete||required.some(k=>!state.setup.checks[k]?.passed)||!existsSync(resolve(root,'node_modules/remotion/package.json')))return 'setup';
 if(state.style?.status!=='complete'||state.brand.status!=='complete'||!state.brand.evidence||!existsSync(resolve(root,'brand/BRAND.md')))return 'brand';
 if(intent==='setup'||intent==='brand')return state.activeVideo?'edit':'footage';
 const v=state.videos[state.activeVideo];
 if(intent==='export')return v&&v.approvedRevision===v.revision&&v.approvalNote?'export':'approval';
 if(intent==='revision')return v?'revision':'choose-video';
 return 'edit';
}
export function ensureVideo(root,state,id){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||id.length>70)throw Error('Use a short lowercase video ID with hyphens.');
 for(const name of ['footage','overlays','screenshots','screen-recordings','generated'])mkdirSync(resolve(root,'public/videos',id,name),{recursive:true});
 const brief=resolve(root,'docs/briefs',id+'.local.md');mkdirSync(dirname(brief),{recursive:true});
 if(!existsSync(brief)){const template=readFileSync(resolve(root,'docs/briefs/TEMPLATE.md'),'utf8').replaceAll('<project-root>',root).replaceAll('<video-id>',id);writeFileSync(brief,template);}
 state.videos[id]??={requiresEditBrief:true,revision:1,approvedRevision:null,approvalNote:null,brief:`docs/briefs/${id}.local.md`};state.activeVideo=id;return brief;
}
export function revise(state,id){const v=state.videos[id];if(!v)throw Error('Unknown video');v.revision++;v.approvedRevision=null;v.approvalNote=null;}
