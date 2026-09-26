/* 下層ページのメニュー開閉（トップは motion.js が同じことをしている） */
(function(){
  var mt=document.getElementById('menu-toggle'),mm=document.getElementById('mobile-menu');
  if(!mt||!mm)return;
  function close(){mm.hidden=true;mt.setAttribute('aria-expanded','false');}
  mt.addEventListener('click',function(){mm.hidden=!mm.hidden;mt.setAttribute('aria-expanded',String(!mm.hidden));});
  [].forEach.call(mm.querySelectorAll('a'),function(a){a.addEventListener('click',close);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!mm.hidden){close();mt.focus();}});
})();
