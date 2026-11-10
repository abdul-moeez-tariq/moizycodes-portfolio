
let aboutHeroObserver: IntersectionObserver | null = null;
let currentAboutHero: HTMLElement | null = null;

function initializeAboutHero(): void {
    aboutHeroObserver?.disconnect();
    aboutHeroObserver = null;

    const hero = document.querySelector<HTMLElement>("#about-hero");

    currentAboutHero = hero;

    if (!hero) return;

    const portrait = hero.querySelector<HTMLElement>(".about-portrait");
    const revealElements =
        hero.querySelectorAll<HTMLElement>(".about-reveal");

    portrait?.classList.remove("is-loaded");

    revealElements.forEach((element) => {
        element.classList.remove("is-visible");
    });

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
        portrait?.classList.add("is-loaded");

        revealElements.forEach((element) => {
            element.classList.add("is-visible");
        });

        return;
    }

    requestAnimationFrame(() => {
        if (currentAboutHero !== hero) return;

        portrait?.classList.add("is-loaded");
    });

    if (!("IntersectionObserver" in window)) {
        revealElements.forEach((element) => {
            element.classList.add("is-visible");
        });

        return;
    }

    aboutHeroObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target as HTMLElement;

                if (entry.isIntersecting) {
                    element.classList.add("is-visible");
                } else {
                    element.classList.remove("is-visible");
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: "-6% 0px -8% 0px",
        },
    );

    revealElements.forEach((element) => {
        aboutHeroObserver?.observe(element);
    });
}

document.addEventListener("astro:before-swap", () => {
    aboutHeroObserver?.disconnect();
    aboutHeroObserver = null;
    currentAboutHero = null;
});

document.addEventListener("astro:page-load", initializeAboutHero);

initializeAboutHero();
