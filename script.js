/*  script.js — two behaviours, both restrained.
 *
 *    1.  Reveal-on-scroll: every element tagged [data-reveal]
 *        receives an `.is-in` class the first time it crosses
 *        into the viewport. CSS handles the fade.
 *
 *    2.  Feature-card animation: when a `.feature-card` first
 *        enters the viewport, the launcher's query types itself
 *        in (with a blinking caret), then the result rows + count
 *        stagger-fade into view. Once per card; no scrubbing.
 *
 *  Both behaviours degrade politely under prefers-reduced-motion:
 *  reveals appear immediately; the feature-card animation is
 *  skipped (the query and rows remain visible from the start).
 */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----------------------------------------------------------------
  // 1. Reveal-on-scroll
  // ----------------------------------------------------------------
  const reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if (!('IntersectionObserver' in window) || reducedMotion) {
      reveals.forEach((el) => el.classList.add('is-in'));
    } else {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
      );
      reveals.forEach((el) => {
        el.classList.add('reveal');
        const delay = el.getAttribute('data-reveal-delay');
        if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');
        io.observe(el);
      });
    }
  }

  // ----------------------------------------------------------------
  // 2. Feature-card animation
  // ----------------------------------------------------------------
  const cards = Array.from(document.querySelectorAll('.feature-card'));
  if (!cards.length) return;

  // Reduced motion or no IO → leave the cards in their HTML state
  // (text visible, rows visible). Nothing to animate.
  if (!('IntersectionObserver' in window) || reducedMotion) return;

  // Capture each card's target text BEFORE clearing it, so the
  // animation function has the source of truth.
  cards.forEach((card) => {
    const liText = card.querySelector('.li-text');
    if (!liText) return;
    liText.dataset.target = liText.textContent;
    liText.textContent = '';
    card.classList.add('is-animating');
  });

  function animateCard(card) {
    const liText = card.querySelector('.li-text');
    if (!liText) {
      // No typing target on this card — just reveal the rows.
      card.classList.add('is-revealed');
      return;
    }

    const target = liText.dataset.target || '';
    card.classList.add('is-typing');

    let i = 0;
    const step = () => {
      if (i > target.length) {
        // Done typing — drop the caret, then start the row stagger.
        card.classList.remove('is-typing');
        card.classList.add('is-revealed');
        return;
      }
      liText.textContent = target.slice(0, i);
      i++;
      // Slight per-char jitter so the typing reads as real, not
      // metronomic. Punctuation/space gets a beat extra.
      const ch = target[i - 1];
      const base = 55 + Math.random() * 30;
      const delay = (ch === ' ' || ch === '/') ? base + 50 : base;
      window.setTimeout(step, delay);
    };
    window.setTimeout(step, 220);
  }

  // Lower threshold + negative bottom rootMargin so the animation
  // fires as soon as the card's top edge crosses the bottom 15%
  // of the viewport — i.e. just as the card becomes visible. That
  // gives the user time to watch the typing instead of seeing
  // only the end state.
  const animObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCard(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px -15% 0px' }
  );
  cards.forEach((card) => animObserver.observe(card));
})();
