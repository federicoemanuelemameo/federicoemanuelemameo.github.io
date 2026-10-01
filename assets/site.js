// Scala il canvas da 1024px alla larghezza della finestra (come lo "scalable viewer" di Readymag)
(function(){
  function fit(){
    var z = Math.min(window.innerWidth / 1024, 3600 / 1024);
    document.body.style.zoom = z;
    // pagine a schermo intero (archivio): l'altezza segue la finestra, in unita' del canvas
    document.querySelectorAll('.fit-viewport').forEach(function(el){ el.style.height = (window.innerHeight / z) + 'px'; });
    // elementi a tutto schermo (video della home): larghezza e altezza della finestra
    document.querySelectorAll('.fit-screen').forEach(function(el){ el.style.width = (window.innerWidth / z) + 'px'; el.style.height = (window.innerHeight / z) + 'px'; });
  }
  fit(); addEventListener('resize', fit);
})();

// Link-ancora (#y=…): scorrono alla posizione indicata nel canvas
document.addEventListener('click', function(e){
  var a = e.target.closest('a[href^="#y="]'); if(!a) return;
  e.preventDefault();
  var y = parseFloat(a.getAttribute('href').slice(3));
  var z = parseFloat(document.body.style.zoom) || 1;
  window.scrollTo({top: y * z, behavior: 'smooth'});
});

// Animazioni hover / click / scroll ricavate dai dati dei widget (window.RM_ANIMATIONS)
(function(){
  var anims = window.RM_ANIMATIONS || [];
  function container(wid){
    var el = document.querySelector('[data-id="'+wid+'"]');
    if(!el) return null;
    var c = el.closest('.animation-container');
    return c || el;
  }
  function apply(a, on){
    var el = a.el; var s = on ? a.fin : a.ini;
    el.style.transitionDuration = a.dur + 's';
    if('opacity' in a.fin) el.style.opacity = (on ? a.fin.opacity : (a.ini.opacity != null ? a.ini.opacity : 1));
    var t = [];
    if(on && ('dx' in a.fin)) t.push('translate('+a.fin.dx+'px,'+a.fin.dy+'px)');
    var rot = on ? a.fin.rotate : a.ini.rotate;
    if(rot != null) t.push('rotate('+rot+'deg)');
    if(t.length || a.hadTransform) { el.style.transform = t.join(' '); a.hadTransform = true; }
    if(on) el.classList.remove('invisible');
  }
  anims.forEach(function(a){
    a.el = container(a.wid); if(!a.el) return;
    var trig = (a.triggers.length ? a.triggers : [a.wid]).map(function(id){ return document.querySelector('[data-id="'+id+'"]'); }).filter(Boolean);
    if(a.type === 'hover'){
      trig.forEach(function(t){
        t.addEventListener('mouseenter', function(){ apply(a, true); });
        t.addEventListener('mouseleave', function(){ apply(a, false); });
      });
    } else if(a.type === 'click'){
      var on = false;
      trig.forEach(function(t){ t.style.cursor = 'pointer'; t.addEventListener('click', function(){ on = a.once ? true : !on; apply(a, on); }); });
    } else if(a.type === 'scroll'){
      var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) apply(a, true); else if(a.reset) apply(a, false); }); }, {threshold: 0.15});
      io.observe(a.el);
    } else if(a.type === 'load'){
      if(a.loop === 'swing'){
        a.el.style.transition = 'none';
        a.el.animate([{transform:'rotate('+(a.ini.rotate||0)+'deg)'},{transform:'rotate('+a.fin.rotate+'deg)'}],{duration:a.dur*1000,direction:'alternate',iterations:Infinity,easing:'ease-in-out'});
      } else apply(a, true);
    }
  });
})();

// Video della home: si susseguono in loop nell'ordine di data-videos (due <video> alternati, il prossimo e' gia' caricato)
(function(){
  document.querySelectorAll('.hero-reel').forEach(function(box){
    var list = box.getAttribute('data-videos').split(','), v = box.querySelectorAll('video'), cur = 0, idx = 0;
    // opzioni dopo il percorso: "|contain" = video intero dentro la finestra invece che a riempire,
    // "|light" = testi della pagina in bianco mentre va quel video
    function load(el, k){ var it = list[k % list.length].split('|'); el.classList.toggle('contain', it.indexOf('contain') > 0); el.setAttribute('data-light', it.indexOf('light') > 0 ? '1' : ''); el.src = it[0]; el.load(); }
    function tone(el){ document.body.classList.toggle('hero-light', el.getAttribute('data-light') === '1'); }
    function play(el){ el.muted = true; var p = el.play(); if(p && p.catch) p.catch(function(){}); }
    load(v[0], 0); load(v[1], 1);
    v[0].classList.add('on'); tone(v[0]); play(v[0]);
    [v[0], v[1]].forEach(function(el){
      el.addEventListener('ended', function(){
        if(el !== v[cur]) return;
        var next = v[1 - cur];
        next.currentTime = 0; play(next);
        next.classList.add('on'); el.classList.remove('on'); tone(next);
        cur = 1 - cur; idx++;
        load(el, idx + 1);
      });
    });
  });
})();
