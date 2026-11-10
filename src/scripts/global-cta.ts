
type CTAInstance = {
    observer: IntersectionObserver;
    animations: Animation[];
};

const instances: CTAInstance[] = [];

const cleanupGlobalCTA = (): void => {
    instances.forEach(({ observer, animations }) => {
        observer.disconnect();

        animations.forEach((animation) => {
            animation.cancel();
        });
    });

    instances.length = 0;
};

const createCTAAnimations = (
    section: HTMLElement,
): Animation[] => {
    const elements = Array.from(
        section.querySelectorAll<HTMLElement>(".global-cta-reveal"),
    );

    return elements.map((element, index) => {
        const isHeading = element.classList.contains("global-cta-heading");
        const isButton = element.classList.contains("global-cta-button");

        const animation = element.animate(
            [
                {
                    opacity: 0,
                    transform: isHeading
                        ? "translate3d(0, 65px, 0)"
                        : isButton
                            ? "translate3d(0, 18px, 0) scale(0.96)"
                            : "translate3d(0, 22px, 0)",
                },
                {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0) scale(1)",
                },
            ],
            {
                duration: isHeading ? 1200 : 950,
                delay: 100 + index * 110,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
            },
        );

        animation.pause();
        animation.currentTime = 0;

        return animation;
    });
};

const initGlobalCTA = (): void => {
    cleanupGlobalCTA();

    const sections = document.querySelectorAll<HTMLElement>(".global-cta");

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
        return;
    }

    sections.forEach((section) => {
        const animations = createCTAAnimations(section);
        let hasEntered = false;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting || hasEntered) return;

                hasEntered = true;

                animations.forEach((animation) => {
                    animation.play();
                });

                observer.disconnect();
            },
            {
                threshold: 0.15,
                rootMargin: "0px 0px -5% 0px",
            },
        );

        observer.observe(section);

        instances.push({
            observer,
            animations,
        });
    });
};

document.addEventListener("astro:page-load", initGlobalCTA);
document.addEventListener("astro:before-swap", cleanupGlobalCTA);

initGlobalCTA();
