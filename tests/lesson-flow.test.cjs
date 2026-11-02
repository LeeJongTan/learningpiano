const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const flow=require('../lesson-flow'),learner=require('../learner-state'),audio=require('../piano-audio');
const ctx={window:{}};
vm.createContext(ctx);for(const file of ['curriculum.js','quiz-bank.js','course-extension.js','lesson-readings.js','locales.js'])vm.runInContext(fs.readFileSync(require.resolve('../'+file),'utf8'),ctx);
const course=JSON.parse(JSON.stringify(ctx.window.PHIM_COURSE)),bank=JSON.parse(JSON.stringify(ctx.window.PHIM_QUIZZES)),readings=JSON.parse(JSON.stringify(ctx.window.PHIM_READINGS));
function ready(id){let s=flow.initial();for(let i=1;i<readings[id].length;i++)s=flow.readStep(s,i,readings[id].length);return s;}
function quiz(id){return flow.startQuiz(ready(id),bank[id],readings[id].length);}
function answer(s,id,correct){const q=flow.currentQuestion(bank[id],s);return flow.check(flow.choose(s,correct?q.correct:(q.correct+1)%4,q),q);}
function clean(raw){return learner.sanitise(raw,course,bank,readings,flow);}

test('20 lessons, 120 bilingual questions; each question links to a real short reading step',()=>{
 const ids=new Set();assert.equal(course.length,20);assert.equal(Object.keys(bank).length,20);
 for(const l of course){
  assert.equal(l.id,course.indexOf(l)+1);assert.equal(bank[l.id].length,6);assert.ok(readings[l.id].length>=2);
  for(const step of readings[l.id])for(const key of ['title','body','remember'])assert.ok(step[key].length===2&&step[key].every(x=>typeof x==='string'&&x.trim()));
  assert.ok(l.target.length>=3&&l.target.every(n=>Number.isInteger(n)&&n>=48&&n<=84));
  for(const q of bank[l.id]){
   assert.ok(!ids.has(q.id));ids.add(q.id);assert.ok(readings[l.id][q.step]);
   assert.ok(q.correct>=0&&q.correct<4);
   for(let lang=0;lang<2;lang++){assert.ok(q.question[lang]&&q.explanation[lang]);assert.equal(q.options[lang].length,4);assert.equal(new Set(q.options[lang]).size,4);}
  }
 }
 assert.equal(ids.size,120);
});
test('locks require all predecessors and accept the expanded final lesson',()=>{
 assert.equal(flow.canOpen(1,[]),true);assert.equal(flow.canOpen(3,[1]),false);assert.equal(flow.canOpen(4,[1,3]),false);
 assert.equal(flow.canOpen(20,Array.from({length:19},(_,i)=>i+1)),true);
 for(const id of [0,21,NaN,2.5,'2'])assert.equal(flow.canOpen(id,[]),false);
});
test('read every step before quiz; cannot skip ahead or change quiz without explicit actions',()=>{
 const q=bank[8][0],s=flow.initial();assert.equal(flow.startQuiz(s,bank[8],3),s);assert.equal(flow.readStep(s,2,3),s);
 assert.equal(flow.choose(s,0,q),s);assert.equal(flow.check(s,q),s);
 let next=flow.readStep(s,1,3);assert.equal(flow.startQuiz(next,bank[8],3),next);next=flow.readStep(next,2,3);
 assert.equal(flow.startQuiz(next,bank[8],3).stage,'quiz');
});
test('new attempts change each correct position; bilingual option pairs survive shuffling',()=>{
 for(const l of course){
  let orders=[];
  for(let run=0;run<30;run++){
   const next=flow.newOrders(bank[l.id],orders);
   for(let i=0;i<6;i++){
    assert.equal(new Set(next[i]).size,4);
    if(orders.length)assert.notEqual(next[i].indexOf(bank[l.id][i].correct),orders[i].indexOf(bank[l.id][i].correct));
    const q=flow.currentQuestion(bank[l.id],{index:i,orders:next});
    for(let lang=0;lang<2;lang++)assert.equal(q.options[lang][q.correct],bank[l.id][i].options[lang][bank[l.id][i].correct]);
   }
   orders=next;
  }
 }
 // Deterministic RNG collisions still cannot repeat the previous answer position.
 const first=flow.newOrders(bank[1],[],()=>0),second=flow.newOrders(bank[1],first,()=>0);
 first.forEach((o,i)=>assert.notEqual(o.indexOf(0),second[i].indexOf(0)));
});
test('three errors allowed; fourth returns to a matching reading with all missed topics retained',()=>{
 let s=quiz(1);
 for(let i=1;i<=3;i++){s=answer(s,1,false);assert.equal(s.mistakes,i);assert.equal(s.stage,'quiz');assert.equal(flow.check(s,flow.currentQuestion(bank[1],s)),s);s=flow.advance(s,6);}
 s=answer(s,1,false);assert.equal(s.stage,'read');assert.equal(s.reviewRequired,true);assert.equal(s.readIndex,bank[1][0].step);assert.ok(s.missed.includes('1-1'));
 const old=s.orders;const restarted=flow.startQuiz(s,bank[1],readings[1].length);assert.equal(restarted.mistakes,0);assert.equal(restarted.index,0);assert.equal(restarted.reviewRequired,false);assert.notDeepEqual(restarted.orders,old);
});
test('errors accumulate across questions and map back to the relevant step',()=>{
 let s=quiz(8);for(let i=0;i<3;i++){s=answer(s,8,false);s=flow.advance(s,6);s=answer(s,8,true);s=flow.advance(s,6);}
 s=answer(s,8,false);assert.equal(s.stage,'read');assert.equal(s.readIndex,bank[8][3].step);assert.equal(s.missed.length,4);
});
test('all six questions precede practice in each of 20 lessons',()=>{
 for(const l of course){let s=quiz(l.id);for(let i=0;i<6;i++){assert.equal(flow.advance(s,6),s);s=answer(s,l.id,true);s=flow.advance(s,6);assert.equal(s.stage,i===5?'practice':'quiz');}assert.equal(s.practice.mode,'train');}
});
test('training allows exploration but cannot pass a lesson; test stays locked until practice ends',()=>{
 let p=flow.initialPractice();assert.equal(flow.startTest(p,3),p);
 for(const n of [60,66,62,67,64])p=flow.playNote(p,n,[60,62,64]);
 assert.equal(p.mode,'train');assert.equal(p.index,3);assert.equal(flow.startTest(p,3).mode,'test');
});
test('regression: C F-sharp D G E must fail, even though all target notes appear in order',()=>{
 const target=[60,62,64];let p={...flow.initialPractice(),mode:'test'};
 for(const n of [60,66,62,67,64])p=flow.playNote(p,n,target);
 assert.equal(p.mode,'failed');assert.equal(p.index,0);assert.equal(p.failures,1);
 const frozen=p;assert.equal(flow.playNote(p,60,target),frozen);
 p=flow.startTest(p,3);for(const n of target)p=flow.playNote(p,n,target);assert.equal(p.mode,'passed');assert.equal(p.index,3);
});
test('three failed keyboard runs return to training; the learner must train again before testing',()=>{
 const target=[60,62,64];let p={...flow.initialPractice(),mode:'test'};
 for(let run=1;run<=3;run++){
  p=flow.playNote(p,65,target);
  if(run<3){assert.equal(p.mode,'failed');assert.equal(p.failures,run);p=flow.startTest(p,3);}
 }
 assert.equal(p.mode,'train');assert.equal(p.redirected,true);assert.equal(p.index,0);assert.equal(flow.startTest(p,3),p);
 p=flow.playNote(p,60,target);assert.equal(p.redirected,false);p=flow.playNote(p,62,target);p=flow.playNote(p,64,target);p=flow.startTest(p,3);for(const n of target)p=flow.playNote(p,n,target);assert.equal(p.mode,'passed');
});
test('every authored target can pass a clean test, with no extra notes',()=>{
 for(const l of course){let p=flow.initialPractice();for(const n of l.target)p=flow.playNote(p,n,l.target);p=flow.startTest(p,l.target.length);for(const n of l.target)p=flow.playNote(p,n,l.target);assert.equal(p.mode,'passed');}
});
test('snapshot retains errors, chosen answer, feedback and shuffled orders across reload/backup',()=>{
 let s=quiz(1);s=answer(s,1,false);
 const raw={...learner.defaults(),profile:{displayName:'Tan'},completed:[1,2],lastLesson:3,sessions:{1:{version:learner.VERSION,updatedAt:new Date().toISOString(),flow:s}}};
 const loaded=clean(JSON.parse(JSON.stringify(raw)));assert.deepEqual(loaded.sessions[1].flow,s);assert.equal(loaded.profile.displayName,'Tan');
 const restored=learner.restore(JSON.parse(JSON.stringify(learner.backup(loaded))),course,bank,readings,flow);assert.deepEqual(restored,loaded);
});
test('invalid backups and malformed sessions cannot inject options, unlock invalid IDs or crash loading',()=>{
 assert.throws(()=>learner.restore({password:'x'},course,bank,readings,flow));
 let s=quiz(1);s.orders[0]=[0,0,99,1];
 const loaded=clean({curriculumVersion:2,completed:[-1,1,1,99,'2'],volume:Infinity,sessions:{1:{version:learner.VERSION,flow:s}},profile:{displayName:'x'.repeat(100)},password:'never-persist'});
 assert.deepEqual(loaded.completed,[1]);assert.equal(loaded.sessions[1],undefined);assert.equal(loaded.profile.displayName.length,40);assert.equal(loaded.volume,.6);assert.equal(loaded.password,undefined);
 assert.deepEqual(clean({curriculumVersion:2,completed:[1,7,11]}).completed,[1,7,11]);assert.deepEqual(clean({completed:[1,2,3]}).completed,[1,7,11]);
});
test('bass boost is bounded and adds only integer-harmonic weights',()=>{
 const low=audio.profile(24),middle=audio.profile(60);assert.ok(low.boost>middle.boost);
 for(let midi=0;midi<=127;midi++){const p=audio.profile(midi);assert.ok(p.boost>=1&&p.boost<=1.8);assert.equal(p.partials.length,4);assert.ok(p.partials.every(n=>n>0&&n<=1));}
});
test('note spelling agrees with MIDI in every authored visual example',()=>{
 const semitones={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
 for(const steps of Object.values(readings))for(const step of steps)if(step.spelling)step.notes.forEach((group,i)=>{
  const notes=Array.isArray(group)?group:[group],labels=Array.isArray(step.spelling[i])?step.spelling[i]:[step.spelling[i]];
  notes.forEach((n,j)=>{const m=labels[j].match(/^([A-G])([♯♭♮]?)(\d+)$/);assert.ok(m);assert.equal((Number(m[3])+1)*12+semitones[m[1]]+(m[2]==='♯'?1:m[2]==='♭'?-1:0),n);});
 });
});
test('notation places E-flat on the E position; dotted and tied notes are visually explicit',()=>{
 const source=fs.readFileSync(require.resolve('../app.js'),'utf8'),a=source.indexOf('function scoreSVG('),b=source.indexOf('function readingFigure(',a);
 const sandbox={t:(k,v={})=>k+JSON.stringify(v),escapeHTML:x=>x};vm.createContext(sandbox);vm.runInContext(source.slice(a,b),sandbox);
 const flat=sandbox.scoreSVG([63],{spelling:['E♭4']}),natural=sandbox.scoreSVG([64]);
 assert.match(flat,/<ellipse cx="310" cy="96"/);assert.match(natural,/<ellipse cx="310" cy="96"/);
 assert.match(sandbox.scoreSVG([60],{durations:[3]}),/class="score-dot"/);
 assert.match(sandbox.scoreSVG([60,60],{tie:true}),/Q/);
});

test('all 41 reading figures render without exceptions, including multi-note flat chord spellings',()=>{
 const source=fs.readFileSync(require.resolve('../app.js'),'utf8'),a=source.indexOf('function scoreSVG('),b=source.indexOf('function renderLesson(',a);
 const sandbox={t:(k,v={})=>k+JSON.stringify(v),escapeHTML:x=>x,L:x=>Array.isArray(x)?x[0]:x};vm.createContext(sandbox);vm.runInContext(source.slice(a,b),sandbox);
 let count=0;for(const steps of Object.values(readings))for(const step of steps){const html=sandbox.readingFigure(step);assert.match(html,/<figure/);assert.ok(!html.includes('NaN'));count++;}
 assert.equal(count,41);
});
