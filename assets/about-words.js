// "and I design ..." nella pagina About: le parole scorrono in verticale da sole, come un carosello.
// Ogni voce occupa una riga; dopo l'ultima si riparte dalla prima senza salti.
(function(){
  var track = document.querySelector('.about-words-track');
  if(!track) return;
  var STEP = 46, EVERY = 2600, MOVE = 700;     // px per voce (una riga + spazio per le lettere come g e y), ms tra un cambio e l'altro, ms di scorrimento
  var n = track.children.length;
  track.appendChild(track.children[0].cloneNode(true));   // copia della prima voce in fondo, per il giro continuo
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var i = 0;
  function show(k, animate){
    track.style.transition = animate && !reduce ? 'transform ' + MOVE + 'ms cubic-bezier(.65,0,.35,1)' : 'none';
    track.style.transform = 'translateY(' + (-k * STEP) + 'px)';
  }
  track.addEventListener('transitionend', function(){
    if(i === n){ i = 0; show(0, false); }
  });
  setInterval(function(){
    i++;
    show(i, true);
    if(reduce && i === n){ i = 0; show(0, false); }
  }, EVERY);
})();
