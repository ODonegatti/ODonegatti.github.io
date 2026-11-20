/* ==========================================================================
   animations.js — Estritamente Animacoes & Telemetria Visual (GD // 26)
   Scroll Reveal, Spotlight Metalico, Typing, Contadores & Scroll Calibration
   (Nota: Todos os tooltips dos 8 nos do Arsenal operam 100% em CSS puro)
   ========================================================================== */

(() => {
  'use strict';

  const staticCaptureMode = new URLSearchParams(window.location.search).has('static');
  const prefersReducedMotion =
    staticCaptureMode || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     1. Scroll Reveal (Progressivo via IntersectionObserver)
     ------------------------------------------------------------------------ */
  function initScrollReveal() {
    const elements = document.querySelectorAll('.gd-reveal');
    if (!elements.length || prefersReducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    document.documentElement.classList.add('js-anim-ready');

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });
  }

  /* ------------------------------------------------------------------------
     2. Spotlight Metalico Reativo ao Cursor (Variaveis CSS --spot-x/--spot-y)
     ------------------------------------------------------------------------ */
  function initMetallicSpotlight() {
    if (prefersReducedMotion) return;

    const cards = document.querySelectorAll('.gd-spotlight-card');
    cards.forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--spot-x', `${x.toFixed(1)}%`);
        card.style.setProperty('--spot-y', `${y.toFixed(1)}%`);
      });
    });
  }

  /* ------------------------------------------------------------------------
     3. Efeito Typing no Subtitulo Tecnico do Hero
     ------------------------------------------------------------------------ */
  function initTypingEffect() {
    const target = document.getElementById('gdTypingText');
    if (!target || prefersReducedMotion) return;

    const fullText = target.dataset.text || target.textContent.trim();
    target.textContent = '';

    let index = 0;
    const stepMs = 28;

    const timer = window.setInterval(() => {
      index += 1;
      target.textContent = fullText.slice(0, index);
      if (index >= fullText.length) {
        window.clearInterval(timer);
      }
    }, stepMs);
  }

  /* ------------------------------------------------------------------------
     4. Contadores Numericos de Telemetria (Secao 02)
     ------------------------------------------------------------------------ */
  function initTelemetryCounters() {
    const counters = document.querySelectorAll('[data-counter-target]');
    if (!counters.length || prefersReducedMotion || !('IntersectionObserver' in window)) {
      return;
    }

    const animateCounter = (el) => {
      const target = Number(el.dataset.counterTarget);
      const prefix = el.dataset.counterPrefix || '';
      const suffix = el.dataset.counterSuffix || '';
      const pad = Number(el.dataset.counterPad || 0);
      const duration = 1100;
      const startTime = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        const formatted = pad > 0 ? String(current).padStart(pad, '0') : String(current);
        el.textContent = `${prefix}${formatted}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.45 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------------
     5. Estado Ativo da Navbar Unica + Calibracao Lateral de Scroll
     ------------------------------------------------------------------------ */
  function initNavigationTelemetry() {
    const navLinks = Array.from(document.querySelectorAll('.gd-navbar .nav-link[data-section]'));
    const sections = navLinks
      .map((link) => document.getElementById(link.dataset.section))
      .filter(Boolean);

    const setActive = (id) => {
      navLinks.forEach((link) => {
        const isCurrent = link.dataset.section === id;
        link.classList.toggle('active', isCurrent);
        if (isCurrent) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    if ('IntersectionObserver' in window && sections.length) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActive(entry.target.id);
            }
          });
        },
        { rootMargin: '-38% 0px -48% 0px', threshold: 0 }
      );

      sections.forEach((sec) => sectionObserver.observe(sec));

      // Limpa o estado ativo ao retornar ao topo (#hero)
      const hero = document.getElementById('hero');
      if (hero) {
        const heroObserver = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) setActive('');
          },
          { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
        );
        heroObserver.observe(hero);
      }
    }

    // Fecha o menu colapsado no mobile ao clicar em qualquer link
    const collapseEl = document.getElementById('gdNavbarCollapse');
    if (collapseEl && window.bootstrap && window.bootstrap.Collapse) {
      navLinks.forEach((link) => {
        link.addEventListener('click', () => {
          if (collapseEl.classList.contains('show')) {
            const instance = window.bootstrap.Collapse.getOrCreateInstance(collapseEl);
            instance.hide();
          }
        });
      });
    }

    // Indicador da regua lateral SCROLL_CALIBRATION
    const indicator = document.getElementById('gdScrollIndicator');
    if (indicator) {
      const trackTravelPx = 110;
      const updateIndicator = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;
        indicator.style.transform = `translateY(${(ratio * trackTravelPx).toFixed(1)}px)`;
      };

      window.addEventListener('scroll', updateIndicator, { passive: true });
      window.addEventListener('resize', updateIndicator, { passive: true });
      updateIndicator();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initMetallicSpotlight();
    initTypingEffect();
    initTelemetryCounters();
    initNavigationTelemetry();
  });
})();
