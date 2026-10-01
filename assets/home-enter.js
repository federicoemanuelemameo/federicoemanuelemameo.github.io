// Home: tutta la pagina e' un link verso About. Al clic il cerchio "liquid glass" si allarga e la pagina
// sfuma, poi si apre About (senza animazione se l'utente preferisce il movimento ridotto).
(function(){
  var link = document.querySelector('.home-enter');
  if(!link) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  link.addEventListener('click', function(e){
    if(reduce || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;   // nuova scheda: comportamento normale
    e.preventDefault();
    document.body.classList.add('home-leaving');
    setTimeout(function(){ location.href = link.getAttribute('href'); }, 550);
  });
  // tornando indietro con il browser la pagina puo' essere ripresa dalla cache: toglie lo stato di uscita
  addEventListener('pageshow', function(){ document.body.classList.remove('home-leaving'); });
})();
