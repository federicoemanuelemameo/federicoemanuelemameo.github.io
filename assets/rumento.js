// Pagina Rumentologo: flussi animati dei telefoni (cursore che tocca e schermata successiva, come nel vecchio sito)
// e laptop con il prototipo del sito (scroll dentro lo schermo, menu cliccabile).
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  var REST = [50, 92];

  function runTour(phone){
    var steps = JSON.parse(phone.getAttribute('data-tour'));
    steps.forEach(function(s){ new Image().src = s.src; });
    var dwell = Number(phone.getAttribute('data-dwell')) || 2400;
    var MOVE = 850, TAP = 430, FADE = 700;
    var base = phone.querySelector('.rb-phone__base'), over = phone.querySelector('.rb-phone__over'), tap = phone.querySelector('.rb-tap');
    function place(spot, animate){
      if(!animate){ tap.classList.add('no-anim'); }
      tap.style.left = spot[0] + '%'; tap.style.top = spot[1] + '%';
      if(!animate){ void tap.offsetWidth; tap.classList.remove('no-anim'); }
    }
    place(REST, false);
    var i = 0;
    (async function loop(){
      while(true){
        await wait(dwell);
        var step = steps[i], next = steps[(i + 1) % steps.length];
        if(step.hotspot){
          tap.classList.add('is-visible'); place(step.hotspot, true);
          await wait(MOVE);
          tap.classList.remove('is-pressed'); void tap.offsetWidth; tap.classList.add('is-pressed');
          setTimeout(function(){ tap.classList.remove('is-pressed'); }, 640);
          await wait(TAP);
        }
        over.src = next.src; over.classList.add('is-in');
        await wait(FADE);
        base.src = next.src;
        over.classList.remove('is-in');
        if(!next.hotspot){ tap.classList.remove('is-visible'); setTimeout(function(){ place(REST, false); }, 380); }
        i = (i + 1) % steps.length;
      }
    })();
  }
  if(!reduce) document.querySelectorAll('.rb-phone[data-tour]').forEach(runTour);

  // laptop: il menu passa da una schermata all'altra; un clic altrove fa lampeggiare le zone cliccabili
  document.querySelectorAll('.rb-proto').forEach(function(proto){
    var viewport = proto.closest('.rb-laptop__viewport');
    var screens = {};
    proto.querySelectorAll('.rb-screen').forEach(function(s){ screens[s.getAttribute('data-screen')] = s; });
    proto.addEventListener('click', function(e){
      var hot = e.target.closest('.rb-hot');
      if(hot){
        var target = screens[hot.getAttribute('data-to')];
        if(!target) return;
        var img = target.querySelector('img');
        if(img && img.getAttribute('data-src')){ img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
        Object.keys(screens).forEach(function(k){ screens[k].classList.toggle('is-active', screens[k] === target); });
        viewport.scrollTop = 0;
        return;
      }
      var screen = e.target.closest('.rb-screen');
      if(!screen) return;
      screen.classList.remove('is-flash'); void screen.offsetWidth; screen.classList.add('is-flash');
      setTimeout(function(){ screen.classList.remove('is-flash'); }, 700);
    });
    viewport.addEventListener('scroll', function(){
      if(viewport.scrollTop > 12) viewport.closest('.rb-laptop__screen').classList.add('is-scrolled');
    }, {passive: true});
  });

  // misura dei blocchi (usata da tools/measure_raw.py per dare a ogni blocco l'altezza giusta nella pagina)
  function measure(){
    document.querySelectorAll('.rawblock').forEach(function(b){
      var inner = b.firstElementChild; b.setAttribute('data-measured', Math.ceil(inner.getBoundingClientRect().height));
    });
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function(){
    var imgs = Array.prototype.slice.call(document.querySelectorAll('.rawblock img')).filter(function(i){ return !i.complete; });
    Promise.all(imgs.map(function(i){ return new Promise(function(r){ i.onload = i.onerror = r; }); })).then(measure);
  });
})();
