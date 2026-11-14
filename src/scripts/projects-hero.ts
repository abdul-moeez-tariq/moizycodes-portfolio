
const initProjectsHero = () => {
    const section = document.querySelector<HTMLElement>(".projects-hero");

    if (!section || section.dataset.initialized === "true") return;

    section.dataset.initialized = "true";

    const elements = Array.from(
        section.querySelectorAll<HTMLElement>("[data-projects-reveal]")
    );

    if (!elements.length) return;

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) return;

    const animations = new Map<HTMLElement, Animation>();
    const visibility = new Map<HTMLElement, boolean>();

    // Set initial hidden state
    elements.forEach((element) => {
        element.style.opacity = "0";
        element.style.transform = "translate3d(0, 30px, 0)";
        element.style.filter = "blur(6px)";
    });

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target as HTMLElement;
                const isVisible = entry.isIntersecting;

                if (visibility.get(element) === isVisible) return;

                visibility.set(element, isVisible);

                // Stop previous animation
                animations.get(element)?.cancel();

                const animation = element.animate(
                    isVisible
                        ? [
                            {
                                opacity: 0,
                                transform: "translate3d(0, 30px, 0)",
                                filter: "blur(6px)",
                            },
                            {
                                opacity: 1,
                                transform: "translate3d(0, 0, 0)",
                                filter: "blur(0px)",
                            },
                        ]
                        : [
                            {
                                opacity: 1,
                                transform: "translate3d(0, 0, 0)",
                                filter: "blur(0px)",
                            },
                            {
                                opacity: 0,
                                transform: "translate3d(0, -20px, 0)",
                                filter: "blur(6px)",
                            },
                        ],
                    {
                        duration: isVisible ? 800 : 450,
                        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                        fill: "forwards",
                    }
                );

                animations.set(element, animation);
            });
        },
        {
            threshold: 0.1,
            rootMargin: "-5% 0px -5% 0px",
        }
    );

    elements.forEach((element) => observer.observe(element));

    // Cleanup when Astro navigates to another page
    document.addEventListener(
        "astro:before-swap",
        () => {
            observer.disconnect();

            animations.forEach((animation) => animation.cancel());
            animations.clear();

            elements.forEach((element) => {
                element.style.opacity = "";
                element.style.transform = "";
                element.style.filter = "";
            });

            section.dataset.initialized = "false";
        },
        { once: true }
    );
};

document.addEventListener("astro:page-load", initProjectsHero);
