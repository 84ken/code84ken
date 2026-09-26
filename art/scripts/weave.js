/* 経糸と緯糸
   ・罫線は、画面に入ったら緯糸が通るように左から右へ走らせる
   ・トップでは、画面の中央にかかったセクションの緯糸（data-weft）で差し色を変え、
     白い地にうっすら色を乗せ、左端の進捗バーに通った緯糸を縞で積み重ねる */
(function(){
  var root=document.documentElement,
      still=matchMedia('(prefers-reduced-motion: reduce)').matches;

  var rules=[].slice.call(document.querySelectorAll(
    '.call-panel,.program-grid article,.together-links>a,.detail-main h2,section[data-weft]>.section-label'));
  if(still||!('IntersectionObserver' in window)){
    rules.forEach(function(r){r.classList.add('is-woven');});
  }else{
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-woven');io.unobserve(e.target);}});
    },{rootMargin:'0px 0px -12% 0px'});
    rules.forEach(function(r){io.observe(r);});
  }

  var ground=document.getElementById('weft-ground'),
      secs=[].slice.call(document.querySelectorAll('main section[data-weft]'));
  if(!ground||!secs.length)return;

  function color(k){return getComputedStyle(root).getPropertyValue('--'+k).trim();}

  function loom(){
    var H=root.scrollHeight,stops=[];
    secs.forEach(function(s){
      var c=color(s.dataset.weft),a=s.offsetTop/H*100,b=(s.offsetTop+s.offsetHeight)/H*100;
      stops.push(c+' '+a.toFixed(2)+'%',c+' '+b.toFixed(2)+'%');
    });
    root.style.setProperty('--loom','linear-gradient(180deg,'+stops.join(',')+')');
  }

  var last=null;
  function pick(){
    var y=innerHeight/2,cur=secs[0];
    secs.forEach(function(s){var r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>y)cur=s;});
    if(cur===last)return;last=cur;
    root.style.setProperty('--weft',color(cur.dataset.weft));
    /* 最初の画面（キービジュアル）は地に色を乗せない */
    root.style.setProperty('--ground-op',cur.id==='home'?'0':(matchMedia('(max-width:700px)').matches?'.075':'.06'));
  }

  addEventListener('scroll',pick,{passive:true});
  addEventListener('resize',function(){loom();last=null;pick();});
  addEventListener('load',loom);
  loom();pick();
})();
