(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const counter = document.getElementById('counter');
  const progress = document.getElementById('progress');
  const indexPanel = document.getElementById('index-panel');
  const indexList = document.getElementById('index-list');
  let current = 0;

  // ---------- Navegación ----------
  function show(n) {
    current = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    counter.textContent = (current + 1) + ' / ' + slides.length;
    progress.max = slides.length - 1;
    progress.value = current;
    document.getElementById('btn-prev').disabled = current === 0;
    document.getElementById('btn-next').disabled = current === slides.length - 1;
    history.replaceState(null, '', '#' + (current + 1));
    window.scrollTo(0, 0);
  }
  const next = () => show(current + 1);
  const prev = () => show(current - 1);

  document.getElementById('btn-next').addEventListener('click', next);
  document.getElementById('btn-prev').addEventListener('click', prev);

  document.addEventListener('keydown', function (e) {
    if (e.target.closest('summary, button')) {
      if (e.key === ' ' || e.key === 'Enter') return;
    }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') next();
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') prev();
    if (e.key === 'Home') show(0);
    if (e.key === 'End') show(slides.length - 1);
    if (e.key === 'Escape') indexPanel.hidden = true;
  });

  // Gestos táctiles
  let startX = null;
  document.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 70) (dx < 0 ? next : prev)();
    startX = null;
  });

  // ---------- Índice ----------
  slides.forEach((s, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + (i + 1);
    a.textContent = s.dataset.title || ('Diapositiva ' + (i + 1));
    a.addEventListener('click', function (e) {
      e.preventDefault();
      show(i);
      indexPanel.hidden = true;
    });
    li.appendChild(a);
    indexList.appendChild(li);
  });
  document.getElementById('btn-index').addEventListener('click', () => {
    indexPanel.hidden = !indexPanel.hidden;
  });

  // ---------- Pantalla completa ----------
  document.getElementById('btn-full').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });

  // ---------- Detalles tipo acordeón (uno abierto a la vez por diapositiva) ----------
  slides.forEach(slide => {
    const details = slide.querySelectorAll(':scope > details');
    details.forEach(d => d.addEventListener('toggle', () => {
      if (d.open) details.forEach(o => { if (o !== d) o.open = false; });
    }));
  });

  // ---------- Resaltar fila de la tabla comparativa ----------
  document.querySelectorAll('#compare tbody tr').forEach(tr => {
    tr.addEventListener('click', () => tr.classList.toggle('highlight'));
  });

  // ---------- Quiz ----------
  const questions = [
    { q: 'Según la regla de oro en urgencias, todo sangrado del tercer trimestre se considera…',
      o: ['Un DPP hasta demostrar lo contrario', 'Una placenta previa hasta demostrar lo contrario', 'Expulsión del tapón mucoso', 'Una amenaza de parto prematuro'],
      a: 1, e: 'Por eso no se hace tacto vaginal hasta descartar placenta previa con ecografía.' },
    { q: '¿Cuál es la característica del sangrado en la placenta previa?',
      o: ['Doloroso con útero hipertónico', 'Rojo brillante, súbito e indoloro', 'Siempre oculto', 'Escaso con pérdida de líquido amniótico'],
      a: 1, e: 'El útero permanece blando y, en general, sin repercusión fetal inicial.' },
    { q: '¿Qué NO debe hacerse hasta descartar placenta previa por ecografía?',
      o: ['Canalizar vía venosa', 'Monitorización fetal', 'Tacto vaginal digital', 'Tomar hemograma'],
      a: 2, e: 'La manipulación del cuello puede lesionar la placenta y aumentar la hemorragia.' },
    { q: 'En el DPP, una ecografía normal…',
      o: ['Descarta el diagnóstico', 'No descarta el DPP si la clínica es sugestiva', 'Confirma placenta previa', 'Indica manejo expectante'],
      a: 1, e: 'El diagnóstico del DPP es principalmente clínico y la ecografía es poco sensible.' },
    { q: 'El útero de Couvelaire se caracteriza por…',
      o: ['Atonía uterina posparto', 'Rotura completa del útero', 'Infiltración de sangre en el miometrio con aspecto violáceo', 'Implantación en el segmento inferior'],
      a: 2, e: 'Es una complicación materna del DPP severo.' },
    { q: 'Un signo hemodinámico precoz de hemorragia materna es…',
      o: ['Taquicardia', 'Hipertermia', 'Bradicardia', 'Hipertensión'],
      a: 0, e: 'La taquicardia materna es uno de los primeros signos de alteración hemodinámica.' },
    { q: 'En una gestante Rh negativa con sangrado relevante se administra…',
      o: ['Sulfato de magnesio', 'Oxitocina', 'Betametasona', 'Inmunoglobulina anti-D'],
      a: 3, e: 'Previene la sensibilización materna frente a eritrocitos fetales.' },
    { q: 'La vasa previa es especialmente grave porque…',
      o: ['Produce sangrado materno lento', 'La ruptura de vasos fetales puede causar exanguinación fetal', 'Siempre produce dolor intenso', 'Solo ocurre tras el parto'],
      a: 1, e: 'Requiere cesárea de emergencia inmediata con reanimación neonatal preparada.' }
  ];
  const quiz = document.getElementById('quiz');
  const scoreEl = document.getElementById('quiz-score');
  let score = 0, answered = 0;

  questions.forEach((item, qi) => {
    const box = document.createElement('div');
    box.className = 'question';
    const p = document.createElement('p');
    p.textContent = (qi + 1) + '. ' + item.q;
    box.appendChild(p);
    const fb = document.createElement('p');
    fb.className = 'feedback';
    item.o.forEach((text, oi) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.addEventListener('click', () => {
        if (box.dataset.done) return;
        box.dataset.done = '1';
        answered++;
        const ok = oi === item.a;
        if (ok) score++;
        b.classList.add(ok ? 'correct' : 'wrong');
        box.querySelectorAll('button')[item.a].classList.add('correct');
        fb.textContent = (ok ? 'Correcto. ' : 'Incorrecto. ') + item.e;
        if (answered === questions.length) {
          scoreEl.textContent = 'Resultado: ' + score + ' de ' + questions.length;
        }
      });
      box.appendChild(b);
    });
    box.appendChild(fb);
    quiz.appendChild(box);
  });

  // Iniciar en la diapositiva indicada por el hash (#n)
  const start = parseInt(location.hash.replace('#', ''), 10);
  show(!isNaN(start) ? start - 1 : 0);
})();