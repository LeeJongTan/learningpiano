'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const STORAGE_KEY = 'phim-piano-v1';
let state = { curriculumVersion: 2, completed: [], songCompleted: [], practiceSeconds: 0, language: 'vi', keyboardStart: 3, keyboardOctaves: 3, showLabels: true };
function t(key, values = {}) {
  const pair = window.PHIM_TEXT[key];
  if (!pair) throw new Error('Missing translation: ' + key);
  return pair[state.language === 'en' ? 1 : 0].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '').replaceAll('(s)',Number(values.n)===1?'':'s');
}
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved && typeof saved === 'object') {
    state.completed = Array.isArray(saved.completed) ? [...new Set(saved.completed.filter(n => Number.isInteger(n) && n >= 1 && n <= 12).map(n => saved.curriculumVersion === 2 ? n : ({1:1,2:7,3:11}[n])).filter(Boolean))] : [];
    state.songCompleted = Array.isArray(saved.songCompleted) ? [...new Set(saved.songCompleted.filter(n => [0,1,2,3].includes(n)))] : [];
    state.practiceSeconds = Number.isFinite(saved.practiceSeconds) ? Math.max(0, saved.practiceSeconds) : 0;
    state.language = saved.language === 'en' ? 'en' : 'vi';
    state.keyboardOctaves = [1,2,3].includes(saved.keyboardOctaves) ? (saved.curriculumVersion === 2 ? saved.keyboardOctaves : 3) : 3;
    state.keyboardStart = Number.isInteger(saved.keyboardStart) ? Math.max(1, Math.min(8-state.keyboardOctaves, saved.keyboardStart)) : 3;
    state.showLabels = saved.showLabels !== false;
  }
} catch {}
let storageOK = true;
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { storageOK = false; } }
const L = value => Array.isArray(value) ? value[state.language === 'en' ? 1 : 0] : value;
const pad = n => String(n).padStart(2,'0');
const termsVI = [
  {name:'Cao độ', en:'Pitch', text:'Cảm giác âm thanh cao hay thấp. Khi tần số tăng, cao độ tăng. Trên piano, đi sang phải thường đưa bạn đến các nốt cao hơn.', example:'Ví dụ: C5 cao hơn C4 một quãng tám.', demo:'octave'},
  {name:'Quãng tám', en:'Octave', text:'Khoảng cách từ một nốt đến nốt tiếp theo cùng tên. Hai nốt cách nhau một quãng tám có tần số theo tỉ lệ 2:1.', example:'Ví dụ: C4 và C5 cùng tên Đô, nhưng ở hai cao độ khác nhau.', demo:'octave'},
  {name:'Phách', en:'Beat', text:'Nhịp đập đều làm điểm tựa để bạn đếm và chơi nhạc. Độ dài của mỗi nốt được tính trong mối quan hệ với phách.', example:'Thử đếm 1–2–3–4 đều nhau với máy đếm nhịp.', route:'practice'},
  {name:'Tốc độ', en:'Tempo · BPM', text:'Tốc độ của các phách. BPM là số phách trong một phút: 60 BPM nghĩa là mỗi giây có một phách.', example:'Ví dụ: 120 BPM nhanh gấp đôi 60 BPM.', route:'practice'},
  {name:'Hợp âm', en:'Chord', text:'Một nhóm nốt được nghe cùng nhau. Trong phần nhập môn, ta bắt đầu bằng hợp âm ba: nốt gốc, nốt bậc ba và nốt bậc năm.', example:'Ví dụ: hợp âm C trưởng gồm C–E–G.', demo:'major'},
  {name:'Nửa cung', en:'Semitone · Half step', text:'Khoảng cách cao độ nhỏ nhất giữa hai phím liền kề trên piano, tính cả phím trắng lẫn phím đen.', example:'Ví dụ: E và F cách nhau nửa cung dù cả hai đều là phím trắng.', demo:'semitone'},
  {name:'Cung', en:'Tone · Whole step', text:'Khoảng cách bằng hai nửa cung. Muốn tìm một cung trên bàn phím, bạn đi hai bước phím liền kề.', example:'Ví dụ: C → C♯ → D. Từ C đến D là một cung.'},
  {name:'Hợp âm trưởng và thứ', en:'Major & minor triads', text:'Hợp âm ba trưởng có quãng ba trưởng giữa nốt gốc và nốt bậc ba. Hạ nốt bậc ba một nửa cung sẽ tạo hợp âm ba thứ cùng nốt gốc.', example:'C–E–G → C–E♭–G. Cảm xúc còn phụ thuộc nhịp, sắc thái và ngữ cảnh.', demo:'compare'}
];
let lessonData, terms, routeTitles;
function refreshLocale() {
  lessonData = window.PHIM_COURSE.map(l => ({...l,...Object.fromEntries(['title','category','description','goals','theory','concept','question','reason','task'].map(k=>[k,L(l[k])])),duration:l.duration+' '+t('minutes'),color:['mint','sand','lilac'][(l.id-1)%3]}));
  terms = state.language === 'en' ? window.PHIM_TERMS_EN : termsVI;
  routeTitles = Object.fromEntries(['home','learn','practice','song','library','feedback'].map(key => [key,t(key)]));
}
refreshLocale();
function lessonArt(id) {
  if (id === 1) return `<svg viewBox="0 0 180 105" aria-hidden="true"><g transform="rotate(-9 90 53)"><rect x="32" y="22" width="116" height="66" rx="6" fill="#f9fcf7" stroke="#97aa8e"/><path d="M48 23v64m17-64v64m17-64v64m17-64v64m17-64v64m16-64v64" stroke="#b6c3ae"/><path d="M48 22v37m17-37v37m34-37v37m17-37v37m16-37v37" stroke="#72866c" stroke-width="8"/><rect x="35" y="63" width="10" height="18" rx="2" fill="#e3a97a" stroke="none"/></g><circle cx="155" cy="21" r="4" fill="#b7c5ab" stroke="none"/><path d="m20 67 4-5m-6 0 8 5" stroke="#bdcbb4"/></svg>`;
  if (id === 2) return `<svg viewBox="0 0 180 105" aria-hidden="true"><path d="M15 32h150M15 43h150M15 54h150M15 65h150M15 76h150" stroke="#d6c9ae" stroke-width="1"/><ellipse cx="54" cy="65" rx="9" ry="6" transform="rotate(-20 54 65)" fill="#a69168" stroke="none"/><path d="M62 64V21" stroke="#a69168" stroke-width="2.5"/><ellipse cx="98" cy="54" rx="9" ry="6" transform="rotate(-20 98 54)" fill="#a69168" stroke="none"/><path d="M106 53V18m0 0c20 5 16 18 6 18" stroke="#a69168" stroke-width="2.5"/><circle cx="139" cy="66" r="4" fill="#dbb57b" stroke="none"/></svg>`;
  return `<svg viewBox="0 0 180 105" aria-hidden="true"><path d="M35 24h110M35 36h110M35 48h110M35 60h110M35 72h110M67 84h39" stroke="#c6c2d3" stroke-width="1"/><g fill="#8c83a0" stroke="none"><ellipse cx="86" cy="84" rx="9" ry="6" transform="rotate(-18 86 84)"/><ellipse cx="86" cy="72" rx="9" ry="6" transform="rotate(-18 86 72)"/><ellipse cx="86" cy="60" rx="9" ry="6" transform="rotate(-18 86 60)"/></g><path d="M94 83V21" stroke="#8c83a0" stroke-width="2.4"/><path d="m26 44-4-5m6 2-7 1m131 13 7-4m-3-2 1 8" stroke="#bbb0ce"/></svg>`;
}

