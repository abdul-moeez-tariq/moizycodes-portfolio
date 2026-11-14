
const initServicesOverview = () => {
    const section = document.querySelector<HTMLElement>("#services-overview");

    if (!section || section.dataset.animationInitialized === "true") return;

    section.dataset.animationInitialized = "true";

    const elements = Array.from(
        section.querySelectorAll<HTMLElement>("[data-service-reveal]")
    );

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
        elements.forEach((element) => {
            element.style.opacity = "1";
            element.style.transform = "none";
            element.style.filter = "none";
        });
        return;
    }

    const animations = new Map<HTMLElement, Animation>();
    const visibility = new Map<HTMLElement, boolean>();

    const hidden = {
        opacity: "0",
        transform: "translate3d(0, 24px, 0)",
        filter: "blur(3px)",
    };

    const visible = {
        opacity: "1",
        transform: "translate3d(0, 0, 0)",
        filter: "blur(0px)",
    };

    elements.forEach((element) => {
        Object.assign(element.style, hidden);
        visibility.set(element, false);
    });

    const animateElement = (
        element: HTMLElement,
        show: boolean,
        index: number
    ) => {
        const previous = animations.get(element);

        // Capture the current rendered state before replacing animation.
        const computed = getComputedStyle(element);

        const current = {
            opacity: computed.opacity,
            transform: computed.transform,
            filter: computed.filter,
        };

        previous?.cancel();
        animations.delete(element);

        Object.assign(element.style, current);

        const target = show ? visible : hidden;

        const animation = element.animate(
            [current, target],
            {
                duration: show ? 700 : 450,
                delay: show ? Math.min(index * 45, 160) : 0,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "forwards",
            }
        );

        animations.set(element, animation);

        animation.onfinish = () => {
            if (animations.get(element) !== animation) return;

            Object.assign(element.style, target);

            animation.cancel();
            animations.delete(element);
        };
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target as HTMLElement;
                const show = entry.isIntersecting;

                if (visibility.get(element) === show) return;

                visibility.set(element, show);

                animateElement(
                    element,
                    show,
                    elements.indexOf(element)
                );
            });
        },
        {
            threshold: 0.05,
            rootMargin: "0px",
        }
    );

    elements.forEach((element) => observer.observe(element));

    const cleanup = () => {
        observer.disconnect();

        animations.forEach((animation) => animation.cancel());
        animations.clear();

        delete section.dataset.animationInitialized;

        document.removeEventListener("astro:before-swap", cleanup);
    };

    document.addEventListener("astro:before-swap", cleanup);
};

document.addEventListener("astro:page-load", initServicesOverview);

initServicesOverview();
