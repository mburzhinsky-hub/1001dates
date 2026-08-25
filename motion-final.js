const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const resultsGrid = $('#resultsGrid');
if (resultsGrid) {
  const revealResults = () => {
    resultsGrid.classList.remove('results-ready');
    requestAnimationFrame(() => requestAnimationFrame(() => resultsGrid.classList.add('results-ready')));
  };
  new MutationObserver(revealResults).observe(resultsGrid, { childList: true });
  revealResults();
}

const surprise = $('#surprise');
if (surprise) {
  if (!surprise.querySelector('.surprise-star')) {
    const label = surprise.textContent.replace('✦', '').trim();
    surprise.textContent = '';
    const star = document.createElement('span');
    star.className = 'surprise-star';
    star.setAttribute('aria-hidden', 'true');
    star.textContent = '✦';
    const text = document.createElement('span');
    text.textContent = label;
    surprise.append(star, text);
  }
  surprise.addEventListener('click', () => {
    if (reduceMotion.matches) return;
    surprise.classList.remove('surprise-pop');
    void surprise.offsetWidth;
    surprise.classList.add('surprise-pop');
    window.setTimeout(() => surprise.classList.remove('surprise-pop'), 440);
  });
}

const detailScreen = $('.detail-screen');
const detailHead = $('.detail-head', detailScreen || document);
const detailContent = $('#detailContent');
let detailProgressBar = null;

if (detailScreen && detailHead && detailContent) {
  let progress = $('.detail-progress', detailScreen);
  if (!progress) {
    progress = document.createElement('div');
    progress.className = 'detail-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span></span>';
    detailHead.insertAdjacentElement('afterend', progress);
  }
  detailProgressBar = $('span', progress);

  let rafId = 0;
  const updateDetailProgress = () => {
    rafId = 0;
    const maxScroll = Math.max(0, detailContent.scrollHeight - detailContent.clientHeight);
    const value = maxScroll ? Math.min(1, Math.max(0, detailContent.scrollTop / maxScroll)) : 0;
    if (detailProgressBar) detailProgressBar.style.transform = `scaleX(${value})`;

    const chapters = $$('.chapter', detailContent);
    if (!chapters.length) return;
    const contentRect = detailContent.getBoundingClientRect();
    const marker = contentRect.top + Math.min(180, contentRect.height * 0.28);
    let current = chapters[0];
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top <= marker) current = chapter;
      else break;
    }
    chapters.forEach(chapter => chapter.classList.toggle('is-current', chapter === current));
  };

  const requestDetailProgress = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(updateDetailProgress);
  };

  detailContent.addEventListener('scroll', requestDetailProgress, { passive: true });
  new MutationObserver(requestDetailProgress).observe(detailContent, { childList: true, subtree: true });
  window.addEventListener('resize', requestDetailProgress, { passive: true });
  requestDetailProgress();
}