function lessonCards(wide = false, list = lessonData.slice(0,3)) {
  return `<div class="lesson-grid ${wide ? 'wide-lessons' : ''}">${list.map(l => {
    const unlocked=window.PHIM_LESSON_FLOW.canOpen(l.id,state.completed),done=state.completed.includes(l.id);
    return `<article class="lesson-card ${unlocked?'':'lesson-locked'}"><div class="lesson-art art-${l.color}"><span class="art-number">${pad(l.id)}</span>${lessonArt(l.id)}</div>${done?`<span class="done-badge" aria-label="${t('completed')}">${icon('check')}</span>`:''}<div class="lesson-body"><div class="lesson-meta">${l.category} · ${t('lesson')} ${pad(l.id)}</div><h3>${unlocked?`<a href="#lesson-${l.id}" data-lesson="${l.id}">${l.title}</a>`:l.title}</h3><p>${l.description}</p>${unlocked?'':`<p class="lesson-lock">${icon('lock')} ${t('lockedUntil',{n:l.id-1})}</p>`}<div class="lesson-card-footer"><span class="lesson-duration">${icon('clock')}${l.duration}</span><button class="card-action" data-lesson="${l.id}" ${unlocked?'':'disabled'} aria-label="${unlocked?t('openLesson',{title:l.title}):t('lockedUntil',{n:l.id-1})}">${icon(unlocked?(done?'check':'arrow'):'lock')}</button></div></div></article>`;
  }).join('')}</div>`;
}
function nextLesson() { return lessonData.find(l => !state.completed.includes(l.id))?.id || 1; }
function homePage() {
  const n = state.completed.length, pct = Math.round(n / 12 * 100);
  return `<div class="page-heading"><div><h1>${t('welcome')}</h1><p>${t('welcomeSub')}</p></div></div>
  <section class="hero hero-copy-only"><div class="hero-copy"><div class="eyebrow"><span class="line"></span> ${t('heroEyebrow')}</div><h2>${t('heroTitle')}<br><span>${t('heroTitle2')}</span></h2><p>${t('heroDescription')}</p><div class="hero-actions"><button class="button" data-lesson="${nextLesson()}">${t(n===0?'start':n===12?'review':'continue')} ${icon('arrow')}</button></div></div></section>
  <div class="overview-grid"><div><section aria-labelledby="first-lessons"><div class="section-heading"><div><h2 id="first-lessons">${t('firstSteps')}</h2><p>${t('firstSub')}</p></div><a class="section-link" href="#learn">${t('viewPath')} ${icon('arrow')}</a></div>${lessonCards()}</section><a class="practice-teaser" href="#practice"><span class="teaser-icon">${icon('piano')}</span><div class="teaser-copy"><h3>${t('teaserTitle')}</h3><p>${t('teaserSub')}</p></div><span class="small-pill">${t('freePractice')}</span>${icon('arrow')}</a></div>
  <aside class="side-stack"><section class="progress-card"><div class="widget-label">${t('stepByStep')}</div><div class="progress-title"><h3>${t('seed')}</h3><span>${pct}%</span></div><div class="progress-track" role="progressbar" aria-label="${t('progressLabel')}" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div><div class="progress-detail"><span>${t('lessonsCompleted',{n})}</span><span>${t('intro')}</span></div><div class="progress-sub"><div><strong>${n}<small> / 12</small></strong><span>${t('understood')}</span></div><div><strong>${Math.floor(state.practiceSeconds / 60)}<small> ${t('minutes')}</small></strong><span>${t('timePractising')}</span></div></div></section><section class="thought-card"><div class="thought-header">${icon('spark')} ${t('curious')}</div><blockquote>${t('octaveQuestion')}</blockquote><a href="#library" class="section-link">${t('discoverOctave')} ${icon('arrow')}</a></section></aside></div>`;
}
function learnPage() {
  const groups=[[1,2,'keyboardStage'],[3,5,'readingStage'],[6,7,'rhythmStage'],[8,10,'pitchStage'],[11,12,'chordStage']];
  return `<div class="page-intro"><div class="eyebrow">${t('learnEyebrow')}</div><h1>${t('learnTitle')}</h1><p>${t('learnSub')}</p></div><div class="course-banner"><div><h2>${t('courseTitle')}</h2><p>${t('courseSummary',{n:state.completed.length})}</p></div><strong>${state.completed.length}/12</strong></div><section class="outcomes"><h2>${t('courseOutcomes')}</h2><ul>${[1,2,3].map(n=>`<li>${t('outcome'+n)}</li>`).join('')}</ul><p>${t('courseLimit')}</p></section>${groups.map(([a,b,key])=>`<section class="course-group"><div class="section-heading"><h2>${t(key)}</h2><span>${pad(a)}–${pad(b)}</span></div>${lessonCards(true,lessonData.filter(l=>l.id>=a&&l.id<=b))}</section>`).join('')}<a href="#song" class="practice-teaser"><span class="teaser-icon">♪</span><div class="teaser-copy"><h3>Happy Birthday</h3><p>${t('songTeaser')}</p></div>${icon('arrow')}</a>`;
}

// Unique physical-key mapping covers all 37 notes of three octaves.
const pianoCodes = ['KeyZ','KeyS','KeyX','KeyD','KeyC','KeyV','KeyG','KeyB','KeyH','KeyN','KeyJ','KeyM','KeyQ','Digit2','KeyW','Digit3','KeyE','KeyR','Digit5','KeyT','Digit6','KeyY','Digit7','KeyU','KeyI','Digit9','KeyO','Digit0','KeyP','BracketLeft','Equal','BracketRight','Backslash','Semicolon','Quote','Slash','Period'];
const shortcutLabels = ['Z','S','X','D','C','V','G','B','H','N','J','M','Q','2','W','3','E','R','5','T','6','Y','7','U','I','9','O','0','P','[','=',']','\\',';',"'",'/','.'];
const relativeShortcuts = Object.fromEntries(shortcutLabels.map((v,i)=>[i,v]));

