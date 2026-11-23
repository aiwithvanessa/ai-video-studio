// Developer-only local synthetic media. Not distributed as user footage or approved media.
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {run} from './editor.mjs';
const folder=resolve('.local/development');mkdirSync(folder,{recursive:true});
const wav=resolve(folder,'speech.wav'),ps=resolve(folder,'speech.ps1');
writeFileSync(ps,`Add-Type -AssemblyName System.Speech\n$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer\n$synth.Rate = -1\n$synth.SetOutputToWaveFile('${wav.replaceAll("'","''")}')\n$synth.Speak('Hello. This is a local caption test. Keep the message clear.')\n$synth.Dispose()\n`);
run('powershell.exe',['-NoProfile','-NonInteractive','-Command',readFileSync(ps,'utf8')]);
mkdirSync('public/videos/development-fixture/footage',{recursive:true});
run('ffmpeg',['-v','error','-y','-f','lavfi','-i','testsrc2=size=360x640:rate=30','-i',wav,'-af','adelay=1000:all=1,apad=whole_dur=10','-t','10','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','public/videos/development-fixture/footage/synthetic.mp4']);
console.log('Generated ten-second synthetic development clip with local Windows speech; no personal assets used.');
