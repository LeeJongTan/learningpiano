'use strict';
(function(root){
  function profile(midi){
    // Keep the fundamental frequency intact. A bounded low-register gain and
    // stronger integer harmonics improve audibility on small speakers.
    const bass=Math.max(0,Math.min(1,(60-midi)/36));
    return {boost:1+.8*bass,partials:[1,.28+.12*bass,.1+.08*bass,.035+.045*bass]};
  }
  const api={profile};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.PHIM_AUDIO=api;
})(typeof window!=='undefined'?window:null);
