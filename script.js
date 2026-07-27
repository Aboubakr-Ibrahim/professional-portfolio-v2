const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');
const commandPalette = document.querySelector('#command-palette');
const commandTrigger = document.querySelector('.command-trigger');
const commandClose = document.querySelector('.command-close');

const progress = document.createElement('div');
progress.className = 'scroll-progress';
progress.setAttribute('aria-hidden', 'true');
document.body.prepend(progress);

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 25);
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
}, { passive: true });

menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
  document.body.classList.toggle('menu-open', !open);
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}));

const openCommandPalette = () => {
  if (!commandPalette || commandPalette.open) return;
  commandPalette.showModal();
  commandPalette.querySelector('a')?.focus();
};

commandTrigger?.addEventListener('click', openCommandPalette);
commandClose?.addEventListener('click', () => commandPalette.close());
commandPalette?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => commandPalette.close()));
commandPalette?.addEventListener('click', event => {
  const bounds = commandPalette.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) commandPalette.close();
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openCommandPalette();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    menuButton.focus();
  }
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

const navSections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
const navigationObserver = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  document.body.dataset.section = visible.target.id;
  navLinks.forEach(link => {
    const target = link.getAttribute('href').slice(1);
    const active = target === visible.target.id || (target === 'top' && visible.target.id === 'home');
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-20% 0px -65%', threshold: [0, .15, .4] });
navSections.forEach(section => navigationObserver.observe(section));

const filterButtons = document.querySelectorAll('.filter-button');
const credentials = document.querySelectorAll('.credential-card');

filterButtons.forEach(button => button.addEventListener('click', () => {
  filterButtons.forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const filter = button.dataset.filter;
  credentials.forEach(card => {
    card.hidden = filter !== 'all' && card.dataset.category !== filter;
  });
}));

const modal = document.querySelector('#credential-modal');
const modalImage = document.querySelector('#modal-image');
const modalTitle = document.querySelector('#modal-title');

credentials.forEach(card => card.addEventListener('click', () => {
  modalImage.src = card.dataset.image;
  modalImage.alt = card.dataset.title;
  modalTitle.textContent = card.dataset.title;
  modal.showModal();
}));

document.querySelector('.modal-close')?.addEventListener('click', () => modal.close());
modal.addEventListener('click', event => {
  const bounds = modal.getBoundingClientRect();
  const outside = event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  if (outside) modal.close();
});

document.querySelector('#year').textContent = new Date().getFullYear();

const heroVisual = document.querySelector('.hero-visual');
const canAnimateDepth = window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (heroVisual && canAnimateDepth) {
  heroVisual.addEventListener('pointermove', event => {
    const bounds = heroVisual.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 18;
    heroVisual.style.setProperty('--signal-x', `${x * 0.45}px`);
    heroVisual.style.setProperty('--signal-y', `${y * 0.45}px`);
    heroVisual.style.setProperty('--quality-x', `${x * -0.35}px`);
    heroVisual.style.setProperty('--quality-y', `${y * -0.35}px`);
  });

  heroVisual.addEventListener('pointerleave', () => {
    heroVisual.style.setProperty('--signal-x', '0px');
    heroVisual.style.setProperty('--signal-y', '0px');
    heroVisual.style.setProperty('--quality-x', '0px');
    heroVisual.style.setProperty('--quality-y', '0px');
  });
}

const motionTargets = document.querySelectorAll('.pillar, .experience-card, .project-card, .credential-card, .skill-group, .cv-primary, .cv-variants a, .evidence-item, .recommendation-card, .quality-list > div, .module-card');
motionTargets.forEach((target, index) => {
  target.classList.add('motion-card');
  if (target.classList.contains('reveal')) target.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
  const press = () => target.classList.add('is-pressed');
  const release = () => target.classList.remove('is-pressed');
  target.addEventListener('pointerdown', press);
  target.addEventListener('pointerup', release);
  target.addEventListener('pointercancel', release);
  target.addEventListener('pointerleave', release);
});

document.querySelectorAll('.button').forEach(button => button.classList.add('magnetic'));

if (canAnimateDepth) {
  motionTargets.forEach(target => {
    target.addEventListener('pointermove', event => {
      const bounds = target.getBoundingClientRect();
      const px = (event.clientX - bounds.left) / bounds.width - 0.5;
      const py = (event.clientY - bounds.top) / bounds.height - 0.5;
      target.style.setProperty('--rx', `${py * -3.2}deg`);
      target.style.setProperty('--ry', `${px * 3.2}deg`);
    });
    target.addEventListener('pointerleave', () => {
      target.style.setProperty('--rx', '0deg');
      target.style.setProperty('--ry', '0deg');
    });
  });

  document.querySelectorAll('.magnetic').forEach(button => {
    button.addEventListener('pointermove', event => {
      const bounds = button.getBoundingClientRect();
      button.style.setProperty('--mag-x', `${(event.clientX - bounds.left - bounds.width / 2) * 0.08}px`);
      button.style.setProperty('--mag-y', `${(event.clientY - bounds.top - bounds.height / 2) * 0.08}px`);
    });
    button.addEventListener('pointerleave', () => {
      button.style.setProperty('--mag-x', '0px');
      button.style.setProperty('--mag-y', '0px');
    });
  });
}

document.querySelectorAll('main > .section').forEach((section, index, sections) => {
  if (index === sections.length - 1) return;
  const flow = document.createElement('div');
  flow.className = 'section-flow';
  flow.setAttribute('aria-hidden', 'true');
  flow.innerHTML = '<svg viewBox="0 0 420 38"><path d="M0 20h145l10-10 12 22 15-30 18 18h42l8-8 9 8h161"/></svg>';
  section.after(flow);
});
