'use strict';
(function(root){
  // Track every pointer, including non-primary fingers. Only prevent gestures
  // that begin on a piano key; navigation and the scroll rail remain native.
  function attach({target,onPress,onRelease,pointerEvents=true,now=()=>Date.now()}){
    const pointers=new Map(),counts=new Map(),listeners=[];let lastTouch=-Infinity;
    const keyFor=node=>node?.closest?.('[data-midi]');
    function begin(id,key){
      if(!key||key.disabled||key.closest('[inert]')||pointers.has(id))return;
      const midi=Number(key.dataset.midi);if(!Number.isInteger(midi)||midi<0||midi>127)return;
      pointers.set(id,{key,midi});const count=counts.get(midi)||0;counts.set(midi,count+1);
      if(!count)onPress(midi);
    }
    function end(id){
      const note=pointers.get(id);if(!note)return;pointers.delete(id);
      const count=(counts.get(note.midi)||1)-1;
      if(count)counts.set(note.midi,count);else{counts.delete(note.midi);onRelease(note.midi);}
    }
    const listen=(type,handler,options)=>{target.addEventListener(type,handler,options);listeners.push([type,handler,options]);};
    if(pointerEvents){
      listen('pointerdown',event=>{
        const key=keyFor(event.target);if(!key||event.button!==0||key.disabled||key.closest('[inert]'))return;
        event.preventDefault();begin(event.pointerId,key);
        try{if(key.isConnected)key.setPointerCapture(event.pointerId);}catch{}
      },{passive:false});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(type,event=>end(event.pointerId));
    }else{
      // Older iOS versions without Pointer Events still receive every finger.
      listen('touchstart',event=>{
        let handled=false;
        for(const touch of event.changedTouches){const key=keyFor(touch.target);if(!key||key.disabled||key.closest('[inert]'))continue;handled=true;begin(touch.identifier,key);}
        if(handled){lastTouch=now();event.preventDefault();}
      },{passive:false});
      for(const type of ['touchend','touchcancel'])listen(type,event=>{for(const touch of event.changedTouches)end(touch.identifier);});
    }
    function clear(){for(const id of [...pointers.keys()])end(id);}
    return {
      isHeld:midi=>counts.has(midi),clear,
      // Physical contacts already sounded on pointerdown. Preserve keyboard,
      // screen-reader and programmatic button activation (detail === 0).
      shouldHandleClick:event=>pointerEvents?event.detail===0&&!event.pointerType:now()-lastTouch>800,
      destroy(){clear();for(const args of listeners)target.removeEventListener(...args);}
    };
  }
  const api={attach};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.PHIM_PIANO_INPUT=api;
})(typeof window!=='undefined'?window:null);
