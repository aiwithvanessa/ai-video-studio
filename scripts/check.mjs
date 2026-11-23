import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdtempSync,mkdirSync,writeFileSync,copyFileSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,resolve,dirname} from 'node:path';
import {initialState,loadState,saveState,recognize,nextStep,ensureVideo,revise} from './studio-state.mjs';
const root=mkdtempSync(join(tmpdir(),'studio-check-'));mkdirSync(join(root,'docs/briefs'),{recursive:true});copyFileSync('docs/briefs/TEMPLATE.md',join(root,'docs/briefs/TEMPLATE.md'));
const s=initialState();assert.equal(s.setup.complete,false);assert.equal(s.brand.status,'pending');assert.equal(nextStep(s,'edit',root),'setup');
for(const [t,i] of [['set up this project','setup'],['brand onboarding','brand'],['edit this clip','edit'],['make title bigger','revision'],['export','export']])assert.equal(recognize(t),i);
for(const key of ['node','npm','dependencies','ffmpeg','ffprobe'])s.setup.checks[key]={passed:true};s.setup.complete=true;
mkdirSync(join(root,'node_modules/remotion'),{recursive:true});writeFileSync(join(root,'node_modules/remotion/package.json'),'{}');assert.equal(nextStep(s,'edit',root),'brand');
mkdirSync(join(root,'brand'));writeFileSync(join(root,'brand/BRAND.md'),'Test brand');s.brand={status:'complete',evidence:'fixture only'};assert.equal(nextStep(s,'edit',root),'brand');s.style={status:'complete'};
const brief=ensureVideo(root,s,'test-video');writeFileSync(brief,'Preserve');ensureVideo(root,s,'test-video');assert.equal(readFileSync(brief,'utf8'),'Preserve');assert.equal(nextStep(s,'export',root),'approval');
s.videos['test-video'].approvedRevision=1;s.videos['test-video'].approvalNote='fixture approval';assert.equal(nextStep(s,'export',root),'export');revise(s,'test-video');assert.equal(nextStep(s,'export',root),'approval');saveState(root,s);assert.deepEqual(loadState(root),s);assert.throws(()=>ensureVideo(root,s,'../escape'));
let links=0;for(const file of ['START-HERE.md','AGENTS.md','docs/workflow.md','docs/RIGHTS.md','docs/FIRST-USER-TEST.md'])for(const m of readFileSync(file,'utf8').matchAll(/\]\(([^)]+)\)/g)){if(/^https?:/.test(m[1]))continue;assert(existsSync(resolve(dirname(file),m[1])));links++;}
console.log('Passed fresh state, routing/resume, per-video paths, non-overwrite, approval/revision checks and '+links+' local links. Synthetic test, not first-user evidence.');
