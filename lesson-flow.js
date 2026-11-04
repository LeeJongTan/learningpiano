'use strict';
(function(root){
  const initialPractice=()=>({mode:'train',index:0,failures:0,lastWrong:null,redirected:false});
  const initial=()=>({stage:'read',readIndex:0,readSeen:0,index:0,mistakes:0,choice:null,feedback:null,reviewRequired:false,missed:[],orders:[],practice:initialPractice()});
  function canOpen(id,completed,total=20,fullAccess=false){
    return Number.isInteger(id)&&id>=1&&id<=total&&(fullAccess===true||Array.from({length:id-1},(_,i)=>i+1).every(n=>completed.includes(n)));
  }
  function readStep(flow,index,total){
    if(flow.stage!=='read'||!Number.isInteger(index)||index<0||index>=total||index>flow.readSeen+1)return flow;
    return {...flow,readIndex:index,readSeen:Math.max(flow.readSeen,index)};
  }
  function newOrders(questions,previous=[],random=Math.random){
    return questions.map((q,k)=>{
      const order=q.options[0].map((_,i)=>i);
      for(let i=order.length-1;i>0;i--){const j=Math.min(i,Math.max(0,Math.floor(random()*(i+1))));[order[i],order[j]]=[order[j],order[i]];}
      // Guarantee a changed correct-answer position in a new run, even if the
      // random draw happens to put it in the previous position.
      if(previous[k]&&order.indexOf(q.correct)===previous[k].indexOf(q.correct))order.push(order.shift());
      return order;
    });
  }
  function currentQuestion(questions,flow){
    const q=questions[flow.index];if(!q)return null;
    const order=flow.orders[flow.index]||q.options[0].map((_,i)=>i);
    return {...q,options:q.options.map(options=>order.map(i=>options[i])),correct:order.indexOf(q.correct)};
  }
  function startQuiz(flow,questions,stepCount,random=Math.random){
    if(flow.stage!=='read'||flow.readSeen<stepCount-1)return flow;
    return {...initial(),stage:'quiz',readSeen:stepCount-1,readIndex:flow.readIndex,orders:newOrders(questions,flow.orders,random)};
  }
  function choose(flow,value,question){
    if(flow.stage!=='quiz'||flow.feedback||!question||!Number.isInteger(value)||value<0||value>=question.options[0].length)return flow;
    return {...flow,choice:value};
  }
  function check(flow,question){
    if(flow.stage!=='quiz'||flow.feedback||flow.choice===null||!question)return flow;
    if(flow.choice===question.correct)return {...flow,feedback:'correct'};
    const mistakes=flow.mistakes+1,missed=[...new Set([...flow.missed,question.id])];
    if(mistakes>3)return {...flow,stage:'read',index:0,mistakes,choice:null,feedback:null,reviewRequired:true,readIndex:question.step,missed};
    return {...flow,mistakes,feedback:'wrong',missed};
  }
  function advance(flow,total){
    if(flow.stage!=='quiz'||!flow.feedback)return flow;
    if(flow.feedback==='wrong')return {...flow,choice:null,feedback:null};
    return {...flow,stage:flow.index+1===total?'practice':'quiz',index:flow.index+1,choice:null,feedback:null};
  }
  function startTest(practice,total){
    if(!((practice.mode==='train'&&practice.index>=total)||practice.mode==='failed'))return practice;
    return {...practice,mode:'test',index:0,lastWrong:null,redirected:false};
  }
  function playNote(practice,midi,target){
    if(!['train','test'].includes(practice.mode)||practice.index>=target.length)return practice;
    if(midi===target[practice.index]){
      const index=practice.index+1;
      return {...practice,index,lastWrong:null,redirected:false,mode:practice.mode==='test'&&index===target.length?'passed':practice.mode};
    }
    if(practice.mode==='train')return {...practice,lastWrong:midi,redirected:false};
    const failures=practice.failures+1;
    if(failures>=3)return {...initialPractice(),redirected:true,lastWrong:midi};
    return {...practice,mode:'failed',index:0,failures,lastWrong:midi};
  }
  const api={initial,canOpen,readStep,newOrders,currentQuestion,startQuiz,choose,check,advance,initialPractice,startTest,playNote};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.PHIM_LESSON_FLOW=api;
})(typeof window!=='undefined'?window:null);
