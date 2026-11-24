/* AC Performance Horses — Home interactions */
(() => {
  'use strict';

  /* Contact channels. Fill whatsapp (digits with country code, e.g. "523312345678")
     and/or email to enable those buttons after the form is submitted. */
  const CONTACT = { instagram: 'ale_casillass', whatsapp: '', email: '' };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (reduce) root.classList.add('reduce');

  let vh = innerHeight;
  addEventListener('resize', () => { vh = innerHeight; fitFooter(); }, { passive: true });

  /* ------------------------------------------------------------ smooth scroll */
  let lenis = null;
  if (!reduce && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
  }
  const lockScroll = (on) => {
    document.body.classList.toggle('is-locked', on);
    if (lenis) on ? lenis.stop() : lenis.start();
  };
  const scrollToEl = (el) => {
    if (lenis) lenis.scrollTo(el, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  /* ------------------------------------------------------------ header */
  const hdr = $('[data-hdr]');
  const hero = $('.hero');
  const burger = $('.hdr__burger');
  const themed = $$('main [data-theme], footer[data-theme]');
  let lastY = scrollY;
  let menuOpen = false;
  let loginOpen = false;

  $$('.hdr__list li').forEach((li, i) => li.style.setProperty('--i', i));

  function updateHeader(y) {
    const heroH = hero.offsetHeight;
    const dy = y - lastY;
    if (Math.abs(dy) > 6) {
      const hide = dy > 0 && y > heroH * 0.5 && !menuOpen && !loginOpen;
      hdr.classList.toggle('is-hidden', hide);
      lastY = y;
    }
    hdr.classList.toggle('is-solid', y > heroH - hdr.offsetHeight);
    const probe = hdr.offsetHeight / 2;
    let theme = 'dark';
    for (const el of themed) {
      const r = el.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) theme = el.dataset.theme;
    }
    if (hdr.dataset.theme !== theme) hdr.dataset.theme = theme;
  }

  const setMenu = (open) => {
    menuOpen = open;
    hdr.classList.toggle('is-open', open);
    hdr.classList.remove('is-hidden');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    lockScroll(open);
  };
  burger.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('resize', () => { if (innerWidth > 1120 && menuOpen) setMenu(false); });

  /* login dropdown */
  const loginBtn = $('.login__btn');
  const loginPanel = $('#login-panel');
  const setLogin = (open) => {
    loginOpen = open;
    loginBtn.setAttribute('aria-expanded', String(open));
    loginPanel.hidden = !open;
  };
  loginBtn.addEventListener('click', (e) => { e.stopPropagation(); setLogin(!loginOpen); });
  document.addEventListener('click', (e) => { if (loginOpen && !e.target.closest('[data-login]')) setLogin(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (loginOpen) { setLogin(false); loginBtn.focus(); }
    else if (menuOpen) { setMenu(false); burger.focus(); }
  });

  /* in-page anchors */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (a.dataset.intentLink) setIntent(a.dataset.intentLink);
    if (loginOpen) setLogin(false);
    if (menuOpen) setMenu(false);
    scrollToEl(target);
    history.replaceState(null, '', id === 'inicio' ? location.pathname : '#' + id);
  });

  /* active nav link */
  const navLinks = $$('.hdr__list a[data-nav]');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((l) => l.setAttribute('aria-current', String(l.hash === '#' + en.target.id)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('#inicio, #acerca, #entrenamiento, #contacto').forEach((s) => spy.observe(s));

  /* ------------------------------------------------------------ hero intro */
  const heroImg = $('.hero__media img');
  const heroReady = Promise.all([
    heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
    document.fonts ? document.fonts.ready : Promise.resolve(),
  ]);
  Promise.race([heroReady, new Promise((r) => setTimeout(r, 1600))]).then(() => {
    requestAnimationFrame(() => hero.classList.add('is-loaded'));
    fitFooter();
  });

  /* ------------------------------------------------------------ text splitting */
  function splitWords(el, cls, masked) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = cls;
            if (masked) {
              const inner = document.createElement('span');
              inner.textContent = part;
              inner.style.setProperty('--i', i);
              w.appendChild(inner);
            } else {
              w.textContent = part;
            }
            i++;
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(el);
    return i;
  }
  $$('[data-split]').forEach((el) => splitWords(el, 'w', true));

  const statement = $('[data-scrub]');
  splitWords(statement, 'sw', false);
  const sWords = $$('.sw', statement);
  let sLit = -1;
  function updateStatement() {
    if (reduce) return;
    const r = statement.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3));
    const lit = Math.round(p * sWords.length);
    if (lit === sLit) return;
    sLit = lit;
    sWords.forEach((w, i) => w.classList.toggle('on', i < lit));
  }

  /* ------------------------------------------------------------ reveals */
  $$('.pillars [data-reveal]').forEach((el, i) => el.style.setProperty('--d', `${i * 0.08}s`));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal], [data-split], [data-clip]').forEach((el) => (reduce ? el.classList.add('is-in') : io.observe(el)));

  /* ------------------------------------------------------------ parallax */
  const plx = $$('[data-parallax]').map((el) => {
    const img = el.tagName === 'IMG' ? el : $('img', el);
    return { img, box: img.parentElement, s: parseFloat(el.dataset.parallax) || 0.1 };
  });
  function updateParallax() {
    for (const p of plx) {
      const r = p.box.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) continue;
      const extra = Math.max(0, (p.img.offsetHeight - r.height) / 2);
      const off = clamp((r.top + r.height / 2 - vh / 2) * p.s, -extra, extra);
      p.img.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    }
  }

  const heroMedia = $('[data-hero-media]');
  const heroCopy = $('[data-hero-copy]');
  const heroMeta = $('[data-hero-meta]');
  function updateHero(y) {
    const h = hero.offsetHeight;
    if (y > h) return;
    const p = y / h;
    heroMedia.style.transform = `translate3d(0, ${(y * 0.32).toFixed(1)}px, 0)`;
    heroCopy.style.transform = `translate3d(0, ${(y * -0.12).toFixed(1)}px, 0)`;
    heroCopy.style.opacity = String(clamp(1 - p * 1.5));
    heroMeta.style.opacity = hero.classList.contains('is-loaded') ? String(clamp(1 - p * 2.2)) : '';
  }

  const stage = $('[data-edit-stage]');
  function updateStage() {
    if (reduce) return;
    const r = stage.getBoundingClientRect();
    if (r.top > vh || r.bottom < 0) return;
    stage.style.setProperty('--ex', clamp((vh - r.top) / (vh * 0.85)).toFixed(3));
  }

  /* ------------------------------------------------------------ marquee */
  const mq = $('[data-marquee]');
  const track = $('.marquee__track', mq);
  track.innerHTML += track.innerHTML;
  let mqX = 0, mqBoost = 0, mqDir = 1, mqVisible = false, mqHalf = 0;
  const measureMq = () => { mqHalf = track.scrollWidth / 2; };
  measureMq();
  addEventListener('resize', measureMq, { passive: true });
  new IntersectionObserver(([en]) => { mqVisible = en.isIntersecting; }).observe(mq);
  function stepMarquee(dt) {
    if (!mqVisible || reduce || !mqHalf) return;
    mqBoost *= 0.92;
    mqX -= mqDir * (70 + mqBoost) * dt;
    if (mqX <= -mqHalf) mqX += mqHalf;
    if (mqX > 0) mqX -= mqHalf;
    track.style.transform = `translate3d(${mqX.toFixed(2)}px, 0, 0)`;
  }

  /* ------------------------------------------------------------ edit player */
  const edit = $('[data-edit]');
  const shots = $$('[data-shot]', edit);
  const barsBox = $('[data-bars]', edit);
  const wordMask = $('.edit__word', edit);
  const wordEl = $('[data-word]', edit);
  const subEl = $('[data-subtitle]', edit);
  const idxEl = $('[data-idx]', edit);
  const tcEl = $('[data-tc]', edit);
  const playBtn = $('[data-play]', edit);
  const muteBtn = $('[data-mute]', edit);
  const pad = (n) => String(n).padStart(2, '0');

  const durs = shots.map((s) => parseInt(s.dataset.duration, 10) || 6000);
  const bars = shots.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Escena ${i + 1}: ${s.dataset.caption}`);
    b.appendChild(document.createElement('i'));
    barsBox.appendChild(b);
    b.addEventListener('click', (e) => { e.stopPropagation(); go(i, true); });
    return b;
  });
  shots.forEach((s, i) => {
    const v = $('video', s);
    if (!v) return;
    const setDur = () => { if (v.duration && isFinite(v.duration)) durs[i] = Math.min(v.duration * 1000, 12000); };
    v.addEventListener('loadedmetadata', setDur);
    setDur();
    v.addEventListener('ended', () => { if (cur === i) go(i + 1); });
  });

  let cur = -1, elapsed = 0, startT = 0, wantPlay = !reduce, visible = false, sound = false, captionTimer = 0;
  const isRunning = () => wantPlay && visible && !document.hidden;
  const videoOf = (i) => $('video', shots[i]);

  function setCaption(i, instant) {
    const s = shots[i];
    idxEl.textContent = `${pad(i + 1)} / ${pad(shots.length)}`;
    clearTimeout(captionTimer);
    if (instant || reduce) {
      wordEl.textContent = s.dataset.caption;
      subEl.textContent = s.dataset.sub || '';
      return;
    }
    wordMask.classList.add('is-out');
    subEl.classList.add('is-out');
    captionTimer = setTimeout(() => {
      wordEl.textContent = s.dataset.caption;
      subEl.textContent = s.dataset.sub || '';
      wordMask.classList.remove('is-out');
      wordMask.classList.add('is-pre');
      void wordMask.offsetWidth;
      wordMask.classList.remove('is-pre');
      subEl.classList.remove('is-out');
    }, 420);
  }

  function go(i, user) {
    i = (i + shots.length) % shots.length;
    const prev = cur;
    if (prev === i && !user) return;
    if (prev > -1 && prev !== i) {
      const ps = shots[prev];
      ps.classList.remove('is-active');
      ps.classList.add('is-leaving');
      const pv = videoOf(prev);
      setTimeout(() => { ps.classList.remove('is-leaving'); if (pv && cur !== prev) pv.pause(); }, 600);
    }
    cur = i;
    elapsed = 0;
    startT = performance.now();
    const s = shots[i];
    s.style.setProperty('--dur', `${durs[i]}ms`);
    s.classList.remove('is-active');
    void s.offsetWidth;
    s.classList.add('is-active');
    const v = videoOf(i);
    if (v) {
      v.currentTime = 0;
      v.muted = !sound;
      if (isRunning()) v.play().catch(() => {});
    }
    bars.forEach((b, j) => b.style.setProperty('--p', j < i ? 1 : 0));
    setCaption(i, prev === -1);
  }

  function setPlaying(on) {
    wantPlay = on;
    sync();
  }
  function sync() {
    const run = isRunning();
    edit.classList.toggle('is-paused', !wantPlay);
    playBtn.setAttribute('aria-label', wantPlay ? 'Pausar' : 'Reproducir');
    const v = cur > -1 ? videoOf(cur) : null;
    if (run) {
      startT = performance.now() - elapsed;
      if (v) v.play().catch(() => {});
    } else {
      if (startT) elapsed = performance.now() - startT;
      if (v) v.pause();
    }
  }

  function tickEdit(now) {
    if (cur < 0 || !isRunning()) return;
    const v = videoOf(cur);
    let t, d = durs[cur];
    if (v) {
      if (v.error || (v.readyState < 2 && now - startT > 4000)) { go(cur + 1); return; }
      t = v.currentTime * 1000;
    } else {
      t = now - startT;
      elapsed = t;
      if (t >= d) { go(cur + 1); return; }
    }
    bars[cur].style.setProperty('--p', clamp(t / d).toFixed(4));
    let total = t;
    for (let j = 0; j < cur; j++) total += durs[j];
    const sec = Math.floor(total / 1000);
    tcEl.textContent = `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}:${pad(Math.floor((total % 1000) / 41.667))}`;
  }

  go(0);
  edit.classList.toggle('is-paused', !wantPlay);
  playBtn.addEventListener('click', (e) => { e.stopPropagation(); setPlaying(!wantPlay); });
  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sound = !sound;
    muteBtn.setAttribute('aria-pressed', String(sound));
    muteBtn.setAttribute('aria-label', sound ? 'Silenciar' : 'Activar sonido');
    const v = videoOf(cur);
    if (v) v.muted = !sound;
    if (sound && !wantPlay) setPlaying(true);
  });
  edit.addEventListener('click', (e) => { if (!e.target.closest('button')) setPlaying(!wantPlay); });
  edit.addEventListener('keydown', (e) => {
    if (e.target !== edit) return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'k') { e.preventDefault(); setPlaying(!wantPlay); }
    if (e.key === 'ArrowRight') go(cur + 1, true);
    if (e.key === 'ArrowLeft') go(cur - 1, true);
  });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }, { threshold: 0.35 }).observe(edit);
  new IntersectionObserver(([en], obs) => {
    if (!en.isIntersecting) return;
    $$('video', edit).forEach((v) => { v.preload = 'auto'; });
    obs.disconnect();
  }, { rootMargin: '800px 0px' }).observe(edit);
  document.addEventListener('visibilitychange', sync);

  /* ------------------------------------------------------------ rail */
  const rail = $('[data-rail]');
  const railBar = $('[data-rail-progress]');
  const updateRail = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    railBar.style.setProperty('--rp', (0.08 + 0.92 * (max > 0 ? rail.scrollLeft / max : 1)).toFixed(3));
  };
  rail.addEventListener('scroll', updateRail, { passive: true });
  updateRail();
  const step = () => { const c = $('.card', rail); return c ? c.getBoundingClientRect().width + 20 : 400; };
  $('[data-rail-prev]').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
  $('[data-rail-next]').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  rail.addEventListener('keydown', (e) => {
    if (e.target !== rail) return;
    if (e.key === 'ArrowRight') rail.scrollBy({ left: step(), behavior: 'smooth' });
    if (e.key === 'ArrowLeft') rail.scrollBy({ left: -step(), behavior: 'smooth' });
  });

  let drag = null, dragged = false;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: rail.scrollLeft };
    dragged = false;
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!dragged && Math.abs(dx) > 6) { dragged = true; rail.classList.add('is-dragging'); }
    if (dragged) rail.scrollLeft = drag.left - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    drag = null;
    if (dragged) {
      rail.classList.remove('is-dragging');
      const c = $('.card', rail);
      if (c) {
        const w = step();
        rail.scrollTo({ left: Math.round(rail.scrollLeft / w) * w, behavior: 'smooth' });
      }
    }
  });
  rail.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);

  $$('.card--video', rail).forEach((card) => {
    const v = $('video', card);
    card.addEventListener('mouseenter', () => { v.preload = 'auto'; v.play().catch(() => {}); });
    card.addEventListener('mouseleave', () => v.pause());
  });

  /* ------------------------------------------------------------ lightbox */
  const lb = $('[data-lb]');
  const lbBody = $('[data-lb-body]');
  let lbReturn = null;
  $$('[data-lightbox]').forEach((btn) => btn.addEventListener('click', () => {
    lbReturn = btn;
    lbBody.textContent = '';
    if (btn.dataset.lightbox === 'video') {
      const v = document.createElement('video');
      Object.assign(v, { src: btn.dataset.src, controls: true, autoplay: true, playsInline: true });
      lbBody.appendChild(v);
      setPlaying(false);
    } else {
      const img = document.createElement('img');
      img.src = btn.dataset.src;
      img.alt = btn.getAttribute('aria-label').replace(/^Ver foto:\s*/, '');
      lbBody.appendChild(img);
    }
    lb.showModal();
    lockScroll(true);
  }));
  lb.addEventListener('close', () => {
    lbBody.textContent = '';
    lockScroll(false);
    if (lbReturn) lbReturn.focus();
  });
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target === lbBody) lb.close(); });
  $('[data-lb-close]').addEventListener('click', () => lb.close());

  /* ------------------------------------------------------------ contact form */
  const form = $('[data-form]');
  const intents = $('.intents', form);
  const extras = $$('.extra', form);
  const sent = $('[data-sent]', form);
  const msgEl = $('[data-msg]', form);
  const channels = $('[data-channels]', form);
  const statusEl = $('[data-status]', form);
  const INTENT_TEXT = {
    cliente: 'Me interesa que AC entrene a mi caballo.',
    prospecto: 'Estoy buscando un prospecto de competencia.',
    marca: 'Me gustaría colaborar con mi marca.',
    proveedor: 'Quiero ofrecer mi producto o servicio.',
  };
  const LABELS = {
    caballo: 'Caballo', etapa: 'Etapa', nivel: 'Nivel buscado', presupuesto: 'Presupuesto',
    marca: 'Marca', colaboracion: 'Colaboración', empresa: 'Empresa', categoria: 'Categoría',
    nombre: 'Nombre', whatsapp: 'WhatsApp', correo: 'Correo', ciudad: 'Ciudad', mensaje: 'Mensaje',
  };

  function showExtra(val) {
    extras.forEach((x) => {
      const on = x.dataset.for === val;
      x.hidden = !on;
      $$('input, select', x).forEach((f) => { f.disabled = !on; });
    });
    intents.classList.remove('is-invalid');
  }
  function setIntent(val) {
    const r = $(`input[name="motivo"][value="${val}"]`, form);
    if (!r) return;
    r.checked = true;
    showExtra(val);
  }
  showExtra(null);
  form.addEventListener('change', (e) => { if (e.target.name === 'motivo') showExtra(e.target.value); });
  form.addEventListener('input', () => { if (!sent.hidden) sent.hidden = true; });
  const qp = new URLSearchParams(location.search).get('motivo');
  if (qp) setIntent(qp);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('was-validated');
    const motivo = form.elements.motivo.value;
    if (!motivo) {
      intents.classList.add('is-invalid');
      $('input[name="motivo"]', form).focus();
      return;
    }
    const bad = $$('input, select, textarea', $('[data-form-body]', form)).find((f) => !f.disabled && !f.checkValidity());
    if (bad) { bad.focus(); bad.reportValidity(); return; }

    const data = new FormData(form);
    const lines = [`Hola, Ale. ${INTENT_TEXT[motivo]}`, ''];
    Object.keys(LABELS).forEach((k) => {
      const v = (data.get(k) || '').toString().trim();
      if (v) lines.push(`${LABELS[k]}: ${v}`);
    });
    const msg = lines.join('\n');
    msgEl.value = msg;

    channels.textContent = '';
    const addBtn = (label, onClick, ghost) => {
      const b = document.createElement(onClick.href ? 'a' : 'button');
      b.className = 'btn' + (ghost ? ' btn--ghost' : '');
      if (onClick.href) { b.href = onClick.href; b.target = '_blank'; b.rel = 'noopener'; }
      else { b.type = 'button'; b.addEventListener('click', onClick); }
      b.innerHTML = `<span>${label}</span><i aria-hidden="true">→</i>`;
      channels.appendChild(b);
    };
    const copy = async () => {
      try { await navigator.clipboard.writeText(msg); return true; }
      catch { msgEl.focus(); msgEl.select(); return false; }
    };
    if (CONTACT.whatsapp) addBtn('Enviar por WhatsApp', { href: `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(msg)}` });
    addBtn('Copiar y abrir Instagram', async () => {
      const ok = await copy();
      statusEl.textContent = ok ? 'Mensaje copiado. Pégalo en el chat de Instagram que se abrió.' : 'Selecciona el texto y cópialo para pegarlo en Instagram.';
      window.open(`https://ig.me/m/${CONTACT.instagram}`, '_blank', 'noopener');
    }, !!CONTACT.whatsapp);
    if (CONTACT.email) addBtn('Enviar por correo', { href: `mailto:${CONTACT.email}?subject=${encodeURIComponent('Contacto AC Performance Horses')}&body=${encodeURIComponent(msg)}` }, true);
    addBtn('Copiar mensaje', async () => {
      statusEl.textContent = (await copy()) ? 'Mensaje copiado.' : 'Texto seleccionado; usa Copiar en tu dispositivo.';
    }, true);

    statusEl.textContent = '';
    sent.hidden = false;
    sent.focus({ preventScroll: true });
    if (sent.getBoundingClientRect().bottom > vh) scrollToEl(sent);
  });

  /* ------------------------------------------------------------ footer fit */
  const fit = $('[data-fit]');
  function fitFooter() {
    if (!fit) return;
    const cs = getComputedStyle(fit);
    const avail = fit.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    fit.style.fontSize = '100px';
    const range = document.createRange();
    range.selectNodeContents(fit);
    const w = range.getBoundingClientRect().width;
    if (w) fit.style.fontSize = `${Math.floor(100 * (avail / w) * 10) / 10}px`;
  }
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------ main loop */
  let prevY = -1, prevT = performance.now();
  function frame(t) {
    if (lenis) lenis.raf(t);
    const dt = Math.min(0.05, (t - prevT) / 1000);
    prevT = t;
    const y = scrollY;
    if (y !== prevY) {
      const dy = y - prevY;
      if (prevY >= 0) { mqDir = dy >= 0 ? 1 : -1; mqBoost = Math.min(mqBoost + Math.abs(dy) * 6, 900); }
      prevY = y;
      updateHeader(y);
      updateHero(y);
      updateStatement();
      updateParallax();
      updateStage();
    }
    stepMarquee(dt);
    tickEdit(t);
    requestAnimationFrame(frame);
  }
  addEventListener('resize', () => { prevY = -1; }, { passive: true });
  requestAnimationFrame(frame);
})();
