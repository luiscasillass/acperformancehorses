const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-navigation');

const closeMenu = () => {
    if (!menuButton || !navigation || !header) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
    navigation.classList.remove('is-open');
    header.classList.remove('menu-active');
    document.body.classList.remove('menu-open');
};

if (menuButton && navigation && header) {
    menuButton.addEventListener('click', () => {
        const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
        menuButton.setAttribute('aria-expanded', String(!isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
        navigation.classList.toggle('is-open', !isOpen);
        header.classList.toggle('menu-active', !isOpen);
        document.body.classList.toggle('menu-open', !isOpen);
    });

    navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1020) closeMenu(); });
    window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 24), { passive: true });
}

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -36px' });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
document.querySelectorAll('[data-year]').forEach((element) => { element.textContent = new Date().getFullYear(); });

const waitlistForm = document.querySelector('[data-waitlist-form]');
if (waitlistForm) {
    waitlistForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const status = waitlistForm.querySelector('[data-form-status]');
        if (!waitlistForm.reportValidity()) return;
        status.hidden = false;
        status.focus();
    });
}