const noteNames = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const solfegeVI = ['Đô','Đô thăng','Rê','Rê thăng','Mi','Fa','Fa thăng','Sol','Sol thăng','La','La thăng','Si'];
const solfegeEN = ['C','C sharp','D','D sharp','E','F','F sharp','G','G sharp','A','A sharp','B'];
function solfege(midi) { return (state.language==='en'?solfegeEN:solfegeVI)[midi%12]; }
function noteName(midi) { return noteNames[midi % 12] + (Math.floor(midi / 12) - 1); }
function keyboardBase() { return 12*(state.keyboardStart+1); }
function keyboardRange() { return t('range',{start:state.keyboardStart,end:state.keyboardStart+state.keyboardOctaves,n:state.keyboardOctaves}); }
function keyboard() {
  const base=keyboardBase(),end=base+state.keyboardOctaves*12;
  const whites=[],blacks=[];
  for(let m=base;m<=end;m++){if([0,2,4,5,7,9,11].includes(m%12))whites.push(m);else blacks.push({m,p:whites.length});}
  const count=whites.length;
  return `<div data-keyboard-region><div class="keyboard-toolbar"><div class="octave-shift"><button data-shift="-1" aria-label="${t('lower')}" ${state.keyboardStart<=1?'disabled':''}>− <span>${t('lowerShort')}</span></button><strong data-keyboard-range aria-live="polite">C${state.keyboardStart} — C${state.keyboardStart+state.keyboardOctaves}</strong><button data-shift="1" aria-label="${t('higher')}" ${state.keyboardStart>=8-state.keyboardOctaves?'disabled':''}><span>${t('higherShort')}</span> +</button></div><label class="octave-length"><span>${t('visibleRange')}</span><select data-octaves aria-label="${t('visibleRange')}">${[1,2,3].map(n=>`<option value="${n}" ${state.keyboardOctaves===n?'selected':''}>${t('octaves',{n})}</option>`).join('')}</select></label></div><div class="keyboard-scroll" style="--white-count:${count}" tabindex="0" role="region" aria-label="${t('pianoGroup',{start:state.keyboardStart,end:state.keyboardStart+state.keyboardOctaves})}"><div class="keyboard-wrap"><div class="piano-keyboard" style="--white-count:${count}" role="group" aria-label="${t('pianoGroup',{start:state.keyboardStart,end:state.keyboardStart+state.keyboardOctaves})}">${whites.map(m=>`<button class="piano-key white-key" data-midi="${m}" aria-label="${solfege(m)} ${noteName(m)}"><span class="key-name" ${state.showLabels?'':'hidden'}>${m%12===0?noteName(m):noteNames[m%12]}</span><span class="key-shortcut">${relativeShortcuts[m-base]??''}</span></button>`).join('')}${blacks.map(({m,p})=>`<button class="piano-key black-key" data-midi="${m}" style="left:calc(${p/count*100}% - 100% / ${count} * .32)" aria-label="${solfege(m)} ${noteName(m)}"><span class="key-name" ${state.showLabels?'':'hidden'}>${noteNames[m%12]}</span><span class="key-shortcut">${relativeShortcuts[m-base]??''}</span></button>`).join('')}</div></div></div><p class="keyboard-caption">${t('keyboardHint')}<br><span class="keyboard-swipe-hint">${t('keyboardScroll')} </span>${t('simulation')}</p><details class="keymap"><summary>${t('keymapTitle')}</summary>${[0,1,2].slice(0,state.keyboardOctaves).map(i=>`<p><strong>C${state.keyboardStart+i}–B${state.keyboardStart+i}</strong> ${shortcutLabels.slice(i*12,i*12+12).map((k,j)=>`<span>${noteNames[j]} <kbd>${k}</kbd></span>`).join('')}</p>`).join('')}<p>C${state.keyboardStart+state.keyboardOctaves} <kbd>${relativeShortcuts[state.keyboardOctaves*12]}</kbd></p></details></div>`;
}
function updateKeyboard(focusSelector) {
  cancelDemo();songPractising=false;save();$$('[data-keyboard-region]').forEach(el=>{el.outerHTML=keyboard();});
  if(route==='song')updateSongUI();
  $$('[data-full-range]').forEach(el=>el.textContent=keyboardRange());
  if(focusSelector){const scope=activeLesson?$('#lesson-modal'):$('#main');$(focusSelector,scope)?.focus({preventScroll:true});}
}
function shiftKeyboard(delta) {
  const next=Math.max(1,Math.min(8-state.keyboardOctaves,state.keyboardStart+delta));
  if(next===state.keyboardStart)return;
  state.keyboardStart=next;updateKeyboard(`[data-shift="${delta}"]:not([disabled])`);
}
function liveNote() { return `<div class="live-note" aria-live="polite"><strong data-note-display>—</strong><div><span data-note-name>${t('playNote')}</span><small data-note-detail>${t('listenPitch')}</small></div></div>`; }
function metronome() { return `<section class="metronome-card"><h2>${t('metroTitle')}</h2><p>${t('metroSub')}</p><div class="bpm-number" id="bpm-display">${tempo}</div><div class="bpm-label">BPM</div><input class="tempo-slider" type="range" min="40" max="160" value="${tempo}" id="tempo" aria-label="${t('tempoLabel')}"><div class="tempo-labels"><span>40 · ${t('slow')}</span><span>160 · ${t('fast')}</span></div><div class="beat-dots" aria-hidden="true">${[1,2,3,4].map(i=>`<span class="beat-dot">${i}</span>`).join('')}</div><button class="button dark" id="metro-toggle">${icon('play')} ${t('startMetro')}</button><div class="metronome-hint">${t('metroHint')}</div></section>`; }
function practicePage() { return `<div class="page-intro"><div class="eyebrow">${t('practiceEyebrow')}</div><h1>${t('practiceTitle')}</h1><p>${t('practiceSub')}</p></div><div class="studio-layout"><section class="studio-panel"><div class="studio-header"><h2>${t('keyboardTitle')}</h2><span data-full-range>${keyboardRange()}</span></div>${liveNote()}${keyboard()}<div class="studio-controls"><label class="volume-control">${icon('volume')}<input type="range" min="0" max="100" value="${volume*100}" id="volume" aria-label="${t('volume')}"></label><label class="switch-label"><input type="checkbox" id="show-labels" ${state.showLabels?'checked':''}> ${t('labels')}</label></div><div class="chord-section"><p>${t('colours')}</p><div class="chord-buttons"><button data-sound="major">${t('cMajor')} · C–E–G</button><button data-sound="minor">${t('cMinor')} · C–E♭–G</button><button data-sound="scale">${t('cScale')}</button></div><p class="chord-explanation" id="chord-explanation">${t('chordPrompt')}</p></div></section>${metronome()}</div><div class="practice-callout"><span>✦</span><div><strong>${t('littleExperiment')}</strong><p>${t('experiment')}</p></div></div><a class="section-link" href="#song">${t('trySong')} ${icon('arrow')}</a><p class="storage-note">${t(storageOK?'localStorage':'storageBlocked')}</p>`; }
const BUG_REPORT_URL='https://docs.google.com/forms/d/e/1FAIpQLScU4hfwG1GKvfNRginUifTrDEUrRqBJvGkXlnO14zVv0DmVLQ/viewform?usp=dialog';
const IMPROVEMENT_URL='https://docs.google.com/forms/d/e/1FAIpQLScGwrWh-jKMniqEQHdy7c8bPcGN6jcoF_fU2n79hbCnQ6LDUw/viewform?usp=dialog';
let songPhrase=0,songIndex=0,songPractising=false;
function songPage(){
  const p=window.PHIM_SONG[songPhrase];
  return `<div class="page-intro"><div class="eyebrow">${t('songEyebrow')}</div><h1>Happy Birthday</h1><p>${t('songIntro')}</p></div><div class="song-goals outcomes"><h2>${t('songGoals')}</h2><p>${t('songOutcome')}</p><p>${t('songMeter')}</p></div><div class="song-layout"><section class="studio-panel"><div class="phrase-tabs">${window.PHIM_SONG.map((p,i)=>`<button data-phrase="${i}" class="${i===songPhrase?'active':''}" aria-pressed="${i===songPhrase}">${t('phrase',{n:i+1})} ${state.songCompleted.includes(i)?'★':'☆'}</button>`).join('')}</div><h2>${t('phrase',{n:songPhrase+1})}</h2><figure class="score-example"><figcaption><strong>${t('songScore')}</strong><span>${t('songDurations')}</span></figcaption>${scoreSVG(p.notes,{durations:p.beats})}</figure><div class="song-note-strip">${p.notes.map((n,i)=>`<span data-song-note="${i}" class="${i<songIndex?'done':''}"><strong>${noteName(n)}</strong><small>${p.beats[i]} ${t('beatUnit',{n:p.beats[i]})}</small></span>`).join('')}</div><div class="song-actions"><button class="button soft" data-song-listen>${icon('volume')} ${t('listenPhrase')}</button><button class="button" data-song-practice>${t('practisePhrase')}</button><button class="button secondary" data-song-stop>${t('stop')}</button></div><div class="song-status" role="status" data-song-status>${t('songReady')}</div><div class="progress-track"><span data-song-progress style="width:${songIndex/p.notes.length*100}%"></span></div>${liveNote()}${keyboard()}</section><aside class="song-aside"><section class="progress-card"><h2>${t('yourBadges')}</h2><div class="song-stars">${[0,1,2,3].map(i=>`<span data-star="${i}" class="${state.songCompleted.includes(i)?'earned':''}" aria-label="${t('phrase',{n:i+1})}: ${state.songCompleted.includes(i)?t('completed'):t('notYet')}">★</span>`).join('')}</div><p data-song-reward>${t(state.songCompleted.length===4?'songComplete':'rewardHint')}</p><p>${t('lessonBadge',{n:state.completed.length})}</p></section><section class="thought-card"><h3>${t('practiceMethod')}</h3><ol><li>${t('method1')}</li><li>${t('method2')}</li><li>${t('method3')}</li></ol><a href="#lesson-12" data-lesson="12" class="section-link">${t('addChords')} ${icon('arrow')}</a></section></aside></div><p class="storage-note">${t('songCheckLimit')} ${t('localStorage')}</p>`;
}
async function listenSong(){
  const ctx=await ensureAudio();if(!ctx)return;
  cancelDemo();songPractising=false;updateSongUI();const gen=soundGeneration,p=window.PHIM_SONG[songPhrase],start=ctx.currentTime+.08;let delay=0;
  $('[data-song-status]').textContent=t('songListening');
  p.notes.forEach((n,i)=>{tone(n,start+delay,Math.max(.18,p.beats[i]*.75),1);const at=delay;setTimeout(()=>{if(gen!==soundGeneration)return;flash(n);showNote(n);$$('[data-song-note]').forEach((el,j)=>el.classList.toggle('current',i===j));},at*1000+80);delay+=p.beats[i]*.8;});
  setTimeout(()=>{if(gen!==soundGeneration)return;$$('[data-song-note]').forEach(el=>el.classList.remove('current'));updateSongUI();},delay*1000+90);
}
function updateSongUI(message){
  const status=$('[data-song-status]');if(!status)return;const p=window.PHIM_SONG[songPhrase];
  status.textContent=message||(songPractising?t('nextNote',{note:noteName(p.notes[songIndex])}):t('songReady'));
  $('[data-song-progress]').style.width=`${songIndex/p.notes.length*100}%`;
  $$('[data-song-note]').forEach((el,i)=>{el.classList.toggle('done',i<songIndex);el.classList.toggle('current',songPractising&&i===songIndex);});
}
function advanceSong(midi){
  const p=window.PHIM_SONG[songPhrase];if(midi!==p.notes[songIndex]){updateSongUI(t('noteHint',{played:noteName(midi),note:noteName(p.notes[songIndex])}));return;}
  songIndex++;
  if(songIndex===p.notes.length){songPractising=false;if(!state.songCompleted.includes(songPhrase))state.songCompleted.push(songPhrase);save();updateSongUI(t('phraseComplete',{n:songPhrase+1}));$(`[data-star="${songPhrase}"]`)?.classList.add('earned');const star=$(`[data-star="${songPhrase}"]`);if(star)star.setAttribute('aria-label',t('phrase',{n:songPhrase+1})+': '+t('completed'));$(`[data-phrase="${songPhrase}"]`).textContent=t('phrase',{n:songPhrase+1})+' ★';$('[data-song-reward]').textContent=t(state.songCompleted.length===4?'songComplete':'rewardHint');}
  else updateSongUI();
}
function feedbackPage(){return `<div class="page-intro"><div class="eyebrow">${t('feedbackEyebrow')}</div><h1>${t('feedbackTitle')}</h1><p>${t('feedbackIntro')}</p></div><div class="feedback-layout"><section class="feedback-card"><span class="feedback-icon">${icon('note')}</span><h2>${t('reportBug')}</h2><p>${t('reportBugText')}</p><ul><li>${t('reportDetail1')}</li><li>${t('reportDetail2')}</li><li>${t('reportDetail3')}</li></ul><a class="button" href="${BUG_REPORT_URL}" target="_blank" rel="noopener noreferrer">${t('openSurvey')} ${icon('arrow')}</a><p class="storage-note">${t('surveyExternal')}</p></section><section class="feedback-card"><h2>${t('suggestFeature')}</h2><p>${t('suggestText')}</p><a class="button soft" href="${IMPROVEMENT_URL}" target="_blank" rel="noopener noreferrer">${t('sendSuggestion')} ${icon('arrow')}</a><h3>${t('quickHelp')}</h3><p>${t('quickHelpText')}</p></section></div>`;}
function libraryPage() { return `<div class="page-intro"><div class="eyebrow">${t('libraryEyebrow')}</div><h1>${t('libraryTitle')}</h1><p>${t('librarySub')}</p></div><label class="search-box" style="display:block">${icon('search')}<input type="search" id="term-search" placeholder="${t('searchPlaceholder')}" aria-label="${t('search')}"></label><div class="terms-grid" id="terms-grid">${termCards(terms)}</div>`; }
function termCards(list) { return list.length ? list.map(term=>`<article class="term-card"><span class="term-en">${term.en}</span><h2>${term.name}</h2><p>${term.text}</p><div class="term-example">${term.example}</div>${term.demo?`<button class="button soft" data-sound="${term.demo}">${icon('volume')} ${t('listenDemo')}</button>`:term.route?`<a class="button soft" href="#${term.route}">${t('tryPractice')} ${icon('arrow')}</a>`:''}</article>`).join('') : `<p class="empty-search">${t('emptySearch')}</p>`; }
function languagePicker() { return `<label class="language-picker lesson-language"><span>${t('language')}</span><select data-language aria-label="${t('language')}"><option value="vi" lang="vi" ${state.language==='vi'?'selected':''}>Tiếng Việt</option><option value="en" lang="en" ${state.language==='en'?'selected':''}>English</option></select></label>`; }
function renderShell() {
  document.documentElement.lang=state.language;
  const content={'.brand-caption':'tagline','.nav-label':'space','.sidebar-note p':'sideStory','.sidebar-note>span:last-child':'curiosityStart','.sidebar-bottom strong':'newcomer','.sidebar-bottom div>span':'beginning','.footer .muted':'footer','.skip-link':'skip'};
  for(const [selector,key] of Object.entries(content))$(selector).innerHTML=t(key);
  $$('.brand,.header-logo').forEach(el=>el.setAttribute('aria-label',t('brandHome')));$('.main-nav').setAttribute('aria-label',t('nav'));$('.close-modal').setAttribute('aria-label',t('close'));
  $$('.nav-link').forEach(a=>$('span',a).textContent=t(a.dataset.route));
  $$('[data-copy]').forEach(el=>el.textContent=t(el.dataset.copy));
  $$('.footer>span')[1].innerHTML=`${t('madeWith')} <span class="orange">✦</span>`;
  $$('[data-language]').forEach(el=>{el.value=state.language;el.setAttribute('aria-label',t('language'));});
}
let route = 'home';
function render() {
  stopMetronome();refreshLocale();renderShell();
  route = Object.hasOwn(routeTitles, location.hash.slice(1)) ? location.hash.slice(1) : 'home';
  $('#main').innerHTML = ({home:homePage,learn:learnPage,practice:practicePage,song:songPage,library:libraryPage,feedback:feedbackPage})[route]();
  $('#breadcrumb').textContent = routeTitles[route];
  $$('.nav-link').forEach(a => { a.classList.toggle('active',a.dataset.route === route); if(a.dataset.route===route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current'); });
  document.title = `${routeTitles[route]} · phím. — ${state.language==='en'?'Understand, then play':'Hiểu rồi chơi'}`;
}

let audioCtx, volume = .6, soundGeneration = 0, activeNodes = new Set();
async function ensureAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if(!AudioCtor) { toast(t('audioUnavailable')); return null; }
  if(!audioCtx) audioCtx = new AudioCtor();
  if(audioCtx.state === 'suspended') await audioCtx.resume();
  return audioCtx;
}
function tone(midi, when, duration = 1.2, strength = 1) {
  if(!audioCtx || volume === 0)return;
  const frequency = 440 * Math.pow(2,(midi - 69)/12);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0,when);
  gain.gain.linearRampToValueAtTime(volume * .19 * strength,when + .009);
  gain.gain.exponentialRampToValueAtTime(.001,when+duration);
  gain.connect(audioCtx.destination);
  [1,2,3,4].forEach((harmonic,i)=>{
    const oscillator = audioCtx.createOscillator(), partial = audioCtx.createGain();
    oscillator.type='sine';oscillator.frequency.value=frequency*harmonic;
    partial.gain.value=[1,.28,.1,.035][i];oscillator.connect(partial);partial.connect(gain);
    oscillator.start(when);oscillator.stop(when+duration+.03);activeNodes.add(oscillator);
    oscillator.onended=()=>{activeNodes.delete(oscillator);oscillator.disconnect();partial.disconnect();if(i===3)gain.disconnect();};
  });
}
function flash(midi) {
  $$(`[data-midi="${midi}"]`).forEach(key=>{key.classList.add('pressed');setTimeout(()=>key.classList.remove('pressed'),260);});
}
function showNote(midi) {
  $$('[data-note-display]').forEach(el=>el.textContent=noteName(midi));
  $$('[data-note-name]').forEach(el=>el.textContent=solfege(midi));
  $$('[data-note-detail]').forEach(el=>el.textContent=`${Math.round(440*Math.pow(2,(midi-69)/12))} Hz · ${midi===60?t('middleC'):t('octaveNumber',{n:Math.floor(midi/12)-1})}`);
}
async function playKey(midi) {
  const ctx=await ensureAudio();
  if(ctx)tone(midi,ctx.currentTime);
  flash(midi);showNote(midi);
  if(activeLesson && !lessonCompletedView) advanceTask(midi);
  else if(route==='song' && songPractising) advanceSong(midi);
}
async function playSound(kind) {
  const ctx=await ensureAudio();if(!ctx)return;
  cancelDemo();const generation=soundGeneration;const start=ctx.currentTime+.025;
  let events=[];
  if(kind.startsWith('course-')) events=lessonData.find(l=>l.id===Number(kind.slice(7))).demo.map((notes,i)=>[i*.8,notes]);
  if(kind==='major')events=[[0,[60,64,67]]];
  if(kind==='minor')events=[[0,[60,63,67]]];
  if(kind==='compare')events=[[0,[60,64,67]],[1.7,[60,63,67]]];
  if(kind==='octave')events=[[0,[60]],[.9,[72]]];
  if(kind==='semitone')events=[[0,[64]],[.75,[65]]];
  if(kind==='scale')events=[60,62,64,65,67,69,71,72].map((n,i)=>[i*.32,[n]]);
  if(route==='practice'&&!activeLesson){const transpose=keyboardBase()-60;events=events.map(([delay,notes])=>[delay,notes.map(n=>n+transpose)]);}
  for(const [delay,notes] of events){
    for(const n of notes)tone(n,start+delay,1.4,notes.length>1?.65:1);
    setTimeout(()=>{if(generation!==soundGeneration)return;notes.forEach(flash);showNote(notes[0]);},delay*1000+25);
  }
  const explanations={major:t('majorExplanation'),minor:t('minorExplanation'),scale:t('scaleExplanation')};
  if($('#chord-explanation')&&explanations[kind])$('#chord-explanation').textContent=explanations[kind];
  $$('.chord-buttons button').forEach(b=>b.classList.toggle('active',b.dataset.sound===kind));
}
function cancelDemo(){soundGeneration++;if(audioCtx){for(const node of activeNodes){try{node.stop();}catch{}}activeNodes.clear();}}
let tempo=60,metroRunning=false,metroTimer=null,metroBeat=0,metroNextTime=0,metroGeneration=0;
async function startMetronome(){
  const ctx=await ensureAudio();if(!ctx)return;
  metroRunning=true;metroBeat=0;metroNextTime=ctx.currentTime+.05;metroGeneration++;
  $('#metro-toggle').innerHTML=`■ &nbsp; ${t('stopMetro')}`;
  function schedule(){
    if(!metroRunning)return;
    while(metroNextTime<ctx.currentTime+.12){
      const beat=metroBeat%4,at=metroNextTime,gen=metroGeneration;
      clickTone(at,beat===0);
      setTimeout(()=>{if(!metroRunning||gen!==metroGeneration)return;$$('.beat-dot').forEach((d,i)=>d.classList.toggle('on',i===beat));},Math.max(0,(at-ctx.currentTime)*1000));
      metroNextTime+=60/tempo;metroBeat++;
    }
    metroTimer=setTimeout(schedule,25);
  }
  schedule();
}
function clickTone(at,accent=false){
  const osc=audioCtx.createOscillator(),g=audioCtx.createGain();
  osc.frequency.value=accent?1100:800;g.gain.setValueAtTime(.12,at);g.gain.exponentialRampToValueAtTime(.001,at+.055);osc.connect(g);g.connect(audioCtx.destination);osc.start(at);osc.stop(at+.06);osc.onended=()=>{osc.disconnect();g.disconnect();};
}
function stopMetronome(){metroRunning=false;metroGeneration++;clearTimeout(metroTimer);$$('.beat-dot').forEach(d=>d.classList.remove('on'));if($('#metro-toggle'))$('#metro-toggle').innerHTML=`${icon('play')} ${t('startMetro')}`;}
let activeLesson=null,passed=false,returnFocus=null;
let taskIndex=0, lessonFlow=window.PHIM_LESSON_FLOW.initial(), lessonCompletedView=false;
function readingPage(l){
  return `<div class="lesson-reading"><div class="lesson-topline">${t('flowRead')}</div><h2 id="lesson-title">${l.title}</h2><p class="lesson-lead">${l.description}</p>${lessonFlow.reviewRequired?`<div class="review-notice" role="status"><strong>${t('reviewTitle')}</strong><p>${t('reviewMessage')}</p></div>`:''}<div class="learning-goal"><div><strong>${t('afterLesson')}</strong><ul>${l.goals.map(g=>`<li>${g}</li>`).join('')}</ul></div></div><section class="lesson-section"><h3>${t('understand')}</h3>${l.theory.map(p=>`<p>${p}</p>`).join('')}<div class="concept-box">${l.concept}</div>${scoreFigure(l)}<button class="button soft reading-listen" data-sound="course-${l.id}">${icon('volume')} ${t('listenExample')}</button></section></div>`;
}
function quizPage(l){
  const questions=window.PHIM_QUIZZES[l.id],q=questions[lessonFlow.index],answered=!!lessonFlow.feedback;
  return `<section class="quiz-page"><div class="quiz-meta"><span>${t('quizQuestion',{n:lessonFlow.index+1,total:questions.length})}</span><span>${t('quizMistakes',{n:lessonFlow.mistakes})}</span></div><h2 id="lesson-title">${L(q.question)}</h2><p class="quiz-instruction">${t('quizSelect')}</p><div class="quiz-options" role="group" aria-labelledby="lesson-title">${L(q.options).map((option,i)=>`<button type="button" class="quiz-option ${lessonFlow.choice===i?'selected':''} ${answered&&lessonFlow.choice===i?lessonFlow.feedback:''}" data-choice="${i}" aria-pressed="${lessonFlow.choice===i}" ${answered?'disabled':''}><span class="choice-letter">${String.fromCharCode(65+i)}</span><span>${option}</span>${answered&&lessonFlow.choice===i?icon(lessonFlow.feedback==='correct'?'check':'close'):''}</button>`).join('')}</div><div class="quiz-feedback ${lessonFlow.feedback||''}" role="status" aria-live="polite" aria-atomic="true">${lessonFlow.feedback==='correct'?`<strong>${t('quizCorrect')}</strong><p>${L(q.explanation)}</p>`:lessonFlow.feedback==='wrong'?`<strong>${t('quizWrong')}</strong><p>${t('quizWrongHelp',{n:4-lessonFlow.mistakes})}</p>`:''}</div><p class="quiz-policy">${t('quizPolicy')}</p></section>`;
}
function practiceLessonPage(l){
  return `<section class="lesson-practice"><div class="lesson-topline">${t('flowPractice')}</div><h2 id="lesson-title">${t('practiceAfterQuiz')}</h2><p class="lesson-lead">${l.task}</p><button class="button soft" data-sound="course-${l.id}">${icon('volume')} ${t('listenExample')}</button><div class="task-track" aria-live="polite"><span data-task-count>${taskIndex}/${l.target.length}</span><strong data-task-next>${taskIndex>=l.target.length?t('taskDone'):t('nextNote',{note:noteName(l.target[taskIndex])})}</strong><button class="text-button" data-retry-task>${t('retryTask')}</button></div>${liveNote()}${keyboard()}<p class="storage-note">${t('practiceCheckLimit')}</p></section>`;
}
function lessonFooter(l){
  if(lessonFlow.stage==='read')return `<p>${t('readBeforeQuiz',{n:window.PHIM_QUIZZES[l.id].length})}</p><button class="button" data-begin-quiz>${t(lessonFlow.reviewRequired?'restartQuiz':'beginQuiz')} ${icon('arrow')}</button>`;
  if(lessonFlow.stage==='quiz')return `<p>${t('quizFooter')}</p>${!lessonFlow.feedback?`<button class="button" data-check-quiz ${lessonFlow.choice===null?'disabled':''}>${t('checkChoice')} ${icon('check')}</button>`:`<button class="button" data-advance-quiz>${t(lessonFlow.feedback==='wrong'?'retryQuestion':lessonFlow.index===window.PHIM_QUIZZES[l.id].length-1?'quizToPractice':'quizNext')} ${icon('arrow')}</button>`}`;
  return `<p>${t('practiceFinishHint')}</p><button class="button" id="complete-lesson" ${passed?'':'disabled'}>${t('finish')} ${icon('check')}</button>`;
}
function refreshPass(){
  const l=lessonData.find(l=>l.id===activeLesson);
  passed=!!l&&lessonFlow.stage==='practice'&&taskIndex>=l.target.length;
  const b=$('#complete-lesson');if(b)b.disabled=!passed;
}
function advanceTask(midi){
  if(lessonFlow.stage!=='practice')return;
  const l=lessonData.find(l=>l.id===activeLesson);if(taskIndex>=l.target.length)return;
  if(midi===l.target[taskIndex]){taskIndex++;$('[data-task-count]').textContent=`${taskIndex}/${l.target.length}`;$('[data-task-next]').textContent=taskIndex===l.target.length?t('taskDone'):t('nextNote',{note:noteName(l.target[taskIndex])});}
  else $('[data-task-next]').textContent=t('noteHint',{played:noteName(midi),note:noteName(l.target[taskIndex])});
  refreshPass();
}
// Staff geometry: bottom treble line E4=64, bottom bass line G2=43.
function scoreSVG(notes,{clef='treble',labels=true,width=620,time='',durations=[],harmony=false}={}){
  const letters={0:0,1:0,2:1,3:2,4:2,5:3,6:4,7:4,8:4,9:5,10:5,11:6};
  const diatonic=m=>7*(Math.floor(m/12)-1)+letters[m%12];
  const bottom=clef==='bass'?diatonic(43):diatonic(64);
  const left=time?116:85,step=(width-left-34)/Math.max(notes.length-1,1);
  const lines=[48,60,72,84,96].map(y=>`<line x1="25" x2="${width-12}" y1="${y}" y2="${y}"/>`).join('');
  const glyph=clef==='bass'?'𝄢':'𝄞';
  const seenAccidentals=new Map();
  const heads=notes.map((group,i)=>{
    group=Array.isArray(group)?group:[group]; const x=notes.length===1?width/2:left+i*step;
    return group.map(m=>{const d=diatonic(m)-bottom,y=96-6*d;let ledger='';
      for(let q=-2;q>=d;q-=2)ledger+=`<line class="score-ledger" x1="${x-13}" x2="${x+13}" y1="${96-q*6}" y2="${96-q*6}"/>`;
      for(let q=10;q<=d;q+=2)ledger+=`<line class="score-ledger" x1="${x-13}" x2="${x+13}" y1="${96-q*6}" y2="${96-q*6}"/>`;
      const altered=[1,3,6,8,10].includes(m%12);
      const sign=altered?([3,6,10].includes(m%12)?'♭':'♯'):(seenAccidentals.get(d)?'♮':'');
      seenAccidentals.set(d,altered);
      const accidental=sign?`<text x="${x-22}" y="${y+4}" class="score-flat">${sign}</text>`:'';
      const label=noteName(m).replace('D♯','E♭').replace('F♯','G♭').replace('A♯','B♭');
      const duration=durations[i]??1;const down=harmony?group.reduce((sum,n)=>sum+96-6*(diatonic(n)-bottom),0)/group.length<72:y<72;
      const stemX=x+(down?-7:7),stemY=y+(down?34:-34);
      return `${ledger}${accidental}<ellipse cx="${x}" cy="${y}" rx="7.5" ry="5" transform="rotate(-18 ${x} ${y})" class="score-note" style="${duration>=2?'fill:#fbfaf6':''}"/>${duration<4?`<path class="score-stem" d="M${stemX} ${y}V${stemY}"/>`:''}${duration===.5?`<path class="score-stem" fill="none" d="M${stemX} ${stemY}q${down?'-14 -4 -7 -18':'14 4 7 18'}"/>`:''}${labels?`<text x="${x}" y="${harmony?y+4:147}" text-anchor="${harmony?'start':'middle'}" dx="${harmony?15:0}" class="score-under">${label}</text>`:''}`;
    }).join('');
  }).join('');
  return `<svg viewBox="0 0 ${width} 170" role="img" aria-label="${t('scoreAlt')}"><g class="score-staff">${lines}<text x="25" y="${clef==='bass'?83:91}" class="score-clef">${glyph}</text>${time?`<text x="83" y="70" class="score-time">${time}</text><text x="83" y="91" class="score-time">4</text>`:''}${heads}${time?`<line class="score-bar" x1="${width-15}" x2="${width-15}" y1="48" y2="96"/>`:''}</g></svg>`;
}
function scoreFigure(l){
  let body='';
  const labels=items=>`<div class="visual-labels">${items.map(x=>`<span>${x}</span>`).join('')}</div>`;
  if(l.figure==='map')body=`<div class="map-piano">${['C','D','E','F','G','A','B'].map((n,i)=>`<div>${n}${[0,1,3,4,5].includes(i)?'<b></b>':''}</div>`).join('')}</div>${labels([t('twoBlack'),t('threeBlack')])}`;
  if(l.figure==='octave')body=scoreSVG([60,72])+labels(['C4 → C5 = 12 '+t('semitones')]);
  if(l.figure==='treble')body=scoreSVG([64,67,71,74,77])+scoreSVG([65,69,72,76]);
  if(l.figure==='grand')body=`<div class="grand-staff">${scoreSVG([60])}${scoreSVG([60],{clef:'bass'})}</div>${labels([t('sameMiddleC')])}`;
  if(l.figure==='ledger')body=scoreSVG([60,62,64,77,79,81]);
  if(l.figure==='values')body=`<div class="note-values">${[['𝅝','𝄻','4'],['𝅗𝅥','𝄼','2'],['♩','𝄽','1'],['♪','𝄾','½']].map(([n,r,b])=>`<div><strong>${n}</strong><strong>${r}</strong><span>${b} ${t('beatUnit',{n:b=='1'?1:2})}</span></div>`).join('')}</div><p>${t('restLegend')}</p>`;
  if(l.figure==='meter')body=scoreSVG([60,60,60,60],{time:'4'})+scoreSVG([60,60,60],{time:'3'});
  if(l.figure==='accidentals')body=scoreSVG([64,65,63,64])+labels(['E → F (E♯)','E♭ → E♮']);
  if(l.figure==='intervals')body=scoreSVG([60,64,60,63,60,67])+labels([t('majorThird'),t('minorThird'),t('perfectFifth')]);
  if(l.figure==='scale')body=scoreSVG([60,62,64,65,67,69,71,72])+labels(['2 – 2 – 1 – 2 – 2 – 2 – 1']);
  if(l.figure==='triads')body=labels(['C','Cm','Cdim'])+scoreSVG([[60,64,67],[60,63,67],[60,63,66]],{harmony:true});
  if(l.figure==='inversions')body=labels([t('rootPosition'),t('inversion1'),t('inversion2')])+scoreSVG([[60,64,67],[64,67,72],[67,72,76]],{harmony:true});
  return `<figure class="score-example"><figcaption><strong>${t('visualExample')} · ${l.title}</strong><span>${l.concept}</span></figcaption>${body}</figure>`;
}

function renderLesson(focusPage=false){
  const l=lessonData.find(x=>x.id===activeLesson);if(!l)return;
  refreshPass();
  const total=window.PHIM_QUIZZES[l.id].length,stage=lessonCompletedView?'complete':lessonFlow.stage;
  const progress=stage==='complete'?100:stage==='read'?0:stage==='practice'?90:Math.round(10+80*(lessonFlow.index+(lessonFlow.feedback==='correct'?1:0))/total);
  const step=stage==='read'?0:stage==='quiz'?1:2;
  $('#lesson-content').innerHTML=`<header class="lesson-run-header"><div class="lesson-run-progress"><div class="lesson-run-meta"><span>${t('lesson')} ${pad(l.id)} / 12</span><span>${t(stage==='complete'?'completed':stage==='read'?'flowRead':stage==='quiz'?'flowQuiz':'flowPractice')}</span></div><div class="lesson-progress" role="progressbar" aria-label="${t('lessonProgress')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div></div>${languagePicker()}</header><div class="lesson-stage-strip" aria-label="${t('lessonSteps')}">${['flowRead','flowQuiz','flowPractice'].map((key,i)=>`<span class="${i===step?'current':i<step?'done':''}" ${i===step?'aria-current="step"':''}>${i<step?'✓':i+1}. ${t(key)}</span>`).join('')}</div><div class="lesson-page" tabindex="-1">${lessonCompletedView?completionHTML(l.id):stage==='read'?readingPage(l):stage==='quiz'?quizPage(l):practiceLessonPage(l)}</div>${lessonCompletedView?'':`<footer class="lesson-run-footer">${lessonFooter(l)}</footer>`}`;
  if(focusPage){$('.lesson-page').focus({preventScroll:true});$('.lesson-page').scrollTop=0;}
}
function openLesson(id){
  if(!lessonData.some(x=>x.id===id))return;
  if(!window.PHIM_LESSON_FLOW.canOpen(id,state.completed)){toast(t('lockedUntil',{n:id-1}));return;}
  if($('#lesson-modal').hidden)returnFocus=document.activeElement;
  cancelDemo();stopMetronome();activeLesson=id;passed=false;taskIndex=0;lessonFlow=window.PHIM_LESSON_FLOW.initial();lessonCompletedView=false;renderLesson();
  $('#lesson-modal').hidden=false;document.body.style.overflow='hidden';$('.app-shell').inert=true;$('.sidebar').inert=true;$('.lesson-page').focus();
}
function closeLesson(){cancelDemo();activeLesson=null;$('#lesson-modal').hidden=true;document.body.style.overflow='';$('.app-shell').inert=false;$('.sidebar').inert=false;if(returnFocus?.isConnected)returnFocus.focus();else $('#main').focus({preventScroll:true});}
function beginLessonQuiz(){if(!activeLesson)return;cancelDemo();lessonFlow=window.PHIM_LESSON_FLOW.startQuiz(lessonFlow);taskIndex=0;renderLesson(true);}
function chooseQuizAnswer(value){
  if(!activeLesson||lessonFlow.stage!=='quiz')return;
  const question=window.PHIM_QUIZZES[activeLesson][lessonFlow.index];
  const next=window.PHIM_LESSON_FLOW.choose(lessonFlow,value,question);if(next===lessonFlow)return;
  lessonFlow=next;renderLesson();$(`[data-choice="${value}"]`)?.focus({preventScroll:true});
}
function checkQuizAnswer(){
  if(!activeLesson||lessonFlow.stage!=='quiz')return;
  const question=window.PHIM_QUIZZES[activeLesson][lessonFlow.index];
  const next=window.PHIM_LESSON_FLOW.check(lessonFlow,question);if(next===lessonFlow)return;
  lessonFlow=next;renderLesson(lessonFlow.stage==='read');
  if(lessonFlow.stage==='quiz')$('[data-advance-quiz]')?.focus({preventScroll:true});
}
function advanceQuiz(){
  if(!activeLesson)return;
  lessonFlow=window.PHIM_LESSON_FLOW.advance(lessonFlow,window.PHIM_QUIZZES[activeLesson].length);renderLesson(true);
}

function completionHTML(id){
  const next=lessonData.find(l=>!state.completed.includes(l.id));
  return `<div class="completion-state"><div class="completion-icon">${icon('check')}</div><div class="lesson-topline">${t('understoodMore')}</div><h2 id="lesson-title">${t('congratulations')}</h2><p>${lessonData.find(l=>l.id===id).goals.join(' ')}</p><div class="reward-badge">${icon('check')} ${t('lessonBadge',{n:state.completed.length})}</div><a href="#song" class="button soft" data-close-route>${t('trySong')}</a>${next?`<button class="button" data-lesson="${next.id}">${t('nextLesson',{n:next.id})} ${icon('arrow')}</button>`:`<a href="#practice" class="button" data-close-route>${t('enterPractice')} ${icon('piano')}</a>`}<button class="button secondary" data-close>${t('backHome')}</button><div class="storage-note">${t(storageOK?'saved':'storageBlocked')}</div></div>`;
}
function completeLesson(){
  if(!passed||!activeLesson)return;
  if(!state.completed.includes(activeLesson))state.completed.push(activeLesson);save();
  lessonCompletedView=true;render();renderLesson();$('.lesson-dialog').focus();$('#lesson-modal').scrollTop=0;
}
function changeLanguage(language){
  if(!['vi','en'].includes(language)||language===state.language)return;
  const scroll=$('.lesson-page')?.scrollTop||0;
  state.language=language;songPractising=false;save();cancelDemo();render();
  if(activeLesson){renderLesson();$('.lesson-page').scrollTop=scroll;$('[data-language]',$('#lesson-modal'))?.focus({preventScroll:true});}
  else $('[data-language]',$('.topbar')).focus({preventScroll:true});
}

let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4000);}
document.addEventListener('click',event=>{
  if(event.target.closest('[data-retry-task]')){taskIndex=0;renderLesson();return;}
  if(event.target.closest('[data-begin-quiz]')){beginLessonQuiz();return;}
  const choice=event.target.closest('[data-choice]');if(choice){chooseQuizAnswer(Number(choice.dataset.choice));return;}
  if(event.target.closest('[data-check-quiz]')){checkQuizAnswer();return;}
  if(event.target.closest('[data-advance-quiz]')){advanceQuiz();return;}
  const phrase=event.target.closest('[data-phrase]');if(phrase){songPhrase=Number(phrase.dataset.phrase);songIndex=0;songPractising=false;cancelDemo();render();return;}
  if(event.target.closest('[data-song-listen]')){listenSong();return;}
  if(event.target.closest('[data-song-practice]')){cancelDemo();songIndex=0;songPractising=true;updateSongUI();return;}
  if(event.target.closest('[data-song-stop]')){cancelDemo();songPractising=false;updateSongUI();return;}
  const shift=event.target.closest('[data-shift]');if(shift){shiftKeyboard(Number(shift.dataset.shift));return;}
  const lesson=event.target.closest('[data-lesson]');if(lesson){event.preventDefault();openLesson(Number(lesson.dataset.lesson));return;}
  if(event.target.closest('.close-modal,[data-close]')){closeLesson();return;}
  if(event.target.closest('[data-close-route]')){closeLesson();return;}
  const sound=event.target.closest('[data-sound]');if(sound){playSound(sound.dataset.sound).catch(()=>toast(t('audioError')));return;}
  const key=event.target.closest('[data-midi]');if(key){playKey(Number(key.dataset.midi)).catch(()=>toast(t('audioError')));return;}
  if(event.target.closest('#complete-lesson')){completeLesson();return;}
  if(event.target.closest('#metro-toggle')){if(metroRunning)stopMetronome();else startMetronome().catch(()=>toast(t('metroError')));return;}
  if(event.target.closest('#rhythm-demo')){ensureAudio().then(ctx=>{if(!ctx)return;for(let i=0;i<4;i++)clickTone(ctx.currentTime+.05+i,i===0);}).catch(()=>toast('Chưa mở được âm thanh. Hãy thử lại.'));}
});
const normalise=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
document.addEventListener('input',event=>{
  if(event.target.id==='volume')volume=Number(event.target.value)/100;
  if(event.target.id==='tempo'){tempo=Number(event.target.value);$('#bpm-display').textContent=tempo;}
  if(event.target.id==='term-search'){const q=normalise(event.target.value.trim());$('#terms-grid').innerHTML=termCards(terms.filter(t=>normalise(t.name+' '+t.en+' '+t.text).includes(q)));}
});
document.addEventListener('change',event=>{
  if(event.target.matches('[data-language]'))changeLanguage(event.target.value);
  if(event.target.matches('[data-octaves]')){state.keyboardOctaves=Number(event.target.value);state.keyboardStart=Math.min(state.keyboardStart,8-state.keyboardOctaves);updateKeyboard('[data-octaves]');}
  if(event.target.id==='show-labels'){state.showLabels=event.target.checked;save();$$('.key-name').forEach(el=>el.hidden=!state.showLabels);}
});
document.addEventListener('keydown',event=>{
  const modalOpen=!$('#lesson-modal').hidden;
  if(event.key==='Escape'&&modalOpen){closeLesson();return;}
  if(event.key==='Tab'&&modalOpen){const controls=$$('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex=\"0\"]',$('.lesson-dialog')).filter(el=>el.getClientRects().length);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===$('.lesson-dialog'))){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}return;}
  if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
  if((modalOpen&&(lessonCompletedView||lessonFlow.stage!=='practice'))||(!modalOpen&&!['practice','song'].includes(route)))return;
  const offset=pianoCodes.indexOf(event.code);
  const midi=offset<0||offset>state.keyboardOctaves*12?null:keyboardBase()+offset;
  if(midi!==null){event.preventDefault();playKey(midi).catch(()=>toast(t('audioError')));}

});
window.addEventListener('hashchange',()=>{cancelDemo();songPractising=false;if(!$('#lesson-modal').hidden)closeLesson();render();window.scrollTo({top:0,behavior:'instant'});const lessonHash=location.hash.match(/^#lesson-(\d+)$/);if(lessonHash)openLesson(Number(lessonHash[1]));else $('#main').focus({preventScroll:true});});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMetronome();cancelDemo();save();}});
window.addEventListener('pagehide',save);
setInterval(()=>{if(!document.hidden&&route==='practice'&&$('#lesson-modal').hidden){state.practiceSeconds+=5;save();}},5000);
render();
const initialLessonHash=location.hash.match(/^#lesson-(\d+)$/);if(initialLessonHash)openLesson(Number(initialLessonHash[1]));
