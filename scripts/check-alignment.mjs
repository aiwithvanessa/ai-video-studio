import assert from 'node:assert/strict';
import {ctcAlign} from '../src/lib/ctc-align.mjs';
import {alignmentLabel} from '../src/lib/alignment-text.mjs';
assert.equal(alignmentLabel('1,'),'ONE');assert.equal(alignmentLabel('2:'),'TWO');assert.equal(alignmentLabel('23'),'TWENTY|THREE');assert.equal(alignmentLabel('ChatGPT.'),'CHATGPT');assert.equal(alignmentLabel('I’ll'),"I'LL");assert.throws(()=>alignmentLabel('1000'),/needs review/);assert.throws(()=>alignmentLabel('GPT4'),/needs review/);assert.throws(()=>alignmentLabel('français'),/Unsupported/);
// Known logits, not synthetic claims about real speech timing.
function emissions(sequence){return Float32Array.from(sequence.flatMap(id=>[0,1,2].map(x=>x===id?8:-8)));}
let path=ctcAlign(emissions([0,0,1,0,2,0]),6,3,[1,2]);assert.deepEqual(path.map(x=>[x.start,x.end]),[[2,3],[4,5]],'initial silence and separated labels');
path=ctcAlign(emissions([1,0,1,0]),4,3,[1,1]);assert.deepEqual(path.map(x=>[x.start,x.end]),[[0,1],[2,3]],'repeated labels require a blank');
path=ctcAlign(emissions([1,2,0]),3,3,[1,2]);assert.deepEqual(path.map(x=>[x.start,x.end]),[[0,1],[1,2]],'speech at zero and adjacent labels');
assert.throws(()=>ctcAlign(emissions([1]),1,3,[1,1]),/No complete|Incomplete/);
assert.throws(()=>ctcAlign(new Float32Array(0),0,3,[1]),/Unsupported/);
console.log('CTC path checks passed: initial silence, zero onset, adjacent labels, required repeat blank, incomplete paths rejected. These are not speech/listening checks.');
