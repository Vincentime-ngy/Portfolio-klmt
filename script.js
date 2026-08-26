/* =========================================================
   CADRILLAGE EN PARALLAXE (suit la souris dans le hero)
========================================================= */

const heroSection = document.querySelector('.hero');
const heroGrid = document.querySelector('.hero-grid');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (heroSection && heroGrid && !prefersReducedMotion) {
    const intensity = 24; // amplitude max du déplacement, en pixels

    heroSection.addEventListener('mousemove', (event) => {
        const rect = heroSection.getBoundingClientRect();
        const relX = (event.clientX - rect.left) / rect.width - 0.5;  // -0.5 à 0.5
        const relY = (event.clientY - rect.top) / rect.height - 0.5;

        const moveX = relX * intensity;
        const moveY = relY * intensity;

        heroGrid.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });

    heroSection.addEventListener('mouseleave', () => {
        heroGrid.style.transform = 'translate(0, 0)';
    });
}

/* =========================================================
   EXPLOSION DE CUBES — au chargement + rejouable au clic sur le logo
========================================================= */

const heroLogoButton = document.getElementById('heroLogoButton');
const heroLogo = document.getElementById('heroLogo');
const cubeBurst = document.getElementById('cubeBurst');

function playCubeBurst() {
    if (!cubeBurst) return;

    // on retire puis réapplique la classe pour forcer le rejeu de l'animation CSS
    cubeBurst.classList.remove('is-bursting');
    // eslint-disable-next-line no-unused-expressions
    void cubeBurst.offsetWidth; // force le reflow
    cubeBurst.classList.add('is-bursting');

    if (heroLogo) {
        heroLogo.classList.remove('is-clicked');
        void heroLogo.offsetWidth;
        heroLogo.classList.add('is-clicked');
    }
}

if (heroLogoButton) {
    // Explosion automatique au chargement de la page
    window.addEventListener('load', () => {
        setTimeout(playCubeBurst, 450);
    });

    // Rejoue l'explosion à chaque clic sur le logo, puis scroll vers Showtime
    heroLogoButton.addEventListener('click', () => {
        playCubeBurst();
        document.querySelector('#showtime')?.scrollIntoView({ behavior: 'smooth' });
    });
}

/* =========================================================
   TILT 3D — photo de profil suit légèrement la souris
========================================================= */

const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const aboutPhoto = document.querySelector('.about-photo');
const aboutPhotoImg = document.querySelector('.about-photo img');

if (aboutPhoto && aboutPhotoImg && supportsHover && !prefersReducedMotion) {
    const maxTilt = 12; // degrés

    aboutPhoto.addEventListener('mousemove', (event) => {
        const rect = aboutPhoto.getBoundingClientRect();
        const relX = (event.clientX - rect.left) / rect.width - 0.5;
        const relY = (event.clientY - rect.top) / rect.height - 0.5;

        const rotateY = relX * maxTilt;
        const rotateX = -relY * maxTilt;

        aboutPhotoImg.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });

    aboutPhoto.addEventListener('mouseleave', () => {
        aboutPhotoImg.style.transform = 'rotateX(0) rotateY(0) scale(1)';
    });
}

/* =========================================================
   ANIMATION DE TEXTE — apparition mot par mot, rejouable au scroll
========================================================= */

// Découpe le texte d'un élément en <span class="split-word"> individuels,
// en conservant les balises internes (<strong>, etc.) intactes.
function splitIntoWords(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
        if (node.textContent.trim().length > 0) {
            textNodes.push(node);
        }
    }

    textNodes.forEach((textNode) => {
        const words = textNode.textContent.split(/(\s+)/); // garde les espaces
        const fragment = document.createDocumentFragment();

        words.forEach((word) => {
            if (word.trim().length === 0) {
                fragment.appendChild(document.createTextNode(word));
            } else {
                const span = document.createElement('span');
                span.className = 'split-word';
                span.textContent = word;
                fragment.appendChild(span);
            }
        });

        textNode.parentNode.replaceChild(fragment, textNode);
    });
}

const textAnimTargets = document.querySelectorAll('[data-text-anim]');

