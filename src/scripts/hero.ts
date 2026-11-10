let heroAnimations: Animation[] = [];

let activeHero: HTMLElement | null = null;
let scrollFrame: number | null = null;

let originalStyles: {
    opacity: string;
    transform: string;
    willChange: string;
} | null = null;

function clearHeroAnimations(): void {
    heroAnimations.forEach((animation) => animation.cancel());
    heroAnimations = [];

    window.removeEventListener("scroll", handleHeroScroll);
    window.removeEventListener("resize", handleHeroScroll);

    if (scrollFrame !== null) {
        cancelAnimationFrame(scrollFrame);
        scrollFrame = null;
    }

    if (activeHero && originalStyles) {
        activeHero.style.opacity = originalStyles.opacity;
        activeHero.style.transform = originalStyles.transform;
        activeHero.style.willChange = originalStyles.willChange;
    }

    activeHero = null;
    originalStyles = null;
}

function handleHeroScroll(): void {
    if (scrollFrame !== null) return;

    scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;

        if (!activeHero) return;

        const heroTop = activeHero.getBoundingClientRect().top + window.scrollY;
        const scrollDistance = Math.max(activeHero.offsetHeight * 0.65, 1);

        const progress = Math.min(
            Math.max((window.scrollY - heroTop) / scrollDistance, 0),
            1,
        );

        const opacity = 1 - progress * 0.8;
        const offset = progress * -24;

        activeHero.style.opacity = String(opacity);
        activeHero.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
}

function initHeroAnimation(): void {
    clearHeroAnimations();

    const hero = document.querySelector<HTMLElement>(".hero");
    if (!hero) return;

    const lines = hero.querySelectorAll<HTMLElement>(".hero-line");
    const btn = hero.querySelector<HTMLElement>(".scroll-btn");
    const contact = hero.querySelector<HTMLElement>(".hero-contact");
    const desc = hero.querySelector<HTMLElement>(".hero-desc");

    const animatedElements = [
        ...lines,
        btn,
        contact,
        desc,
    ].filter((element): element is HTMLElement => element !== null);

    // Respect reduced motion preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        animatedElements.forEach((element) => {
            element.style.opacity = "1";
            element.style.transform = "none";
        });

        return;
    }

    // Entrance animation
    function animate(
        element: HTMLElement | null,
        delay: number,
        fromTransform?: string,
    ): void {
        if (!element) return;

        const animation = element.animate(
            [
                {
                    opacity: 0,
                    ...(fromTransform ? { transform: fromTransform } : {}),
                },
                {
                    opacity: 1,
                    ...(fromTransform ? { transform: "translateY(0)" } : {}),
                },
            ],
            {
                duration: 850,
                delay,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
            },
        );

        heroAnimations.push(animation);
    }

    animate(lines.item(0), 100, "translateY(2rem)");
    animate(lines.item(1), 220, "translateY(2rem)");
    animate(btn, 380);
    animate(contact, 500, "translateY(1rem)");
    animate(desc, 500, "translateY(1rem)");

    // Prepare scroll-linked animation
    activeHero = hero;

    originalStyles = {
        opacity: hero.style.opacity,
        transform: hero.style.transform,
        willChange: hero.style.willChange,
    };

    hero.style.willChange = "opacity, transform";

    window.addEventListener("scroll", handleHeroScroll, {
        passive: true,
    });

    window.addEventListener("resize", handleHeroScroll);

    handleHeroScroll();
}

// Astro lifecycle
document.addEventListener("astro:page-load", initHeroAnimation);
document.addEventListener("astro:before-swap", clearHeroAnimations);
