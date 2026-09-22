const support=document.querySelector('.reading-support');
if(support){
 const sections=[...document.querySelectorAll('[data-reading-scene]')];
 const labels={outline:['01','輪郭を与える'],balance:['02','全体を整える'],open:['03','枠組みをひらく']};
 let queued=false;
 const update=()=>{queued=false;let active=sections[0];for(const section of sections){if(section.getBoundingClientRect().top<innerHeight*.55)active=section;}const scene=active.dataset.readingScene;support.dataset.scene=scene;support.querySelector('.reading-number').textContent=labels[scene][0];support.querySelector('.reading-label').textContent=labels[scene][1];};
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});update();
}