textAnimTargets.forEach((el) => {
    splitIntoWords(el);

    // décalage progressif fixé une seule fois par mot (pas besoin de le
    // recalculer à chaque passage, l'ordre des mots ne change jamais)
    const words = el.querySelectorAll('.split-word');
    words.forEach((word, i) => {
        word.style.transitionDelay = `${i * 28}ms`;
    });
});

// Pas de unobserve() ici : on veut que la classe s'ajoute ET se retire
// à chaque passage dans le viewport, pour que l'animation se rejoue
// aussi bien en descendant qu'en remontant.
const textAnimObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        entry.target.classList.toggle('text-anim-in', entry.isIntersecting);
    });
}, {
    threshold: 0.35,
    rootMargin: '0px 0px -8% 0px'
});

textAnimTargets.forEach((el) => textAnimObserver.observe(el));

/* =========================================================
   ANIMATIONS AU SCROLL — apparition douce des blocs .reveal,
   rejouable à chaque passage dans le viewport
========================================================= */

const revealItems = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
}, {
    threshold: 0.12,
    rootMargin: '0px 0px -10% 0px'
});

revealItems.forEach((item) => revealObserver.observe(item));

/* Variante "une seule fois" : une fois affiché, l'élément reste visible même
   s'il ressort du viewport (utile pour les cassettes du portfolio, où un
   clignotement pendant l'interaction serait gênant). */
const revealOnceItems = document.querySelectorAll('.reveal-once');

const revealOnceObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealOnceObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.12,
    rootMargin: '0px 0px -10% 0px'
});

revealOnceItems.forEach((item) => revealOnceObserver.observe(item));

/* Filet de sécurité : si un élément .reveal-once est déjà dans le viewport
   au chargement (arrivée directe sur une ancre) mais que l'observer n'a pas
   encore eu l'occasion de le détecter, on force son affichage. */
window.addEventListener('load', () => {
    setTimeout(() => {
        revealOnceItems.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
            if (isInViewport) {
                item.classList.add('is-visible');
            }
        });
    }, 300);
});

/* =========================================================
   POPUP VIDEO / COMPARAISON (LIGHTBOX) — clic sur une cassette
========================================================= */

const lightbox = document.getElementById('lightbox');
const lightboxVideo = document.getElementById('lightbox-video');
const lightboxVideoWrap = document.getElementById('lightbox-video-wrap');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxDescription = document.getElementById('lightbox-description');
const vhsButtons = document.querySelectorAll('.vhs-portfolio');

// Éléments du slider avant/après
const compareWrap = document.getElementById('lightbox-compare-wrap');
const compareEl = document.getElementById('lightbox-compare');
const compareBefore = document.getElementById('compare-before');
const compareBeforeWrap = document.getElementById('compare-before-wrap');
const compareAfter = document.getElementById('compare-after');
const compareHandle = document.getElementById('compare-handle');

let lastFocusedElement = null;

function setComparePosition(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    compareBeforeWrap.style.width = `${clamped}%`;
    compareHandle.style.left = `${clamped}%`;
}

function getContainRect(frame, naturalW, naturalH) {
    const frameRatio = frame.width / frame.height;
    const imgRatio = naturalW / naturalH;

    if (imgRatio > frameRatio) {
        // image plus large que le cadre : bandes en haut/bas
        const renderW = frame.width;
        const renderH = frame.width / imgRatio;
        return { renderW, renderH, offsetX: 0, offsetY: (frame.height - renderH) / 2 };
    }

    // image plus haute (ou égale) que le cadre : bandes à gauche/droite
    const renderH = frame.height;
    const renderW = frame.height * imgRatio;
    return { renderW, renderH, offsetX: (frame.width - renderW) / 2, offsetY: 0 };
}

function syncCompareImageWidth() {
    // Chaque image (avant / après) garde son propre ratio "contain" dans le
    // cadre commun, calculée indépendamment — l'une ne déforme jamais l'autre.
    const frame = compareEl.getBoundingClientRect();

    if (compareAfter.naturalWidth && compareAfter.naturalHeight) {
        const r = getContainRect(frame, compareAfter.naturalWidth, compareAfter.naturalHeight);
        compareAfter.style.width = `${r.renderW}px`;
        compareAfter.style.height = `${r.renderH}px`;
        compareAfter.style.left = `${r.offsetX}px`;
        compareAfter.style.top = `${r.offsetY}px`;
    }

    if (compareBefore.naturalWidth && compareBefore.naturalHeight) {
        const r = getContainRect(frame, compareBefore.naturalWidth, compareBefore.naturalHeight);
        compareBefore.style.width = `${r.renderW}px`;
        compareBefore.style.height = `${r.renderH}px`;
        compareBefore.style.left = `${r.offsetX}px`;
        compareBefore.style.top = `${r.offsetY}px`;
    }
}

