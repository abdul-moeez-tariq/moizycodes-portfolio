
const initServicesHero = () => {
    const section = document.querySelector<HTMLElement>(".services-hero");

    if (!section || section.dataset.animationInitialized === "true") return;

    section.dataset.animationInitialized = "true";

    const elements = Array.from(
        section.querySelectorAll<HTMLElement>("[data-hero-reveal]")
    );

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        elements.forEach((element) => {
            element.style.opacity = "1";
            element.style.transform = "none";
            element.style.filter = "none";
        });

        return;
    }

    let animations: Animation[] = [];

    const hideElements = () => {
        animations.forEach((animation) => animation.cancel());
        animations = [];

        elements.forEach((element) => {
            element.style.opacity = "0";
            element.style.transform = "translate3d(0, 32px, 0)";
            element.style.filter = "blur(5px)";
        });
    };

    const showElements = () => {
        animations.forEach((animation) => animation.cancel());
        animations = [];

        elements.forEach((element, index) => {
            const animation = element.animate(
                [
                    {
                        opacity: 0,
                        transform: "translate3d(0, 32px, 0)",
                        filter: "blur(5px)",
                    },
                    {
                        opacity: 1,
                        transform: "translate3d(0, 0, 0)",
                        filter: "blur(0px)",
                    },
                ],
                {
                    duration: 850,
                    delay: index * 70,
                    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                    fill: "both",
                }
            );

            animations.push(animation);
        });
    };

    hideElements();

    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                showElements();
            } else {
                hideElements();
            }
        },
        {
            threshold: 0.05,
            rootMargin: "-5% 0px -5% 0px",
        }
    );

    observer.observe(section);

    const cleanup = () => {
        observer.disconnect();
        animations.forEach((animation) => animation.cancel());

        delete section.dataset.animationInitialized;

        document.removeEventListener("astro:before-swap", cleanup);
    };

    document.addEventListener("astro:before-swap", cleanup);
};

document.addEventListener("astro:page-load", initServicesHero);

initServicesHero();
