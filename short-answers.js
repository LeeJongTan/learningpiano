'use strict';
// Deterministic keyword checks: every concept group must match one whole phrase.
// This is not an AI essay grader. Keep models, hints and accepted aliases together.
(function (root) {
  const bi = (vi, en) => [vi, en];
  const rubrics = {
    1: {
      question: bi('Bạn tìm nốt C (Đô) ở đâu so với nhóm hai phím đen? Hãy mô tả phím và vị trí.', 'Where do you find C relative to a group of two black keys? Describe the key and its position.'),
      groups: [['phim trang', 'white key'], ['ben trai', 'phia trai', 'left'], ['hai', '2', 'two'], ['phim den', 'black keys', 'black key']],
      reject: ['ben phai', 'right', 'ba phim den', 'three black keys'],
      hint: bi('Tìm nhóm 2 phím đen trước. Quan sát phím trắng sát nhóm đó: nó ở bên nào?', 'Find a group of 2 black keys first. Which side has the neighbouring white C key?'),
      model: bi('C (Đô) là phím trắng ngay bên trái nhóm hai phím đen.', 'C is the white key immediately to the left of a group of two black keys.')
    },
    2: {
      question: bi('So sánh cao độ của C5 và C4: nốt nào cao hơn và cách nhau bao nhiêu?', 'Compare the pitch of C5 with C4: is C5 higher or lower, and by how much?'),
      groups: [['cao hon', 'higher', 'cao gap doi'], ['mot quang tam', '1 quang tam', 'one octave', '1 octave', '12 nua cung', '12 semitones']],
      reject: ['thap hon', 'lower', 'hai quang tam', 'two octaves'],
      hint: bi('Hai nốt cùng tên C có số quãng tám tăng từ 4 lên 5. Hãy nói cả hướng cao độ và tên khoảng cách.', 'Both notes are C, and the octave number goes from 4 to 5. Include both the pitch direction and the interval.'),
      model: bi('C5 cao hơn C4 một quãng tám (12 nửa cung).', 'C5 is one octave (12 semitones) higher than C4.')
    },
    3: {
      question: bi('Dòng thứ hai từ dưới của khóa Sol mang nốt nào? Ghi cả tên nốt và số quãng tám.', 'Which note is on the second line from the bottom of the treble clef? Include its octave number.'),
      groups: [['g4', 'sol4', 'sol 4']], reject: ['f4', 'b4', 'g5', 'sol5'],
      hint: bi('Đếm từ dòng dưới cùng: E4, rồi tới dòng tiếp theo. Đây cũng là nốt làm mốc cho khóa Sol.', 'Count lines up from E4. The next line is also the reference note of the treble clef.'),
      model: bi('Đó là G4 (Sol4), nằm trên dòng thứ hai từ dưới lên.', 'It is G4, on the second line from the bottom.')
    },
    4: {
      question: bi('Dòng nằm giữa hai chấm của khóa Fa là nốt nào? Ghi cả tên nốt và số quãng tám.', 'Which note lies on the line between the two bass-clef dots? Include its octave number.'),
      groups: [['f3', 'fa3', 'fa 3']], reject: ['g4', 'c4', 'f4', 'fa4'],
      hint: bi('Hai chấm bao quanh dòng thứ tư từ dưới lên. Tên khóa cho biết tên nốt; chú ý quãng tám.', 'The dots surround the fourth line from the bottom. The clef is also called the F clef; check the octave.'),
      model: bi('Hai chấm khóa Fa bao quanh dòng F3 (Fa3).', 'The bass-clef dots surround the F3 line.')
    },
    5: {
      question: bi('Dòng kẻ phụ đầu tiên phía trên khuông khóa Sol là nốt nào? Ghi cả số quãng tám.', 'What note is on the first ledger line above the treble staff? Include the octave number.'),
      groups: [['a5', 'la5', 'la 5']], reject: ['c6', 'a4', 'la4'],
      hint: bi('Bắt đầu từ dòng trên cùng F5, đi lên khe tiếp theo, rồi tới dòng kẻ phụ đầu tiên.', 'Start on the top line F5, move up to the next space, then to the first ledger line.'),
      model: bi('Đó là A5 (La5): F5 ở dòng trên cùng, G5 ở khe, rồi A5 ở dòng kẻ phụ.', 'It is A5: top-line F5, space G5, then ledger-line A5.')
    },
    6: {
      question: bi('Khi nốt đen = 1 phách, hai nốt móc đơn dài tổng cộng bao nhiêu phách? Giải thích bằng trường độ của mỗi nốt.', 'When a quarter note = 1 beat, how many beats do two eighth notes last together? Explain using the value of each note.'),
      groups: [['1 phach', 'mot phach', '1 beat', 'one beat'], ['nua phach', '1/2', '0.5', 'half', '½']],
      reject: ['tong cong 2 phach', 'total 2 beats', 'two beats in total'],
      hint: bi('Một nốt móc đơn dài bằng một nửa nốt đen. Hãy cộng trường độ của hai nốt móc đơn.', 'An eighth note lasts half as long as a quarter note. Add the two eighth-note values.'),
      model: bi('Tổng là 1 phách, vì mỗi nốt móc đơn dài 1/2 phách: 1/2 + 1/2 = 1.', 'The total is 1 beat, because each eighth note lasts half a beat: 1/2 + 1/2 = 1.')
    },
    7: {
      question: bi('Một ô nhịp 3/4 chứa được bao nhiêu nốt đen? Liên hệ với số phách của ô nhịp.', 'How many quarter notes fit in a bar of 3/4? Relate your answer to the number of beats.'),
      groups: [['3 not den', 'ba not den', '3 quarter notes', 'three quarter notes'], ['3 phach', 'ba phach', '3 beats', 'three beats']],
      reject: ['4 phach', 'four beats', '4 beats', '4 quarter notes', 'bon not den'],
      hint: bi('Số trên cho biết số phách trong một ô; số 4 phía dưới cho biết đơn vị phách là nốt đen.', 'The top number gives the beats per bar; the lower 4 makes the quarter note the beat unit.'),
      model: bi('Có 3 nốt đen, vì mỗi ô nhịp 3/4 có 3 phách và mỗi nốt đen dài 1 phách.', 'There are 3 quarter notes: a bar of 3/4 has 3 beats, and each quarter note lasts 1 beat.')
    },
    8: {
      question: bi('Nâng E4 một nửa cung thì dùng phím nào? Giải thích dựa vào vị trí E và F trên đàn.', 'Which key is a semitone above E4? Explain using the positions of E and F on the piano.'),
      groups: [['f4', 'fa4', 'fa 4', 'esharp4'], ['lien ke', 'ke nhau', 'sat nhau', 'adjacent', 'next to each other', 'no black key', 'khong co phim den']],
      reject: ['fsharp4', 'dsharp4'],
      hint: bi('Hãy nhìn giữa E và F: có phím đen nào không? Một nửa cung là một bước phím liền kề.', 'Look between E and F: is there a black key? A semitone is one step to an adjacent key.'),
      model: bi('Dùng F4 (cũng viết E♯4), vì E và F là hai phím liền kề, không có phím đen ở giữa.', 'Use F4 (also written E♯4), because E and F are adjacent keys with no black key between them.')
    },
    9: {
      question: bi('Từ C lên E có bao nhiêu nửa cung, và quãng này có tên gì?', 'How many semitones are there from C up to E, and what is the interval called?'),
      groups: [['4 nua cung', 'bon nua cung', '4 semitones', 'four semitones', '4 half steps', 'four half steps'], ['ba truong', 'major third', 'major 3rd']],
      reject: ['ba thu', 'minor third', '3 semitones', '3 nua cung'],
      hint: bi('Đếm từng bước C → C♯ → D → D♯ → E. Tên quãng còn dựa trên ba tên chữ C–D–E.', 'Count the steps C → C♯ → D → D♯ → E. The interval also spans three letter names: C–D–E.'),
      model: bi('C lên E là 4 nửa cung, tạo thành quãng ba trưởng.', 'C up to E is 4 semitones, a major third.')
    },
    10: {
      question: bi('Gam thứ tự nhiên nào dùng cùng các nốt với C trưởng? Ghi nốt chủ và loại gam.', 'Which natural minor scale shares the notes of C major? Give its tonic and scale type.'),
      groups: [['a thu', 'la thu', 'a minor', 'a natural minor']],
      reject: ['hoa thanh', 'harmonic', 'giai dieu', 'melodic', 'c thu', 'c minor', 'd major'],
      hint: bi('Tìm nốt bậc 6 của C trưởng. Bắt đầu từ đó và dùng cùng các phím trắng để tạo gam thứ tự nhiên.', 'Find the sixth degree of C major. Start there and use the same white keys to form the natural minor scale.'),
      model: bi('A thứ tự nhiên (La thứ tự nhiên) dùng cùng các nốt với C trưởng.', 'A natural minor shares the same notes as C major.')
    },
    11: {
      question: bi('Đổi C trưởng thành C thứ: bạn hạ nốt nào xuống nốt nào, và hạ bao nhiêu?', 'To turn C major into C minor, which note do you lower, what does it become, and by how much?'),
      groups: [['e', 'e4', 'mi', 'mi4'], ['eb', 'eb4', 'mi giang', 'mi4 giang'], ['ha', 'giam', 'lower', 'lowering', 'down'], ['nua cung', '1/2 cung', '1 semitone', 'one semitone', 'a semitone', 'half step']],
      reject: ['nang', 'raise', 'g flat', 'gb', 'gb4'],
      hint: bi('Giữ nguyên C và G. Nốt bậc ba của hợp âm trưởng cần tiến gần nốt gốc hơn một bước phím.', 'Keep C and G unchanged. The third of the major chord moves one adjacent key closer to the root.'),
      model: bi('Hạ E (Mi) xuống E♭ (Mi giáng) một nửa cung, giữ nguyên C và G.', 'Lower E to E♭ by one semitone, keeping C and G unchanged.')
    },
    12: {
      question: bi('E4–G4–C5 là hợp âm nào và ở thế đảo nào?', 'Which chord is E4–G4–C5, and which inversion is it in?'),
      groups: [['c truong', 'do truong', 'c major'], ['dao 1', 'dao thu nhat', 'dao mot', 'first inversion', '1st inversion']],
      reject: ['e minor', 'e thu', 'dao 2', 'second inversion', 'root position', 'the goc'],
      hint: bi('Sắp các tên nốt về C–E–G để tìm hợp âm, rồi xem nốt bậc mấy đang ở thấp nhất.', 'Reorder the note names as C–E–G to identify the chord, then find which chord member is lowest.'),
      model: bi('Đây là C trưởng đảo 1, vì vẫn gồm C–E–G nhưng E là nốt thấp nhất.', 'This is C major in first inversion: it still contains C–E–G, but E is the lowest note.')
    }
  };

  function normalize(text) {
    return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
      .replace(/½/g, '1/2').replace(/[♯#]/g, 'sharp').replace(/♭/g, 'b')
      .replace(/\b([a-g])\s*flat\s*(\d?)/g, '$1b$2')
      .replace(/\b([a-g])\s*sharp\s*(\d?)/g, '$1sharp$2')
      .replace(/\b([a-g])\s+(\d)\b/g, '$1$2')
      .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }
  function hasPhrase(text, phrase) {
    const needle = normalize(phrase);
    const haystack = ' ' + text + ' ';
    let from = 0;
    while (from < haystack.length) {
      const at = haystack.indexOf(' ' + needle + ' ', from);
      if (at < 0) return false;
      const prefix = haystack.slice(0, at).trim();
      // Do not accept a keyword immediately negated by the learner.
      if (!/\b(?:not|khong|khong phai|khong la|isnt|is not|is not the)$/.test(prefix)) return true;
      from = at + 1;
    }
    return false;
  }
  function grade(text, rubric) {
    const normalized = normalize(text);
    if (!normalized) return { correct: false, empty: true };
    return { correct: rubric.groups.every(group => group.some(term => hasPhrase(normalized, term)))
      && !(rubric.reject || []).some(term => hasPhrase(normalized, term)), empty: false };
  }
  function submit(previous, text, rubric) {
    if (previous.correct) return previous;
    const normalized = normalize(text);
    if (!normalized) return { ...previous, notice: 'answerEmpty' };
    if (previous.submitted.includes(normalized)) return { ...previous, notice: 'answerDuplicate' };
    const correct = grade(text, rubric).correct;
    return { text, correct, attempts: previous.attempts + (correct ? 0 : 1), submitted: [...previous.submitted, normalized], notice: '' };
  }
  function initial() { return { text: '', correct: false, attempts: 0, submitted: [], notice: '' }; }
  const api = { normalize, grade, submit, initial, rubrics };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) { root.PHIM_SHORT_ANSWERS = rubrics; root.PHIM_ANSWER_CHECK = api; }
})(typeof window !== 'undefined' ? window : null);