function initCompareDrag() {
    let isDragging = false;

    const moveTo = (clientX) => {
        const rect = compareEl.getBoundingClientRect();
        const percent = ((clientX - rect.left) / rect.width) * 100;
        setComparePosition(percent);
    };

    compareEl.addEventListener('mousedown', (e) => {
        isDragging = true;
        moveTo(e.clientX);
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging) moveTo(e.clientX);
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    compareEl.addEventListener('touchstart', (e) => {
        isDragging = true;
        moveTo(e.touches[0].clientX);
    }, { passive: true });

    compareEl.addEventListener('touchmove', (e) => {
        if (isDragging) moveTo(e.touches[0].clientX);
    }, { passive: true });

    compareEl.addEventListener('touchend', () => {
        isDragging = false;
    });

    window.addEventListener('resize', () => {
        if (compareWrap.classList.contains('is-active')) {
            syncCompareImageWidth();
        }
    });
}

initCompareDrag();

function openVideoLightbox(videoSrc, titre, description, orientation) {
    lightboxVideoWrap.style.display = 'flex';
    compareWrap.classList.remove('is-active');

    lightboxVideo.src = videoSrc;

    lightbox.classList.remove('orientation-landscape', 'orientation-square', 'orientation-portrait');
    if (orientation) {
        lightbox.classList.add(`orientation-${orientation}`);
    }

    lightboxVideo.play().catch(() => {
        /* lecture automatique bloquée par le navigateur : l'utilisateur lancera manuellement */
    });

    openLightboxShell(titre, description);
}

function openCompareLightbox(beforeSrc, afterSrc, titre, description) {
    lightboxVideoWrap.style.display = 'none';
    lightbox.classList.remove('orientation-landscape', 'orientation-square', 'orientation-portrait');

    compareBefore.src = beforeSrc;
    compareAfter.src = afterSrc;
    compareWrap.classList.add('is-active');
    setComparePosition(50);

    // La synchronisation a besoin des dimensions naturelles des deux images
    // (naturalWidth/naturalHeight) : on attend leur chargement réel, avec un
    // filet de sécurité si elles sont déjà en cache (donc "complete").
    const runSync = () => requestAnimationFrame(syncCompareImageWidth);
    let afterReady = compareAfter.complete && !!compareAfter.naturalWidth;
    let beforeReady = compareBefore.complete && !!compareBefore.naturalWidth;

    const checkBothReady = () => {
        if (afterReady && beforeReady) runSync();
    };

    if (afterReady) {
        checkBothReady();
    } else {
        compareAfter.addEventListener('load', () => {
            afterReady = true;
            checkBothReady();
        }, { once: true });
    }

    if (beforeReady) {
        checkBothReady();
    } else {
        compareBefore.addEventListener('load', () => {
            beforeReady = true;
            checkBothReady();
        }, { once: true });
    }

    openLightboxShell(titre, description);
}

function openLightboxShell(titre, description) {
    lastFocusedElement = document.activeElement;

    lightboxTitle.textContent = titre || '';
    lightboxDescription.innerHTML = description || '';

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    lightbox.querySelector('.lightbox-close').focus();
}

function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    lightboxVideo.load();

    compareWrap.classList.remove('is-active');
    compareBefore.removeAttribute('src');
    compareAfter.removeAttribute('src');

    lightboxDescription.innerHTML = '';

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

vhsButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const titre = button.dataset.titre;
        const description = button.dataset.description;

        if (button.dataset.comparison === 'true') {
            openCompareLightbox(button.dataset.before, button.dataset.after, titre, description);
        } else {
            const videoSrc = button.dataset.video;
            const orientation = button.dataset.orientation;
            openVideoLightbox(videoSrc, titre, description, orientation);
        }
    });
});

lightbox.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', closeLightbox);
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
    }
});
