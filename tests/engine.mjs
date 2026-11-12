import assert from 'node:assert/strict';
import {apply,empty,readiness} from '../lib/engine.ts';
let s=apply(empty,{type:'create',title:'Integration test',goal:'Verify guarded execution'},'owner');const id=s.missions[0].id;
function act(type,taskId,extra={}){s=apply(s,{type,missionId:id,taskId,...extra},'owner')}
function task(i){return s.missions[0].tasks[i]}
act('plan');assert.equal(task(0).phase,'PLANNED');assert.equal(readiness(s.missions[0],task(1)),'BLOCKED');
assert.throws(()=>act('simulate','T01',{mode:'simulation'}));assert.throws(()=>act('check','T02'));assert.throws(()=>act('verify','T01'));
act('check','T01');assert.throws(()=>act('simulate','T01',{mode:'production'}));
act('simulate','T01',{mode:'simulation',outcome:'error'});assert.equal(task(0).phase,'PLANNED');assert.equal(task(0).receipts[0].status,'error');assert.throws(()=>act('verify','T01'));
for(let i=0;i<5;i++){const tid='T0'+(i+1);if(i===4){assert.equal(readiness(s.missions[0],task(i)),'APPROVAL');assert.throws(()=>act('check',tid));act('approve',tid)}act('check',tid);act('simulate',tid,{mode:'simulation'});assert.equal(task(i).phase,'EXECUTED');assert.throws(()=>act('simulate',tid,{mode:'simulation'}));act('verify',tid);assert.equal(task(i).phase,'VERIFIED');assert.equal(task(i).receipts.at(-1).verification.scope,'MOCK_CONTRACT_ONLY');}
assert.equal(s.missions[0].tasks.flatMap(t=>t.receipts).length,6);assert.equal(empty.missions.length,0);console.log('PASS: dependency, readiness, permission, approval, failure/retry, receipt and verification guards');
