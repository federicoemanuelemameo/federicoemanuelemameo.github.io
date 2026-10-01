// Ritratto dot-art della pagina About: i puntini del ritratto (window.ABOUT_DOTS) sono disegnati su un canvas
// e, al passaggio del mouse (o al tocco), corrono a comporre la frase della home, anch'essa a puntini.
// La pagina About e' invertita (nero <-> bianco): qui si disegnano puntini neri su bianco, che a schermo
// diventano bianchi su nero come l'immagine originale.
(function(){
  var data = window.ABOUT_DOTS;
  var img = document.querySelector('img[src="media/about/federico_dot.png"]');
  if(!data || !img){ if(img) img.style.visibility = 'visible'; return; }   // niente puntini: torna l'immagine
  var box = img.parentNode;
  var LINES = ['aiming to', 'create', 'emotions', 'mixing', 'physical and', 'digital artifacts'];
  var FONT = 'custom_144973';
  var DOT = 1;                       // lato del puntino, in pixel dell'immagine (come nell'originale)

  // canvas con le stesse proporzioni del riquadro, in pixel dell'immagine (object-fit: cover)
  var bw = box.clientWidth, bh = box.clientHeight;
  var k = Math.max(bw / data.w, bh / data.h);
  var W = Math.round(bw / k), H = Math.round(bh / k);
  var ox = (data.w - W) / 2, oy = (data.h - H) / 2;
  var cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  cv.style.cssText = 'width:100%;height:100%;display:block;cursor:pointer';
  cv.setAttribute('role', 'img');
  cv.setAttribute('aria-label', img.alt);
  var ctx = cv.getContext('2d');

  var n = data.pts.length / 2;
  var hx = new Float32Array(n), hy = new Float32Array(n);   // posizione nel ritratto
  var tx = new Float32Array(n), ty = new Float32Array(n);   // posizione nella frase
  var x = new Float32Array(n), y = new Float32Array(n);
  var sx = new Float32Array(n), sy = new Float32Array(n);   // partenza della transizione in corso
  var delay = new Float32Array(n);
  var DURATION = 1600, SPREAD = 500;   // ms: durata del viaggio di ogni puntino e sfasamento massimo tra i puntini
  // apertura della pagina: quanto sono sparsi i puntini (px dell'immagine) e quanto ci mettono a ricomporsi (ms)
  var INTRO_MIN = 20, INTRO_MAX = 110, INTRO_DURATION = 2000;
  for(var i = 0; i < n; i++){
    hx[i] = x[i] = data.pts[2 * i] - ox;
    hy[i] = y[i] = data.pts[2 * i + 1] - oy;
    delay[i] = Math.random() * SPREAD;                      // partenze sfalsate: lo sciame si muove come un'onda
  }

  // punti della frase: testo disegnato fuori schermo e campionato su una griglia
  function textTargets(){
    var off = document.createElement('canvas'); off.width = W; off.height = H;
    var c = off.getContext('2d');
    var pad = W * 0.06, size = 100;
    c.font = size + 'px ' + FONT;
    var widest = Math.max.apply(null, LINES.map(function(l){ return c.measureText(l).width; }));
    size = Math.min((W - 2 * pad) / widest * size, (H - 2 * pad) / (LINES.length * 1.02));
    c.font = size + 'px ' + FONT;
    c.fillStyle = '#000'; c.textBaseline = 'top';
    var lh = size * 1.02, top = (H - lh * LINES.length) / 2;
    LINES.forEach(function(l, j){ c.fillText(l, pad, top + j * lh); });
    var a = c.getImageData(0, 0, W, H).data, on = [];
    for(var yy = 0; yy < H; yy++) for(var xx = 0; xx < W; xx++) if(a[(yy * W + xx) * 4 + 3] > 128) on.push(xx, yy);
    if(!on.length) return [];
    // puntinato come il ritratto: ogni puntino cade in un punto a caso dentro le lettere, spostato di poco,
    // e una piccola parte si disperde attorno (JITTER e STRAY regolano quanto la scritta e' sgranata)
    var JITTER = 1.6, STRAY = 0.12, STRAY_R = 9;
    var pts = [], m = on.length / 2;
    for(var i = 0; i < n; i++){
      var q = Math.floor(Math.random() * m) * 2;
      var r = Math.random() < STRAY ? Math.random() * STRAY_R : Math.random() * JITTER;
      var ang = Math.random() * Math.PI * 2;
      pts.push([on[q] + Math.cos(ang) * r, on[q + 1] + Math.sin(ang) * r]);
    }
    return pts;
  }

  function assign(){
    var pts = textTargets();
    if(!pts.length) return;
    // abbinamento per riga: i puntini alti vanno verso le righe alte della frase, con un po' di mescolanza
    var order = []; for(var i = 0; i < n; i++) order.push(i);
    order.sort(function(a, b){ return (hy[a] + Math.random() * 40) - (hy[b] + Math.random() * 40); });
    pts.sort(function(a, b){ return a[1] - b[1]; });
    for(var j = 0; j < n; j++){
      var p = pts[j];
      tx[order[j]] = Math.round(p[0]); ty[order[j]] = Math.round(p[1]);
    }
  }

  function draw(){
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    for(var i = 0; i < n; i++) ctx.fillRect(x[i], y[i], DOT, DOT);
  }

  var toText = false, running = false, t0 = 0, dur = DURATION;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ease(t){ return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }   // in-out cubica
  function step(now){
    var moving = false;
    for(var i = 0; i < n; i++){
      var gx = toText ? tx[i] : hx[i], gy = toText ? ty[i] : hy[i];
      var t = reduce ? 1 : Math.min(1, Math.max(0, (now - t0 - delay[i]) / dur));
      if(t < 1) moving = true;
      var e = ease(t);
      x[i] = sx[i] + (gx - sx[i]) * e;
      y[i] = sy[i] + (gy - sy[i]) * e;
    }
    draw();
    running = moving;
    if(moving) requestAnimationFrame(step);
  }
  // ogni cambio (anche a meta' strada) riparte dalla posizione attuale dei puntini
  var hint = document.querySelector('.about-dots-hint');   // caption "hover": sparisce mentre si e' sopra l'immagine
  function go(v, duration){
    toText = v;
    dur = duration || DURATION;
    if(hint) hint.style.opacity = v ? 0 : 1;
    sx.set(x); sy.set(y);
    t0 = performance.now();
    if(!running){ running = true; requestAnimationFrame(step); }
  }

  // il canvas prende subito il posto dell'immagine (che resta nascosta fin dall'inizio, vedi about.html):
  // all'apertura i puntini partono sparsi attorno al loro posto e si raggruppano nel ritratto
  img.style.display = 'none';
  box.appendChild(cv);
  if(!reduce){
    for(var i = 0; i < n; i++){
      var r = INTRO_MIN + Math.random() * (INTRO_MAX - INTRO_MIN), a = Math.random() * Math.PI * 2;
      x[i] = hx[i] + Math.cos(a) * r; y[i] = hy[i] + Math.sin(a) * r;
    }
    draw();
    go(false, INTRO_DURATION);
  } else draw();

  // la frase per l'hover si prepara quando il font e' pronto (non serve per l'animazione d'apertura)
  var fontReady = document.fonts && document.fonts.load ? document.fonts.load('100px ' + FONT) : Promise.resolve();
  fontReady.then(function(){
    assign();
    box.addEventListener('mouseenter', function(){ go(true); });
    box.addEventListener('mouseleave', function(){ go(false); });
    box.addEventListener('touchstart', function(){ go(!toText); }, {passive: true});
  });
})();
