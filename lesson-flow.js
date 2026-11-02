'use strict';
(function(root){
  const initial=()=>({stage:'read',index:0,mistakes:0,choice:null,feedback:null,reviewRequired:false});
  function canOpen(id,completed){
    return Number.isInteger(id)&&id>=1&&id<=12&&Array.from({length:id-1},(_,i)=>i+1).every(n=>completed.includes(n));
  }
  function startQuiz(flow){return flow.stage==='read'?{...initial(),stage:'quiz'}:flow;}
  function choose(flow,value,question){
    if(flow.stage!=='quiz'||flow.feedback||!Number.isInteger(value)||value<0||value>=question.options[0].length)return flow;
    return {...flow,choice:value};
  }
  function check(flow,question){
    if(flow.stage!=='quiz'||flow.feedback||flow.choice===null)return flow;
    if(flow.choice===question.correct)return {...flow,feedback:'correct'};
    const mistakes=flow.mistakes+1;
    if(mistakes>3)return {...initial(),reviewRequired:true};
    return {...flow,mistakes,feedback:'wrong'};
  }
  function advance(flow,total){
    if(flow.stage!=='quiz'||!flow.feedback)return flow;
    if(flow.feedback==='wrong')return {...flow,choice:null,feedback:null};
    return {...flow,stage:flow.index+1===total?'practice':'quiz',index:flow.index+1,choice:null,feedback:null};
  }
  const api={initial,canOpen,startQuiz,choose,check,advance};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.PHIM_LESSON_FLOW=api;
})(typeof window!=='undefined'?window:null);
