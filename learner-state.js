'use strict';
(function(root){
  const VERSION='reading-20-v1';
  const defaults=()=>({curriculumVersion:2,completed:[],songCompleted:[],practiceSeconds:0,language:'vi',keyboardStart:3,keyboardOctaves:3,showLabels:true,volume:.6,profile:{displayName:''},sessions:{},lastLesson:null});
  const integer=(x,min,max,fallback)=>Number.isInteger(x)&&x>=min&&x<=max?x:fallback;
  const unique=(xs,max)=>Array.isArray(xs)?[...new Set(xs.filter(n=>Number.isInteger(n)&&n>=1&&n<=max))]:[];
  function cleanSession(raw,lesson,questions,readings,flow){
    if(!raw||raw.version!==VERSION||!raw.flow||!Array.isArray(raw.flow.orders))return null;
    const input=raw.flow,total=questions.length,steps=readings.length;
    const result=flow.initial();
    result.stage=['read','quiz','practice'].includes(input.stage)?input.stage:'read';
    result.readSeen=integer(input.readSeen,0,steps-1,0);result.readIndex=integer(input.readIndex,0,result.readSeen,0);
    result.index=integer(input.index,0,total,0);result.mistakes=integer(input.mistakes,0,4,0);
    result.orders=input.orders.length===total?input.orders.map((order,i)=>Array.isArray(order)&&order.length===questions[i].options[0].length&&order.every(n=>Number.isInteger(n)&&n>=0&&n<order.length)&&new Set(order).size===order.length?order:null):[];
    result.missed=Array.isArray(input.missed)?[...new Set(input.missed.filter(id=>questions.some(q=>q.id===id)))]:[];
    result.reviewRequired=input.reviewRequired===true;
    if(result.stage!=='read'&&(result.orders.length!==total||result.orders.some(x=>!x)||result.readSeen!==steps-1||result.mistakes>3||(result.stage==='quiz'&&result.index>=total)||(result.stage==='practice'&&result.index!==total)))return null;
    if(result.orders.some(x=>!x))result.orders=[];
    if(result.stage==='quiz'){
      const q=flow.currentQuestion(questions,result);
      result.choice=integer(input.choice,0,3,null);
      result.feedback=['correct','wrong'].includes(input.feedback)&&result.choice!==null?(result.choice===q.correct?'correct':'wrong'):null;
    }
    if(result.stage==='practice'&&input.practice){
      const p=input.practice,clean=flow.initialPractice();
      clean.mode=['train','test','failed','passed'].includes(p.mode)?p.mode:'train';
      clean.index=integer(p.index,0,lesson.target.length,0);clean.failures=integer(p.failures,0,2,0);
      clean.lastWrong=integer(p.lastWrong,0,127,null);clean.redirected=p.redirected===true;
      if(clean.mode==='passed'&&clean.index!==lesson.target.length)return null;
      if(clean.mode==='failed')clean.index=0;
      result.practice=clean;
    }
    return {version:VERSION,updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt.slice(0,40):'',flow:result};
  }
  function sanitise(raw,course,bank,readings,flow){
    const state=defaults();if(!raw||typeof raw!=='object')return state;
    const old=raw.curriculumVersion!==2;
    state.completed=unique(old?unique(raw.completed,3).map(n=>({1:1,2:7,3:11}[n])):raw.completed,course.length);
    state.songCompleted=Array.isArray(raw.songCompleted)?[...new Set(raw.songCompleted.filter(n=>Number.isInteger(n)&&n>=0&&n<=3))]:[];
    state.practiceSeconds=Number.isFinite(raw.practiceSeconds)?Math.min(1e9,Math.max(0,raw.practiceSeconds)):0;
    state.language=raw.language==='en'?'en':'vi';state.keyboardOctaves=[1,2,3].includes(raw.keyboardOctaves)&&!old?raw.keyboardOctaves:3;
    state.keyboardStart=integer(raw.keyboardStart,1,8-state.keyboardOctaves,3);state.showLabels=raw.showLabels!==false;
    state.volume=typeof raw.volume==='number'&&Number.isFinite(raw.volume)?Math.max(0,Math.min(1,raw.volume)):.6;
    state.profile.displayName=typeof raw.profile?.displayName==='string'?raw.profile.displayName.trim().slice(0,40):'';
    for(const lesson of course){
      const session=cleanSession(raw.sessions?.[lesson.id],lesson,bank[lesson.id],readings[lesson.id],flow);
      if(session)state.sessions[lesson.id]=session;
    }
    state.lastLesson=integer(raw.lastLesson,1,course.length,null);
    return state;
  }
  function backup(state){return {format:'phim-progress',version:1,exportedAt:new Date().toISOString(),state};}
  function restore(value,course,bank,readings,flow){
    if(!value||value.format!=='phim-progress'||value.version!==1||!value.state||typeof value.state!=='object'||!Array.isArray(value.state.completed))throw new Error('Invalid progress backup');
    return sanitise(value.state,course,bank,readings,flow);
  }
  const api={VERSION,defaults,sanitise,cleanSession,backup,restore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.PHIM_LEARNER=api;
})(typeof window!=='undefined'?window:null);
