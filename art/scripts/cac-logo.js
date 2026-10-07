/* 動くロゴ（CAC）
   左の C＝CHICHIBU／COCOON（秩父という繭）、右の C＝CREATION（そこから生まれるもの）。
   そのあいだの A＝ART だけが、横糸が通るたびに織り替わる。
     A → a → あ → 線（集まる）→ 繭 → 粒（繭になる）→ ART → ?（生まれる）→ A
   <img data-cac="hover|loop"> を、同じ見た目のインライン SVG に置き換える。
     hover … ふだんは A。マウス・フォーカスが乗ったときだけ織り替わり、離れたら A に戻る（ヘッダー）
     loop  … 画面に入っているあいだ織り替わり続ける（フッター・SYMBOL）
     still … 動かさない。data-cac-form="0〜7" で止める姿を選ぶ
   「動きを減らす」設定では A のまま止める。 */
(function(){
  var imgs=[].slice.call(document.querySelectorAll('img[data-cac]'));
  if(!imgs.length||!window.fetch||!('IntersectionObserver' in window))return;
  var still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS='http://www.w3.org/2000/svg',VB='87.75 212 420 171.25';

  /* 真ん中の姿。座標は確定ロゴに合わせる（A は x251〜341・y214〜328、中心 x296） */
  var CX=296,CY=271,BASE=328,MX=232,MW=124,LANE=[244,271,298];
  var SERIF="Georgia,'Noto Serif JP','Yu Mincho',serif";
  function mayu(x,y,w,h){var P=[[.5,0],[.8,0,.98,.14,.98,.3],[.98,.42,.93,.46,.935,.5],[.94,.54,.99,.6,.99,.72],[.99,.88,.8,1,.5,1],[.2,1,.01,.88,.01,.72],[.01,.6,.06,.54,.065,.5],[.07,.46,.02,.42,.02,.3],[.02,.14,.2,0,.5,0]];
    var d='M'+(x+P[0][0]*w)+' '+(y+P[0][1]*h);for(var i=1;i<P.length;i++){var q=P[i];d+='C'+(x+q[0]*w)+' '+(y+q[1]*h)+' '+(x+q[2]*w)+' '+(y+q[3]*h)+' '+(x+q[4]*w)+' '+(y+q[5]*h);}return d+'Z';}
  var threads='';for(var i=0;i<9;i++){var yy=226+i*11.5,a=8+((i*7)%5)*3;threads+='<path d="M258 '+yy+'Q'+CX+' '+(yy-a)+' 334 '+(yy+((i%2)?4:-4))+'"/>';}
  var specks='';[[-30,-34,5],[34,-28,3.5],[38,30,6],[-36,32,3],[-8,48,2.5],[20,-48,2.2],[46,4,2.6]].forEach(function(p){specks+='<circle class="sp" cx="'+(CX+p[0])+'" cy="'+(CY+p[1])+'" r="'+p[2]+'"/>';});

  /* 姿ごとに、差し込む横糸の色を決めておく（銘仙の写真から取った8色） */
  var V=[
    {g:'A',  act:'はじまりの A', c:'#2e3452', svg:'<use href="#cac-base" clip-path="url(#{id}-mid)"/>'},
    {g:'a',  act:'集まる',       c:'#b65a38', svg:'<text x="'+CX+'" y="'+BASE+'" text-anchor="middle" font-family="'+SERIF+'" font-size="158">a</text>'},
    {g:'あ', act:'集まる',       c:'#3a8193', svg:'<text x="'+CX+'" y="'+(CY+4)+'" text-anchor="middle" dominant-baseline="central" font-family="\'Noto Serif JP\',\'Yu Mincho\',serif" font-size="112">あ</text>'},
    {g:'線', act:'集まる',       c:'#b0667a', cls:'v-sen', svg:'<path d="M248 300C262 250 276 226 290 236S280 300 300 292 318 230 330 238 322 300 346 280"/>'},
    {g:'繭', act:'繭になる',     c:'#7f7a3a', cls:'v-mayu', svg:'<path d="'+mayu(256,222,80,104)+'" opacity=".9"/><g class="th">'+threads+'</g>'},
    {g:'粒', act:'繭になる',     c:'#7c86a8', cls:'v-dot', svg:'<circle cx="'+CX+'" cy="'+CY+'" r="30"/>'+specks},
    {g:'ART',act:'生まれる',     c:'#9a2d29', svg:'<text x="'+CX+'" y="'+(CY+2)+'" text-anchor="middle" dominant-baseline="central" font-family="'+SERIF+'" font-size="50" letter-spacing="2">ART</text>'},
    {g:'?',  act:'まだ名前のない何かへ', c:'#2f5d8b', svg:'<text x="'+CX+'" y="'+BASE+'" text-anchor="middle" font-family="'+SERIF+'" font-size="150">?</text>'}
  ];
  var HOLD_A=1600,HOLD=800,PASS=520;
  var ease=function(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;};

  fetch(imgs[0].getAttribute('src')).then(function(r){return r.text();}).then(function(t){
    /* ロゴ本体は1回だけ埋め込み、各所から <use> で参照する */
    var body=t.replace(/^[\s\S]*?<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'')
      .replace(/id="([^"]+)"/g,'id="cac-$1"').replace(/url\(#([^)]+)\)/g,'url(#cac-$1)');
    var sprite=document.createElementNS(NS,'svg');
    sprite.setAttribute('aria-hidden','true');sprite.setAttribute('focusable','false');
    sprite.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
    sprite.innerHTML='<defs><g id="cac-base">'+body+'</g></defs>';
    document.body.insertBefore(sprite,document.body.firstChild);
    imgs.forEach(function(img,n){make(img,'cac'+n);});
  }).catch(function(){});

  function make(img,id){
    var svg=document.createElementNS(NS,'svg');
    svg.setAttribute('viewBox',VB);svg.setAttribute('class','cac-svg '+(img.getAttribute('class')||''));
    svg.setAttribute('role','img');svg.setAttribute('aria-label',img.getAttribute('alt')||'CAC');
    var h='<defs><clipPath id="'+id+'-side"><rect x="80" y="200" width="152" height="140"/><rect x="356" y="200" width="160" height="140"/><rect x="80" y="340" width="440" height="60"/></clipPath>'+
      '<clipPath id="'+id+'-mid"><rect x="232" y="200" width="124" height="140"/></clipPath>';
    V.forEach(function(v,i){h+='<clipPath id="'+id+'-w'+i+'"><rect x="'+MX+'" y="200" width="'+(i?0:MW)+'" height="140"/></clipPath>';});
    h+='<linearGradient id="'+id+'-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-opacity="0"/><stop offset=".75" stop-opacity=".9"/><stop offset="1"/></linearGradient></defs>'+
      '<use href="#cac-base" clip-path="url(#'+id+'-side)"/><g class="cac-mid">';
    V.forEach(function(v,i){h+='<g class="v '+(v.cls||'')+(i?'':' on')+'" clip-path="url(#'+id+'-w'+i+')">'+v.svg.replace('{id}',id)+'</g>';});
    h+='</g><line class="cac-weft" x1="0" y1="271" x2="1" y2="271" stroke="url(#'+id+'-g)" stroke-width="3" stroke-linecap="round" opacity="0"/>';
    svg.innerHTML=h;
    img.parentNode.replaceChild(svg,img);

    var rects=V.map(function(_,i){return svg.querySelector('#'+id+'-w'+i+' rect');}),
        groups=[].slice.call(svg.querySelectorAll('.cac-mid .v')),
        stops=[].slice.call(svg.querySelectorAll('#'+id+'-g stop')),
        line=svg.querySelector('.cac-weft'),grad=svg.querySelector('#'+id+'-g'),
        cap=img.dataset.cacCaption?document.querySelector('[data-cac-label="'+img.dataset.cacCaption+'"]'):null,
        mode=img.dataset.cac,cur=0,k=0,busy=false,want=false,timer=0;

    function label(){if(cap)cap.innerHTML='<b>'+V[cur].g+'</b>'+V[cur].act;}
    /* 横糸を左から右へ通し、通ったところから次の姿に織り替える */
    function paint(from,to,t){
      var x=60+480*ease(t),w=Math.max(0,Math.min(MW,x-MX));
      line.setAttribute('x1',x-170);line.setAttribute('x2',x);grad.setAttribute('x1',x-170);grad.setAttribute('x2',x);
      rects[to].setAttribute('x',MX);rects[to].setAttribute('width',w);
      rects[from].setAttribute('x',MX+w);rects[from].setAttribute('width',MW-w);
      if(w>0)groups[to].classList.add('on');
    }
    function weave(to,done){
      busy=true;var from=cur,y=LANE[k++%LANE.length],t0=performance.now();
      stops.forEach(function(s){s.setAttribute('stop-color',V[to].c);});
      line.setAttribute('y1',y);line.setAttribute('y2',y);line.style.transition='none';line.setAttribute('opacity',1);
      (function step(now){
        var t=Math.min(1,(now-t0)/PASS);paint(from,to,t);
        if(t<1)return requestAnimationFrame(step);
        groups[from].classList.remove('on');rects[from].setAttribute('x',MX);rects[from].setAttribute('width',0);
        cur=to;busy=false;label();line.style.transition='opacity .35s';line.setAttribute('opacity',0);
        done();
      })(t0);
    }
    function next(){
      clearTimeout(timer);
      if(busy)return;
      if(want&&!document.hidden){timer=setTimeout(function(){weave((cur+1)%V.length,next);},cur===0?(mode==='hover'?120:HOLD_A):HOLD);}
      else if(cur!==0&&mode==='hover')weave(0,next);   /* 離れたら A に戻す */
    }
    function run(on){want=on;next();}
    /* 1つの姿で止めて見せる（t<1 は織り替わる途中） */
    function show(to,t){if(!to)return;stops.forEach(function(s){s.setAttribute('stop-color',V[to].c);});
      line.setAttribute('opacity',t<1?1:0);paint(0,to,t);if(t>=1){groups[0].classList.remove('on');rects[0].setAttribute('width',0);cur=to;label();}}
    label();
    /* data-cac-form="4" … 繭の姿で止める（8つの姿を並べる図などに）
       確認用：?cac=4 で繭の姿、?cac=4,0.5 で繭へ織り替わる途中を止めて表示する */
    var q=/[?&]cac=(\d)(?:,([\d.]+))?/.exec(location.search),form=img.dataset.cacForm;
    if(form){show(+form,1);return;}
    if(q){show(+q[1],q[2]?+q[2]:1);return;}
    if(still)return;
    if(mode==='hover'){
      var host=svg.closest('a')||svg;
      host.addEventListener('mouseenter',function(){run(true);});
      host.addEventListener('mouseleave',function(){run(false);});
      host.addEventListener('focus',function(){run(true);});
      host.addEventListener('blur',function(){run(false);});
    }else{
      new IntersectionObserver(function(es){run(es[0].isIntersecting);}).observe(svg);
      document.addEventListener('visibilitychange',function(){next();});
    }
  }
})();
