const test=require('node:test');
const assert=require('node:assert/strict');
const flow=require('../lesson-flow');
const bank=require('../quiz-bank');

test('72 unique bilingual questions: six per lesson, four distinct options each',()=>{
  const ids=new Set();
  assert.equal(Object.keys(bank).length,12);
  for(let lesson=1;lesson<=12;lesson++){
    const questions=bank[lesson];assert.equal(questions.length,6);
    for(const q of questions){
      assert.ok(!ids.has(q.id));ids.add(q.id);
      assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);
      for(let language=0;language<2;language++){
        assert.ok(q.question[language].trim().length>0);
        assert.ok(q.explanation[language].trim().length>0);
        assert.equal(q.options[language].length,4);
        assert.equal(new Set(q.options[language]).size,4);
        assert.ok(q.options[language].every(s=>s.trim().length>0));
      }
    }
    assert.ok(new Set(questions.map(q=>q.correct)).size>=3);
  }
  assert.equal(ids.size,72);
});

test('lesson locks require all predecessors, including sparse legacy progress',()=>{
  assert.equal(flow.canOpen(1,[]),true);
  assert.equal(flow.canOpen(2,[]),false);
  assert.equal(flow.canOpen(2,[1]),true);
  assert.equal(flow.canOpen(3,[1]),false);
  assert.equal(flow.canOpen(4,[1,3]),false);
  assert.equal(flow.canOpen(5,[1,2,3,4]),true);
  assert.equal(flow.canOpen(12,Array.from({length:11},(_,i)=>i+1)),true);
  for(const id of [0,13,NaN,2.5,'2'])assert.equal(flow.canOpen(id,[]),false);
});

test('reading must precede quiz; blank or invalid selections do nothing',()=>{
  const q=bank[1][0],reading=flow.initial();
  assert.equal(reading.stage,'read');
  assert.deepEqual(flow.choose(reading,q.correct,q),reading);
  assert.deepEqual(flow.check(reading,q),reading);
  const quiz=flow.startQuiz(reading);
  assert.equal(quiz.stage,'quiz');
  assert.deepEqual(flow.check(quiz,q),quiz);
  for(const value of [-1,4,undefined,1.5])assert.deepEqual(flow.choose(quiz,value,q),quiz);
});

function answer(state,q,correct){
  state=flow.choose(state,correct?q.correct:(q.correct+1)%4,q);
  return flow.check(state,q);
}

test('three mistakes are allowed; the fourth returns to reading without passing',()=>{
  const q=bank[1][0];let state=flow.startQuiz(flow.initial());
  for(let n=1;n<=3;n++){
    state=answer(state,q,false);
    assert.equal(state.mistakes,n);assert.equal(state.stage,'quiz');assert.equal(state.feedback,'wrong');
    const duplicate=flow.check(state,q);assert.deepEqual(duplicate,state);
    state=flow.advance(state,6);assert.equal(state.index,0);
  }
  state=answer(state,q,false);
  assert.equal(state.stage,'read');assert.equal(state.reviewRequired,true);
  assert.equal(state.index,0);assert.equal(state.feedback,null);
  assert.deepEqual(flow.advance(state,6),state);
  state=flow.startQuiz(state);
  assert.equal(state.stage,'quiz');assert.equal(state.mistakes,0);assert.equal(state.index,0);assert.equal(state.reviewRequired,false);
});

test('mistakes accumulate across different questions, not just one question',()=>{
  let state=flow.startQuiz(flow.initial());
  for(let i=0;i<3;i++){
    const q=bank[2][i];state=answer(state,q,false);state=flow.advance(state,6);
    state=answer(state,q,true);state=flow.advance(state,6);
    assert.equal(state.index,i+1);assert.equal(state.mistakes,i+1);
  }
  state=answer(state,bank[2][3],false);
  assert.equal(state.stage,'read');assert.equal(state.reviewRequired,true);assert.equal(state.index,0);
});

test('all six correct answers are required before keyboard practice',()=>{
  for(let lesson=1;lesson<=12;lesson++){
    let state=flow.startQuiz(flow.initial());
    for(let i=0;i<6;i++){
      const q=bank[lesson][i];assert.equal(state.stage,'quiz');
      assert.deepEqual(flow.advance(state,6),state);
      state=answer(state,q,true);assert.equal(state.feedback,'correct');
      assert.deepEqual(flow.check(state,q),state);
      state=flow.advance(state,6);
      assert.equal(state.stage,i===5?'practice':'quiz');
    }
    assert.equal(state.index,6);
    assert.deepEqual(flow.startQuiz(state),state);
    assert.deepEqual(flow.check(state,bank[lesson][0]),state);
  }
});

test('key music answers remain paired correctly after option rotation',()=>{
  for(const [lesson,index,answerVi,answerEn] of [
    [1,0,'C (Đô)','C'],[3,2,'G4','G4'],[4,0,'F3','F3'],[5,3,'A5','A5'],
    [6,2,'Một nốt đen','One quarter note'],[8,3,'F4','F4'],
    [9,0,'Ba trưởng · 4','Major third · 4'],[10,2,'A thứ tự nhiên','A natural minor'],
    [11,2,'C–E♭–G♭','C–E♭–G♭'],[12,0,'C trưởng đảo 1','C major, first inversion']
  ]){
    const q=bank[lesson][index];assert.equal(q.options[0][q.correct],answerVi);assert.equal(q.options[1][q.correct],answerEn);
  }
});
