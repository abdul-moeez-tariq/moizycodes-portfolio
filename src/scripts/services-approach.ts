
const initServicesApproach = () => {
    const sections = document.querySelectorAll<HTMLElement>(
        ".services-approach",
    );

    sections.forEach((section) => {
        if (section.dataset.approachInitialized === "true") return;
        section.dataset.approachInitialized = "true";

        const elements = Array.from(
            section.querySelectorAll<HTMLElement>("[data-approach-reveal]"),
        );

        if (!elements.length) return;

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;

        if (reducedMotion) return;

        // Initial hidden state
        elements.forEach((element) => {
            element.style.opacity = "0";
            element.style.transform = "translate3d(0, 32px, 0)";
            element.style.filter = "blur(4px)";
            element.style.willChange = "opacity, transform, filter";
        });

        let active = false;
        let animationFrame = 0;

        const reveal = () => {
            if (active) return;
            active = true;

            elements.forEach((element, index) => {
                const isCard = element.hasAttribute("data-approach-card");
                const cardIndex = Number(
                    element.style.getPropertyValue("--card-index") || 0,
                );

                const delay = isCard ? cardIndex * 100 : index * 65;

                element.animate(
                    [
                        {
                            opacity: 0,
                            transform: "translate3d(0, 32px, 0)",
                            filter: "blur(4px)",
                        },
                        {
                            opacity: 1,
                            transform: "translate3d(0, 0, 0)",
                            filter: "blur(0px)",
                        },
                    ],
                    {
                        duration: 750,
                        delay,
                        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                        fill: "forwards",
                    },
                );
            });
        };

        const reset = () => {
            if (!active) return;
            active = false;

            elements.forEach((element) => {
                element.getAnimations().forEach((animation) => animation.cancel());

                element.style.opacity = "0";
                element.style.transform = "translate3d(0, 32px, 0)";
                element.style.filter = "blur(4px)";
            });
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry) return;

                if (entry.isIntersecting) {
                    reveal();
                } else {
                    reset();
                }
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -8% 0px",
            },
        );

        observer.observe(section);

        window.addEventListener(
            "pagehide",
            () => {
                observer.disconnect();
                cancelAnimationFrame(animationFrame);
                elements.forEach((element) => {
                    element.getAnimations().forEach((animation) => animation.cancel());
                });
            },
            { once: true },
        );
    });
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initServicesApproach, {
        once: true,
    });
} else {
    initServicesApproach();
}
