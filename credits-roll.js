(() => {
  const crew = [
    ['Creative direction', 'Amara Price'], ['Gameplay design', 'Caleb Reyes'],
    ['Environment art', 'Mina Wells'], ['Character art', 'June Sato'],
    ['Animation', 'Felix Ibarra'], ['Animation', 'Suri Lane'],
    ['Lighting', 'Theo Park'], ['Interface design', 'Dani Brooks'],
    ['Writing', 'Nora Vale'], ['Sound design', 'Imani Reed'],
    ['Music supervision', 'Aaron Kim'], ['Playtesting', 'Tess Morgan'],
    ['Playtesting', 'Nico Ellis'], ['Production', 'Eli Cruz'],
  ];
  window.bindCreditsRoll = (panel, { photos, actual = [] }) => {
    panel.creditsCleanup?.();
    const list = panel.querySelector('[data-credits-roll]');
    const image = panel.querySelector('[data-credits-image]');
    const caption = panel.querySelector('[data-credits-caption]');
    const pause = panel.querySelector('[data-credits-pause]');
    const next = panel.querySelector('[data-credits-next]');
    const content = document.createDocumentFragment();
    function rows(title, entries) {
      if (!entries.length) return;
      const label = document.createElement('h3');
      label.textContent = title;
      const pairs = document.createElement('dl');
      for (const [role, name] of entries) {
        const description = document.createElement('dt');
        description.textContent = role;
        const person = document.createElement('dd');
        person.textContent = name;
        pairs.append(description, person);
      }
      content.append(label, pairs);
    }
    rows('Fictional crew', crew);
    rows('Project credits', actual);
    list.replaceChildren(content);
    list.scrollTop = 0;
    let current = 0;
    let elapsed = 0;
    let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function showPhoto() {
      const photo = photos[current];
      image.hidden = !photo;
      if (photo) image.src = photo.src;
      image.alt = photo?.caption ?? '';
      caption.textContent = photo?.caption ?? 'No stills available yet';
      next.hidden = photos.length < 2;
    }
    function nextPhoto() {
      if (photos.length > 1) current = (current + 1) % photos.length;
      elapsed = 0;
      showPhoto();
    }
    function togglePause() {
      paused = !paused;
      pause.textContent = paused ? 'Resume' : 'Pause';
    }
    pause.textContent = paused ? 'Resume' : 'Pause';
    pause.addEventListener('click', togglePause);
    next.addEventListener('click', nextPhoto);
    showPhoto();
    const timer = setInterval(() => {
      if (paused || !panel.getClientRects().length || list.matches(':hover, :focus-within')) return;
      list.scrollTop += 1;
      elapsed += 35;
      if (elapsed >= 6000) nextPhoto();
    }, 35);
    panel.creditsCleanup = () => {
      clearInterval(timer);
      pause.removeEventListener('click', togglePause);
      next.removeEventListener('click', nextPhoto);
    };
  };
})();
