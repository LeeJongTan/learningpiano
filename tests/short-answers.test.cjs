const test = require('node:test');
const assert = require('node:assert/strict');
const { rubrics, normalize, grade, submit, initial } = require('../short-answers.js');

for (const [id, rubric] of Object.entries(rubrics)) {
  test(`lesson ${id}: Vietnamese, English, accentless and uppercase model answers pass`, () => {
    for (const model of rubric.model) {
      for (const answer of [model, model.toUpperCase(), normalize(model)]) {
        assert.equal(grade(answer, rubric).correct, true, answer);
      }
    }
  });
  test(`lesson ${id}: blank and unrelated answers fail`, () => {
    for (const answer of ['', '   ', 'I do not know', 'chưa biết']) assert.equal(grade(answer, rubric).correct, false);
  });
}

test('accepts alternative notation, accents, spacing and wording', () => {
  for (const [id, answer] of [
    [1, 'C la phim trang ngay ben trai nhom 2 phim den.'],
    [2, 'C5 is 12 semitones higher than C4.'],
    [3, 'Sol 4'], [4, 'F 3'], [5, 'La5'],
    [6, 'Hai not la mot phach vi moi not bang nua phach.'],
    [7, 'Three quarter notes fill 3 beats.'],
    [8, 'E#4, as E and F are adjacent.'],
    [9, 'Four half steps make a major 3rd.'],
    [10, 'La thu tu nhien'],
    [11, 'Lower E4 to E flat 4 by one semitone.'],
    [11, 'Ha Mi xuong Mi giang mot nua cung.'],
    [12, 'Do truong dao thu nhat.']
  ]) assert.equal(grade(answer, rubrics[id]).correct, true, answer);
});

test('whole tokens, negation, missing concepts and contradictions do not pass', () => {
  for (const [id, answer] of [
    [1, 'C'], [2, 'One octave lower'], [3, 'not G4'], [3, 'G40'],
    [4, 'F4'], [5, 'G5'], [6, 'two beats'], [7, '3/4 has 4 beats'],
    [8, 'F#4, adjacent'], [8, 'F4'], [9, '4 semitones, minor third'],
    [9, 'major third'], [10, 'A harmonic minor'],
    [11, 'Raise E to Eb by one semitone'], [11, 'Lower E by one semitone'],
    [12, 'C major second inversion'], [12, 'C major']
  ]) assert.equal(grade(answer, rubrics[id]).correct, false, answer);
});

test('empty and repeated submissions do not use attempts; third miss does not pass', () => {
  let result = submit(initial(), '', rubrics[3]);
  assert.equal(result.attempts, 0); assert.equal(result.notice, 'answerEmpty');
  result = submit(result, 'C4', rubrics[3]);
  assert.equal(result.attempts, 1);
  result = submit(result, ' c4 ', rubrics[3]);
  assert.equal(result.attempts, 1); assert.equal(result.notice, 'answerDuplicate');
  result = submit(result, 'F4', rubrics[3]); assert.equal(result.attempts, 2);
  result = submit(result, 'B4', rubrics[3]); assert.equal(result.attempts, 3);
  assert.equal(result.correct, false);
  result = submit(result, 'G5', rubrics[3]); assert.equal(result.attempts, 4);
  result = submit(result, 'G4', rubrics[3]); assert.equal(result.correct, true);
  assert.equal(result.attempts, 4);
  assert.deepEqual(submit(result, 'wrong', rubrics[3]), result);
});
