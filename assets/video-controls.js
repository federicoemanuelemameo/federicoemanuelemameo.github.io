// Controlli dei video nelle pagine progetto (riquadri .fm-media con data-controls): compaiono al passaggio
// del mouse, testo piccolo nel font del sito al posto delle icone. Play/pausa, tempo, barra di avanzamento
// (clic o trascinamento), suono (il video parte muto) e schermo intero. Clic sul video = play/pausa.
(function(){
  function fmt(t){ t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2); }
  document.querySelectorAll('.fm-media[data-controls]').forEach(function(box){
    var v = box.querySelector('video');
    if(!v) return;
    box.classList.add('vc-box');
    var hit = document.createElement('button');
    hit.type = 'button'; hit.className = 'vc-hit'; hit.setAttribute('aria-label', 'play / pause');
    var bar = document.createElement('div');
    bar.className = 'vc-bar';
    bar.innerHTML = '<button type="button" class="vc-btn vc-play"></button>' +
      '<span class="vc-time"></span>' +
      '<div class="vc-track" role="slider" tabindex="0" aria-label="seek" aria-valuemin="0" aria-valuemax="100"><div class="vc-fill"></div></div>' +
      (box.hasAttribute('data-audio') ? '<button type="button" class="vc-btn vc-sound"></button>' : '') +
      '<button type="button" class="vc-btn vc-full">fullscreen</button>';
    box.appendChild(hit); box.appendChild(bar);
    var play = bar.querySelector('.vc-play'), time = bar.querySelector('.vc-time'), track = bar.querySelector('.vc-track'),
        fill = bar.querySelector('.vc-fill'), sound = bar.querySelector('.vc-sound'), full = bar.querySelector('.vc-full');

    function toggle(){ if(v.paused) v.play(); else v.pause(); }
    function render(){
      play.textContent = v.paused ? 'play' : 'pause';
      box.classList.toggle('vc-paused', v.paused);
      if(sound) sound.textContent = v.muted ? 'sound on' : 'sound off';
      var p = v.duration ? v.currentTime / v.duration : 0;
      fill.style.width = (p * 100) + '%';
      track.setAttribute('aria-valuenow', Math.round(p * 100));
      time.textContent = fmt(v.currentTime) + ' / ' + fmt(v.duration);
    }
    var raf = 0;
    function loop(){ render(); raf = v.paused ? 0 : requestAnimationFrame(loop); }
    ['play', 'pause', 'loadedmetadata', 'seeked', 'volumechange', 'timeupdate'].forEach(function(e){ v.addEventListener(e, render); });
    v.addEventListener('play', function(){ if(!raf) raf = requestAnimationFrame(loop); });

    hit.addEventListener('click', toggle);
    play.addEventListener('click', toggle);
    if(sound) sound.addEventListener('click', function(){ v.muted = !v.muted; if(!v.muted && v.paused) v.play(); });
    full.addEventListener('click', function(){
      if(document.fullscreenElement) document.exitFullscreen();
      else if(box.requestFullscreen) box.requestFullscreen();
      else if(v.webkitEnterFullscreen) v.webkitEnterFullscreen();
    });
    document.addEventListener('fullscreenchange', function(){ full.textContent = document.fullscreenElement === box ? 'exit fullscreen' : 'fullscreen'; });

    // barra di avanzamento: clic o trascinamento per spostarsi, frecce da tastiera +/- 5 secondi
    function seekAt(x){
      var r = track.getBoundingClientRect();
      if(v.duration) v.currentTime = Math.min(1, Math.max(0, (x - r.left) / r.width)) * v.duration;
    }
    track.addEventListener('pointerdown', function(e){
      track.setPointerCapture(e.pointerId); seekAt(e.clientX);
      function move(ev){ seekAt(ev.clientX); }
      function up(){ track.removeEventListener('pointermove', move); track.removeEventListener('pointerup', up); }
      track.addEventListener('pointermove', move); track.addEventListener('pointerup', up);
    });
    track.addEventListener('keydown', function(e){
      if(e.key === 'ArrowRight') v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
      else if(e.key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 5);
      else return;
      e.preventDefault();
    });
    render();
  });
})();
