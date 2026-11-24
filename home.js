/* AC Performance Horses — interactions shared by index, acerca and entrenamiento */
(() => {
  'use strict';

  /* Contact channels. Fill whatsapp (digits with country code, e.g. "523312345678")
     and/or email to enable those buttons after the form is submitted. */
  const CONTACT = { instagram: 'ale_casillass', whatsapp: '', email: '' };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const pad = (n) => String(n).padStart(2, '0');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) document.documentElement.classList.add('reduce');

  let vh = innerHeight;
  const onScroll = [];   // fns(y) run when scroll position changes
  const onFrame = [];    // fns(t, dt) run every frame

  /* ------------------------------------------------------------ smooth scroll */
  let lenis = null;
  if (!reduce && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true });
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
  const top = $('[data-top]');
  const burger = $('.hdr__burger');
  const themed = $$('main [data-theme], footer[data-theme]');
  let lastY = scrollY, menuOpen = false, loginOpen = false;
  $$('.hdr__list li').forEach((li, i) => li.style.setProperty('--i', i));

  onScroll.push((y) => {
    const topH = top ? top.offsetHeight : 0;
    const dy = y - lastY;
    if (Math.abs(dy) > 6) {
      hdr.classList.toggle('is-hidden', dy > 0 && y > Math.max(topH * 0.5, 120) && !menuOpen && !loginOpen);
      lastY = y;
    }
    hdr.classList.toggle('is-solid', y > Math.max(topH - hdr.offsetHeight, 10));
    const probe = hdr.offsetHeight / 2;
    let theme = 'dark';
    for (const el of themed) {
      const r = el.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) theme = el.dataset.theme;
    }
    if (hdr.dataset.theme !== theme) hdr.dataset.theme = theme;
  });

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
  let setIntent = () => {};
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
    history.replaceState(null, '', '#' + id);
  });

  /* ------------------------------------------------------------ intro (hero / page hero) */
  if (top) {
    const img = $('img', top);
    const ready = Promise.all([
      img && img.decode ? img.decode().catch(() => {}) : Promise.resolve(),
      document.fonts ? document.fonts.ready : Promise.resolve(),
    ]);
    Promise.race([ready, new Promise((r) => setTimeout(r, 1600))]).then(() => {
      requestAnimationFrame(() => top.classList.add('is-loaded'));
      fitFooter();
    });
    const media = $('[data-hero-media], .phero__media', top);
    const copy = $('[data-hero-copy], .phero__inner', top);
    onScroll.push((y) => {
      const h = top.offsetHeight;
      if (y > h) return;
      if (media) media.style.transform = `translate3d(0, ${(y * 0.32).toFixed(1)}px, 0)`;
      if (copy) {
        copy.style.transform = `translate3d(0, ${(y * -0.12).toFixed(1)}px, 0)`;
        copy.style.opacity = String(clamp(1 - (y / h) * 1.5));
      }
    });
  }

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
  }
  $$('[data-split]').forEach((el) => splitWords(el, 'w', true));

  const statement = $('[data-scrub]');
  if (statement) {
    splitWords(statement, 'sw', false);
    const words = $$('.sw', statement);
    let lit = -1;
    onScroll.push(() => {
      if (reduce) return;
      const r = statement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const n = Math.round(clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3)) * words.length);
      if (n === lit) return;
      lit = n;
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    });
  }

  /* ------------------------------------------------------------ reveals */
  $$('.pillars [data-reveal]').forEach((el, i) => el.style.setProperty('--d', `${i * 0.08}s`));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal], [data-split], [data-clip]').forEach((el) => (reduce ? el.classList.add('is-in') : io.observe(el)));
  /* clip-path hides an element from IntersectionObserver, so watch its (unclipped) parent */
  const clipIo = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      $$(':scope > [data-reveal-clip]', en.target).forEach((el) => el.classList.add('is-in'));
      clipIo.unobserve(en.target);
    });
  }, { threshold: 0.1 });
  new Set($$('[data-reveal-clip]').map((el) => el.parentElement)).forEach((p) => {
    if (reduce) $$(':scope > [data-reveal-clip]', p).forEach((el) => el.classList.add('is-in'));
    else clipIo.observe(p);
  });

  /* ------------------------------------------------------------ parallax */
  const plx = $$('[data-parallax]').map((el) => {
    const img = el.tagName === 'IMG' ? el : $('img', el);
    return { img, box: img.parentElement, s: parseFloat(el.dataset.parallax) || 0.1 };
  });
  if (plx.length) onScroll.push(() => {
    for (const p of plx) {
      const r = p.box.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) continue;
      const extra = Math.max(0, (p.img.offsetHeight - r.height) / 2);
      const off = clamp((r.top + r.height / 2 - vh / 2) * p.s, -extra, extra);
      p.img.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    }
  });

  /* ------------------------------------------------------------ marquee */
  const mq = $('[data-marquee]');
  if (mq) {
    const track = $('.marquee__track', mq);
    track.innerHTML += track.innerHTML;
    let x = 0, boost = 0, dir = 1, visible = false, half = 0, prevY = scrollY;
    const measure = () => { half = track.scrollWidth / 2; };
    measure();
    addEventListener('resize', measure, { passive: true });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(mq);
    onScroll.push((y) => {
      const dy = y - prevY;
      prevY = y;
      dir = dy >= 0 ? 1 : -1;
      boost = Math.min(boost + Math.abs(dy) * 6, 900);
    });
    onFrame.push((t, dt) => {
      if (!visible || reduce || !half) return;
      boost *= 0.92;
      x -= dir * (70 + boost) * dt;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    });
  }

  /* ------------------------------------------------------------ video edit */
  const edit = $('[data-edit]');
  let pauseEdit = () => {};
  if (edit) {
    const shots = $$('[data-shot]', edit);
    const wordMask = $('.edit__word', edit);
    const wordEl = $('[data-word]', edit);
    const subEl = $('[data-subtitle]', edit);
    const idxEl = $('[data-idx]', edit);
    const tcEl = $('[data-tc]', edit);
    const playBtn = $('[data-play]', edit);
    const muteBtn = $('[data-mute]', edit);
    const durs = shots.map((s) => parseInt(s.dataset.duration, 10) || 6000);
    const videoOf = (i) => $('video', shots[i]);
    let cur = -1, elapsed = 0, startT = 0, wantPlay = !reduce, visible = false, sound = false, capTimer = 0;
    const running = () => wantPlay && visible && !document.hidden;

    const bars = shots.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Video ${i + 1}: ${s.dataset.caption}`);
      b.appendChild(document.createElement('i'));
      $('[data-bars]', edit).appendChild(b);
      b.addEventListener('click', (e) => { e.stopPropagation(); go(i, true); });
      return b;
    });
    shots.forEach((s, i) => {
      const v = videoOf(i);
      if (!v) return;
      const setDur = () => { if (v.duration && isFinite(v.duration)) durs[i] = Math.min(v.duration * 1000, 15000); };
      v.addEventListener('loadedmetadata', setDur);
      setDur();
      v.addEventListener('ended', () => { if (cur === i) go(i + 1); });
    });

    const setCaption = (i, instant) => {
      const s = shots[i];
      idxEl.textContent = `${pad(i + 1)} / ${pad(shots.length)}`;
      clearTimeout(capTimer);
      if (instant || reduce) {
        wordEl.textContent = s.dataset.caption;
        subEl.textContent = s.dataset.sub || '';
        return;
      }
      wordMask.classList.add('is-out');
      subEl.classList.add('is-out');
      capTimer = setTimeout(() => {
        wordEl.textContent = s.dataset.caption;
        subEl.textContent = s.dataset.sub || '';
        wordMask.classList.remove('is-out');
        wordMask.classList.add('is-pre');
        void wordMask.offsetWidth;
        wordMask.classList.remove('is-pre');
        subEl.classList.remove('is-out');
      }, 420);
    };

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
        if (running()) v.play().catch(() => {});
      }
      bars.forEach((b, j) => b.style.setProperty('--p', j < i ? 1 : 0));
      setCaption(i, prev === -1);
    }

    const sync = () => {
      edit.classList.toggle('is-paused', !wantPlay);
      playBtn.setAttribute('aria-label', wantPlay ? 'Pausar' : 'Reproducir');
      const v = cur > -1 ? videoOf(cur) : null;
      if (running()) {
        startT = performance.now() - elapsed;
        if (v) v.play().catch(() => {});
      } else {
        if (startT) elapsed = performance.now() - startT;
        if (v) v.pause();
      }
    };
    const setPlaying = (on) => { wantPlay = on; sync(); };
    pauseEdit = () => setPlaying(false);

    onFrame.push((now) => {
      if (cur < 0 || !running()) return;
      const v = videoOf(cur);
      const d = durs[cur];
      let t;
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
    });

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
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }, { threshold: 0.3 }).observe(edit.parentElement);
    new IntersectionObserver(([en], obs) => {
      if (!en.isIntersecting) return;
      $$('video', edit).forEach((v) => { v.preload = 'auto'; });
      obs.disconnect();
    }, { rootMargin: '900px 0px' }).observe(edit.parentElement);
    document.addEventListener('visibilitychange', sync);
  }

  /* ------------------------------------------------------------ photo tiles (cycle beside the video) */
  $$('[data-tile]').forEach((tile) => {
    const imgs = $$('img', tile);
    const cap = $('[data-tile-cap]', tile);
    const num = $('[data-tile-n]', tile);
    if (imgs.length < 2) return;
    let i = 0, timer = 0, visible = false;
    imgs[0].classList.add('is-active');
    const show = (n) => {
      const prev = imgs[i];
      i = n % imgs.length;
      const next = imgs[i];
      prev.classList.remove('is-active');
      prev.classList.add('is-prev');
      next.classList.remove('is-prev');
      void next.offsetWidth;
      next.classList.add('is-active');
      setTimeout(() => prev.classList.remove('is-prev'), 1300);
      const n2 = i;
      setTimeout(() => {
        cap.textContent = next.dataset.cap || '';
        num.textContent = `${pad(n2 + 1)} / ${pad(imgs.length)}`;
      }, 450);
    };
    const loop = () => { show(i + 1); timer = setTimeout(loop, 4200); };
    const start = () => { clearTimeout(timer); timer = setTimeout(loop, 2600 + (parseInt(tile.dataset.delay, 10) || 0)); };
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (reduce) return;
      if (visible) start(); else clearTimeout(timer);
    }, { threshold: 0.2 }).observe(tile.parentElement);
    tile.addEventListener('click', () => { clearTimeout(timer); show(i + 1); if (visible && !reduce) start(); });
  });

  /* ------------------------------------------------------------ rail */
  const rail = $('[data-rail]');
  if (rail) {
    const bar = $('[data-rail-progress]');
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      bar.style.setProperty('--rp', (0.08 + 0.92 * (max > 0 ? rail.scrollLeft / max : 1)).toFixed(3));
    };
    rail.addEventListener('scroll', update, { passive: true });
    update();
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
        const w = step();
        rail.scrollTo({ left: Math.round(rail.scrollLeft / w) * w, behavior: 'smooth' });
      }
    });
    rail.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
    $$('.card--video', rail).forEach((card) => {
      const v = $('video', card);
      card.addEventListener('mouseenter', () => { v.preload = 'auto'; v.play().catch(() => {}); });
      card.addEventListener('mouseleave', () => v.pause());
    });
  }

  /* ------------------------------------------------------------ lightbox */
  const lb = $('[data-lb]');
  if (lb) {
    const body = $('[data-lb-body]', lb);
    let returnTo = null;
    $$('[data-lightbox]').forEach((btn) => btn.addEventListener('click', () => {
      returnTo = btn;
      body.textContent = '';
      if (btn.dataset.lightbox === 'video') {
        const v = document.createElement('video');
        Object.assign(v, { src: btn.dataset.src, controls: true, autoplay: true, playsInline: true });
        body.appendChild(v);
        pauseEdit();
      } else {
        const img = document.createElement('img');
        img.src = btn.dataset.src;
        img.alt = btn.getAttribute('aria-label').replace(/^Ver foto:\s*/, '');
        body.appendChild(img);
      }
      lb.showModal();
      lockScroll(true);
    }));
    lb.addEventListener('close', () => { body.textContent = ''; lockScroll(false); if (returnTo) returnTo.focus(); });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target === body) lb.close(); });
    $('[data-lb-close]', lb).addEventListener('click', () => lb.close());
  }

  /* ------------------------------------------------------------ contact form */
  const form = $('[data-form]');
  if (form) {
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
    const showExtra = (val) => {
      extras.forEach((x) => {
        const on = x.dataset.for === val;
        x.hidden = !on;
        $$('input, select', x).forEach((f) => { f.disabled = !on; });
      });
      intents.classList.remove('is-invalid');
    };
    setIntent = (val) => {
      const r = $(`input[name="motivo"][value="${val}"]`, form);
      if (!r) return;
      r.checked = true;
      showExtra(val);
    };
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
      const addBtn = (label, action, ghost) => {
        const b = document.createElement(action.href ? 'a' : 'button');
        b.className = 'btn' + (ghost ? ' btn--ghost' : '');
        if (action.href) { b.href = action.href; b.target = '_blank'; b.rel = 'noopener'; }
        else { b.type = 'button'; b.addEventListener('click', action); }
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
  }

  /* ------------------------------------------------------------ footer fit + year */
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
  fitFooter();
  if (document.fonts) document.fonts.ready.then(fitFooter);
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------ main loop */
  let prevY = -1, prevT = performance.now();
  addEventListener('resize', () => { vh = innerHeight; prevY = -1; fitFooter(); }, { passive: true });
  function frame(t) {
    if (lenis) lenis.raf(t);
    const dt = Math.min(0.05, (t - prevT) / 1000);
    prevT = t;
    const y = scrollY;
    if (y !== prevY) {
      prevY = y;
      for (const fn of onScroll) fn(y);
    }
    for (const fn of onFrame) fn(t, dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
