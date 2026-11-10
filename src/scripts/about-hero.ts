
let aboutHeroAnimations: Animation[] = [];
let aboutHeroRevealAnimations = new Map<HTMLElement, Animation>();
let aboutHeroObserver: IntersectionObserver | null = null;

let aboutHeroElement: HTMLElement | null = null;
let aboutHeroScrollFrame: number | null = null;

let aboutHeroOriginalStyles: {
    opacity: string;
    transform: string;
    willChange: string;
} | null = null;

let aboutHeroRevealElements: HTMLElement[] = [];

const aboutHeroPrefersReducedMotion = (): boolean =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --------------------------------------------------
// Cleanup
// --------------------------------------------------

function cleanupAboutHeroAnimation(): void {
    aboutHeroAnimations.forEach((animation) => animation.cancel());
    aboutHeroAnimations = [];

    aboutHeroRevealAnimations.forEach((animation) => animation.cancel());
    aboutHeroRevealAnimations.clear();

    aboutHeroObserver?.disconnect();
    aboutHeroObserver = null;

    window.removeEventListener("scroll", handleAboutHeroScroll);
    window.removeEventListener("resize", handleAboutHeroScroll);

    if (aboutHeroScrollFrame !== null) {
        cancelAnimationFrame(aboutHeroScrollFrame);
        aboutHeroScrollFrame = null;
    }

    // Reset reveal elements
    aboutHeroRevealElements.forEach((element) => {
        element.style.opacity = "";
        element.style.transform = "";
        element.style.filter = "";
    });

    aboutHeroRevealElements = [];

    // Restore original hero styles
    if (aboutHeroElement && aboutHeroOriginalStyles) {
        aboutHeroElement.style.opacity = aboutHeroOriginalStyles.opacity;
        aboutHeroElement.style.transform = aboutHeroOriginalStyles.transform;
        aboutHeroElement.style.willChange = aboutHeroOriginalStyles.willChange;
    }

    aboutHeroElement = null;
    aboutHeroOriginalStyles = null;
}

// --------------------------------------------------
// Scroll-linked hero animation
// --------------------------------------------------

function handleAboutHeroScroll(): void {
    if (aboutHeroScrollFrame !== null) return;

    aboutHeroScrollFrame = requestAnimationFrame(() => {
        aboutHeroScrollFrame = null;

        if (!aboutHeroElement) return;

        const heroTop =
            aboutHeroElement.getBoundingClientRect().top + window.scrollY;

        const scrollDistance = Math.max(
            aboutHeroElement.offsetHeight * 0.65,
            1,
        );

        const progress = Math.min(
            Math.max((window.scrollY - heroTop) / scrollDistance, 0),
            1,
        );

        const opacity = 1 - progress * 0.65;
        const offset = progress * -28;

        aboutHeroElement.style.opacity = String(opacity);
        aboutHeroElement.style.transform = `translate3d(0, ${offset}px, 0)`;
    });
}

// --------------------------------------------------
// Individual reveal animation
// --------------------------------------------------

function animateAboutHeroReveal(
    element: HTMLElement,
    delay: number,
    isSimpleReveal = false,
): void {
    // Prevent duplicate animations on the same element
    aboutHeroRevealAnimations.get(element)?.cancel();

    const animation = element.animate(
        isSimpleReveal
            ? [
                { opacity: 0 },
                { opacity: 1 },
            ]
            : [
                {
                    opacity: 0,
                    transform: "translate3d(0, 48px, 0)",
                    filter: "blur(3px)",
                },
                {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0)",
                    filter: "blur(0px)",
                },
            ],
        {
            duration: isSimpleReveal ? 750 : 1600,
            delay: isSimpleReveal ? 0 : delay,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "both",
        },
    );

    aboutHeroRevealAnimations.set(element, animation);
    aboutHeroAnimations.push(animation);
}

// --------------------------------------------------
// Initialize About Hero
// --------------------------------------------------

function initAboutHeroAnimation(): void {
    cleanupAboutHeroAnimation();

    const hero = document.querySelector<HTMLElement>("#about-hero");

    if (!hero) return;

    const portrait =
        hero.querySelector<HTMLElement>(".about-portrait");

    aboutHeroRevealElements = Array.from(
        hero.querySelectorAll<HTMLElement>(".about-reveal"),
    );

    if (aboutHeroPrefersReducedMotion()) {
        aboutHeroRevealElements.forEach((element) => {
            element.style.opacity = "1";
            element.style.transform = "none";
            element.style.filter = "none";
        });

        if (portrait) {
            portrait.style.opacity = "0.6";
            portrait.style.transform = "scale(1)";
        }

        return;
    }

    // Portrait entrance
    if (portrait) {
        const portraitAnimation = portrait.animate(
            [
                {
                    opacity: 0.25,
                    transform: "scale(1.1)",
                },
                {
                    opacity: 0.6,
                    transform: "scale(1)",
                },
            ],
            {
                duration: 2600,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
            },
        );

        aboutHeroAnimations.push(portraitAnimation);
    }

    // Observe each element separately
    if ("IntersectionObserver" in window) {
        aboutHeroObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const element = entry.target as HTMLElement;

                    if (entry.isIntersecting) {
                        const index = aboutHeroRevealElements.indexOf(element);
                        const isLastElement =
                            index === aboutHeroRevealElements.length - 1;

                        // Simple animation for My Approach / Discover my story
                        if (isLastElement) {
                            animateAboutHeroReveal(element, 0, true);
                        } else {
                            const delay = Math.max(index, 0) * 250;
                            animateAboutHeroReveal(element, delay);
                        }
                    } else {
                        aboutHeroRevealAnimations.get(element)?.cancel();
                        aboutHeroRevealAnimations.delete(element);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -10% 0px",
            },
        );

        aboutHeroRevealElements.forEach((element) => {
            aboutHeroObserver?.observe(element);
        });
    } else {
        aboutHeroRevealElements.forEach((element) => {
            element.style.opacity = "1";
            element.style.transform = "none";
            element.style.filter = "none";
        });
    }

    // Scroll-linked hero movement
    aboutHeroElement = hero;

    aboutHeroOriginalStyles = {
        opacity: hero.style.opacity,
        transform: hero.style.transform,
        willChange: hero.style.willChange,
    };

    hero.style.willChange = "opacity, transform";

    window.addEventListener("scroll", handleAboutHeroScroll, {
        passive: true,
    });

    window.addEventListener("resize", handleAboutHeroScroll);

    handleAboutHeroScroll();
}

// --------------------------------------------------
// Astro lifecycle
// --------------------------------------------------

document.addEventListener("astro:page-load", initAboutHeroAnimation);
document.addEventListener("astro:before-swap", cleanupAboutHeroAnimation);

initAboutHeroAnimation();
