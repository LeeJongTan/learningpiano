const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const input=require('../piano-input');
function harness(pointerEvents=true){
 const handlers=new Map(),pressed=[],released=[];
 const target={addEventListener(type,fn){handlers.set(type,fn);},removeEventListener(type){handlers.delete(type);}};
 const api=input.attach({target,pointerEvents,onPress:n=>pressed.push(n),onRelease:n=>released.push(n),now:()=>1000});
 const key=(m,inert=false)=>({dataset:{midi:String(m)},isConnected:true,setPointerCapture(){},closest(selector){return selector==='[data-midi]'?this:inert?{}:null;}});
 const send=(type,data)=>{const e={button:0,prevented:false,preventDefault(){this.prevented=true;},...data};handlers.get(type)?.(e);return e;};
 return {api,key,send,pressed,released,handlers};
}
test('all three fingers sound immediately, including non-primary touch contacts',()=>{
 const h=harness();for(const [id,midi]of [[10,60],[11,64],[12,67]])h.send('pointerdown',{pointerId:id,pointerType:'touch',isPrimary:id===10,target:h.key(midi)});
 assert.deepEqual(h.pressed,[60,64,67]);for(const n of [60,64,67])assert.equal(h.api.isHeld(n),true);
 h.send('pointerup',{pointerId:11});assert.deepEqual(h.released,[64]);assert.equal(h.api.isHeld(60),true);assert.equal(h.api.isHeld(67),true);
 h.send('pointercancel',{pointerId:10});h.send('lostpointercapture',{pointerId:12});assert.deepEqual(h.released,[64,60,67]);
});
test('touch release and compatibility click do not sound the note a second time',()=>{
 const h=harness();h.send('pointerdown',{pointerId:1,target:h.key(60)});h.send('pointerup',{pointerId:1});
 assert.equal(h.api.shouldHandleClick({detail:1,pointerType:'touch'}),false);
 assert.equal(h.api.shouldHandleClick({detail:1,pointerType:'mouse'}),false);
 assert.equal(h.api.shouldHandleClick({detail:0,pointerType:'touch'}),false);
 assert.equal(h.api.shouldHandleClick({detail:0}),true);assert.deepEqual(h.pressed,[60]);
});
test('two fingers on one key retain the held state until both release; cancellation clears all',()=>{
 const h=harness();h.send('pointerdown',{pointerId:1,target:h.key(60)});h.send('pointerdown',{pointerId:2,target:h.key(60)});
 assert.deepEqual(h.pressed,[60]);h.send('pointerup',{pointerId:1});assert.equal(h.api.isHeld(60),true);assert.deepEqual(h.released,[]);
 h.api.clear();assert.equal(h.api.isHeld(60),false);assert.deepEqual(h.released,[60]);h.api.clear();assert.equal(h.released.length,1);
});
test('scrolling outside keys, secondary mouse buttons and inert keyboards are untouched',()=>{
 const h=harness();for(const data of [{target:{closest:()=>null}},{target:h.key(60),button:2},{target:h.key(60,true)}])assert.equal(h.send('pointerdown',data).prevented,false);
 assert.deepEqual(h.pressed,[]);
});
test('legacy Safari fallback accepts every changed touch and suppresses synthetic mouse click',()=>{
 const h=harness(false);const e=h.send('touchstart',{changedTouches:[{identifier:1,target:h.key(60)},{identifier:2,target:h.key(64)},{identifier:3,target:h.key(67)}]});
 assert.equal(e.prevented,true);assert.deepEqual(h.pressed,[60,64,67]);assert.equal(h.api.shouldHandleClick({detail:1}),false);
 h.send('touchend',{changedTouches:[{identifier:2}]});assert.deepEqual(h.released,[64]);h.api.destroy();assert.equal(h.handlers.size,0);assert.deepEqual(h.released,[64,60,67]);
});
test('audio resumes from interruption and overlapping tones keep independent voices',async()=>{
 const source=fs.readFileSync(require.resolve('../app.js'),'utf8'),a=source.indexOf('async function ensureAudio('),b=source.indexOf('function flash(',a);
 const frequencies=[];let resumes=0;
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class AudioContext{
  constructor(){this.state='interrupted';this.currentTime=1;this.destination={};}
  async resume(){resumes++;this.state='running';}
  createDynamicsCompressor(){return {threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){}};}
  createGain(){return {gain:param(),connect(){},disconnect(){}};}
  createOscillator(){const frequency={set value(n){frequencies.push(n);}};return {frequency,connect(){},disconnect(){},start(){},stop(){}};}
 }
 const sandbox={window:{AudioContext,PHIM_AUDIO:require('../piano-audio')},volume:.6,audioCtx:null,audioOutput:null,activeNodes:new Set(),toast(){},t:x=>x};vm.createContext(sandbox);vm.runInContext(source.slice(a,b),sandbox);
 const ctx=await sandbox.ensureAudio();assert.equal(resumes,1);sandbox.tone(60,ctx.currentTime);sandbox.tone(64,ctx.currentTime);sandbox.tone(67,ctx.currentTime);
 assert.equal(sandbox.activeNodes.size,12);assert.equal(frequencies.length,12);
 assert.ok(Math.abs(frequencies[0]-261.6256)<.01);assert.ok(Math.abs(frequencies[4]-329.6276)<.01);assert.ok(Math.abs(frequencies[8]-391.9954)<.01);
});
