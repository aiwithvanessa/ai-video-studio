// Dependency-free structural/closure checks. Not a Codex discovery or editing test.
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,realpathSync,existsSync,mkdtempSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve,relative,dirname,join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const root=realpathSync(process.cwd());
const skill='.agents/skills/ai-video-studio/SKILL.md';
const text=readFileSync(skill,'utf8');
const metadata=/^---\r?\nname: ([a-z0-9-]+)\r?\ndescription: ([^\r\n]+)\r?\n---\r?\n/.exec(text);
assert(metadata,'Required YAML name/description frontmatter missing');
assert.equal(metadata[1],'ai-video-studio');assert(metadata[2].length>40&&metadata[2].length<700);
assert(text.split(/\s+/).length<650,'Keep the core concise');
assert(!text.includes('policy:'),'No unintended invocation policy change');
const inside=file=>{const full=realpathSync(resolve(file));assert(full===root||full.startsWith(root+sep),'Reference leaves candidate: '+file);return full;};
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):[join(dir,e.name)]);
const files=[...walk('.agents/skills/ai-video-studio'), 'START-HERE.md','AGENTS.md','docs/workflow.md','docs/RIGHTS.md','docs/FIRST-USER-TEST.md'];
let links=0;
for(const file of files){inside(file);const data=readFileSync(file,'utf8');
 for(const match of data.matchAll(/\]\(([^)]+)\)/g)){
  if(/^https:\/\//.test(match[1])){assert(/^https:\/\/(developers\.openai\.com|www\.remotion\.dev|ffmpeg\.org|raw\.githubusercontent\.com|github\.com|nodejs\.org|pixabay\.com|onnxruntime\.ai|huggingface\.co|docs\.pytorch\.org)\//.test(match[1]),'Unexpected upstream reference');continue;}
  assert(!/^(?:[a-z]:|\/|file:)/i.test(match[1]),'Absolute local link');inside(resolve(dirname(file),match[1]));links++;
 }
}
for(const file of ['scripts/studio.mjs','scripts/studio-state.mjs','src/Root.tsx','src/index.ts','docs/briefs/TEMPLATE.md','brand/BRAND.md'])inside(file);
const packageJson=JSON.parse(readFileSync('package.json','utf8'));
for(const name of ['studio','start','typecheck','compositions','check','check:skill'])assert(packageJson.scripts[name],name+' missing');
assert.equal(packageJson.scripts.start,'remotion studio src/index.ts --port=3200 --no-open');
assert.equal(packageJson.dependencies.remotion,'4.0.542');assert(!packageJson.dependencies['@remotion/captions']);
assert(readFileSync('START-HERE.md','utf8').includes('$ai-video-studio'));
// Runtime progress is valid during development; release builder explicitly excludes it.
// Run the real helper in a separate directory containing candidate files only.
const detached=mkdtempSync(join(tmpdir(),'standalone-studio-skill-'));
for(const file of ['scripts/studio.mjs','scripts/studio-state.mjs','docs/briefs/TEMPLATE.md','brand/BRAND.md']){
 mkdirSync(dirname(join(detached,file)),{recursive:true});copyFileSync(file,join(detached,file));
}
for(const [request,intent] of [['Set up my video studio','setup'],['Help me set up my brand','brand'],['Edit this video','edit'],['Make the title smaller and remove that zoom','revision'],['Export the approved version','export']]){
 const result=spawnSync(process.execPath,['scripts/studio.mjs','route',request],{cwd:detached,encoding:'utf8',env:{...process.env,NODE_PATH:''}});
 assert.equal(result.status,0,result.stderr);const output=JSON.parse(result.stdout);assert.equal(output.intent,intent);assert.equal(output.next,'setup');assert.equal(output.state.brand.status,'pending');assert.equal(output.state.activeVideo,null);
}
const registry=readFileSync('.agents/skills/ai-video-studio/references/capabilities.md','utf8');
for(const implementation of ['BrandPreview.tsx','transcribe.mjs','Captions.tsx','Effects.tsx','EditedVideo.tsx','scripts/bootstrap.mjs'])assert(registry.includes(implementation),'Missing implementation register: '+implementation);
console.log(`Skill format, concise core, ${links} candidate-local links, command register and five detached fresh-state requests passed. No excluded skill/files were provided to helper tests. Codex discovery/clean-machine usability and acoustic accuracy are not proven by this structural check.`);
