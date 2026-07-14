(function () {
  const containerSel = '#main-content';
  const FADE_OUT_CLASS = 'fade-out';
  const FADE_IN_CLASS = 'fade-in';
  const TOAST_TIMEOUT = 2600;

  function isInternalLink(href) {
    try {
      const url = new URL(href, location.href);
      return url.origin === location.origin;
    } catch {
      return false;
    }
  }

  function createToast() {
    const toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
    return toast;
  }

  const toast = createToast();
  let toastTimer = null;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), TOAST_TIMEOUT);
  }

  function setActiveTab() {
    const currentPath = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.tabs .tab').forEach((tab) => {
      tab.classList.remove('active');
      if (tab.tagName.toLowerCase() !== 'a') return;
      const targetPath = (new URL(tab.getAttribute('href'), location.href).pathname.split('/').pop() || 'index.html').toLowerCase();
      if (targetPath === currentPath) {
        tab.classList.add('active');
      }
    });
  }

  function animateCards() {
    document.querySelectorAll('.card').forEach((card, index) => {
      card.style.setProperty('--delay', `${index * 60}ms`);
    });
  }

  function initTabTransition() {
    document.querySelectorAll('.tabs a[href]').forEach((tab) => {
      tab.addEventListener('click', (event) => {
        const href = tab.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        event.preventDefault();

        const container = document.querySelector(containerSel) || document.body;
        container.classList.remove(FADE_IN_CLASS);
        container.classList.add(FADE_OUT_CLASS);

        setTimeout(() => {
          window.location.href = href;
        }, 260);
      });
    });
  }

  /*
   transition.js
   Contém lógica de navegação AJAX, animações e interações de UI.
   Principais responsabilidades:
   - Interceptar links com `data-ajax` e carregar conteúdo em `#main-content` via fetch
   - Gerenciar animações de saída/entrada (.fade-out / .fade-in)
   - Inicializar comportamentos: toggle de favoritos, busca, animações de cards e seleção
   - Mostrar notificações rápidas via toast
  */
  function initFavoriteToggle() {
    const button = document.getElementById('favorite-toggle');
    if (!button) return;
    button.addEventListener('click', () => {
      const active = button.classList.toggle('active');
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      showToast(active ? 'Favoritos ativados' : 'Favoritos desativados');
    });
  }

  function initSearchForm() {
    const form = document.querySelector('.search-form');
    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      var input = form.querySelector('input[type="search"]');
      var query = input && input.value ? input.value.trim() : '';
      showToast(query ? `Busca enviada: ${query}` : 'Digite algo para buscar');
    });

    (function(){
      const localContainerSel = '#main-content';
      const localFadeOutClass = 'fade-out';
      const localFadeInClass = 'fade-in';

      function resolveUrl(base, href) {
        try {
          return new URL(href, base).href;
        } catch (e) {
          return href;
        }
      }

      async function loadPage(href, push = true) {
        const container = document.querySelector(localContainerSel);
        if (!container) { window.location.href = href; return; }
        container.classList.remove(localFadeInClass);
        container.classList.add(localFadeOutClass);

        const base = location.href;
        const url = resolveUrl(base, href);

        try {
          const res = await fetch(url, {cache: 'no-store'});
          if (!res.ok) throw new Error('fetch-fail');
          const text = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const newContent = doc.querySelector(localContainerSel);
          if (!newContent) { window.location.href = href; return; }

          setTimeout(() => {
            container.innerHTML = newContent.innerHTML;
            container.classList.remove(localFadeOutClass);
            container.classList.add(localFadeInClass);
            const newTitle = doc.querySelector('title');
            if (newTitle) document.title = newTitle.textContent;
            if (push) history.pushState({url: href}, '', href);
          }, 200);
        } catch (err) {
          window.location.href = href;
        }
      }

      document.addEventListener('click', (e) => {
        const a = e.target.closest('a[data-ajax]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href) return;
        if (/^https?:\/\//i.test(href) && !href.startsWith(location.origin)) return;
        e.preventDefault();
        loadPage(href, true);
      });

      window.addEventListener('popstate', (e) => {
        const url = (e.state && e.state.url) ? e.state.url : location.pathname;
        loadPage(url, false);
      });
    })();
  }

  function initCardSelection() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;
      document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
      card.classList.toggle('selected');
    });
  }

  function initSynopsisModal() {
    const panel = document.getElementById('anime-detail-panel');
    if (!panel) return;

    const backdrop = panel.querySelector('.detail-panel-backdrop');
    const closeButton = panel.querySelector('.detail-panel-close');
    const titleElement = panel.querySelector('.detail-panel-title');
    const metaElement = panel.querySelector('.detail-panel-meta');
    const synopsisElement = panel.querySelector('.detail-panel-synopsis');
    const imageElement = panel.querySelector('.detail-panel-image');
    if (!backdrop || !closeButton || !titleElement || !metaElement || !synopsisElement || !imageElement) return;

    function openPanel(title, meta, synopsis, imageSrc, imageAlt) {
      titleElement.textContent = title;
      metaElement.textContent = meta;
      synopsisElement.textContent = synopsis;
      imageElement.src = imageSrc;
      imageElement.alt = imageAlt;
      panel.style.display = 'grid';
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closePanel() {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      panel.style.display = 'none';
      document.body.style.overflow = '';
    }

    function showAnimeCardDetails(card) {
      if (!card) return;
      var titleElementCard = card.querySelector('.card-title');
      var title = titleElementCard && titleElementCard.textContent ? titleElementCard.textContent.trim() : 'Sinopse';
      var synopsis = card.getAttribute('data-synopsis') || 'Sinopse indisponível.';
      var meta = card.getAttribute('data-meta') || 'Ação • Aventura • 2024';
      var cardImage = card.querySelector('.card-image');
      var imageSrc = cardImage ? cardImage.src : '';
      var imageAlt = cardImage ? cardImage.alt : title;
      openPanel(title, meta, synopsis, imageSrc, imageAlt);
    }

    window.openAnimeDetail = showAnimeCardDetails;

    var animeSection = document.getElementById('animes');
    if (!animeSection) return;

    animeSection.addEventListener('click', function (event) {
      var card = event.target.closest('.card-with-image');
      if (!card || !animeSection.contains(card)) return;
      showAnimeCardDetails(card);
    });

    closeButton.addEventListener('click', closePanel);
    backdrop.addEventListener('click', closePanel);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        closePanel();
      }
    });
  }

  function initCardSwipe() {
    document.querySelectorAll('.cards-row').forEach((row) => {
      let isDragging = false;
      let startX = 0;
      let scrollLeft = 0;

      row.addEventListener('pointerdown', (event) => {
        isDragging = true;
        row.setPointerCapture(event.pointerId);
        startX = event.pageX - row.offsetLeft;
        scrollLeft = row.scrollLeft;
        row.style.cursor = 'grabbing';
      });

      row.addEventListener('pointermove', (event) => {
        if (!isDragging) return;
        const x = event.pageX - row.offsetLeft;
        const walk = (x - startX) * 1.2;
        row.scrollLeft = scrollLeft - walk;
      });

      const stopDrag = () => {
        isDragging = false;
        row.style.cursor = 'grab';
      };

      row.addEventListener('pointerup', stopDrag);
      row.addEventListener('pointerleave', stopDrag);
      row.addEventListener('pointercancel', stopDrag);
    });
  }

  function init() {
    setActiveTab();
    animateCards();
    initFavoriteToggle();
    initTabTransition();
    initSearchForm();
    initCardSelection();
    initSynopsisModal();

    const container = document.querySelector(containerSel);
    if (container) {
      container.classList.add(FADE_IN_CLASS);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('resize', animateCards);

})();
