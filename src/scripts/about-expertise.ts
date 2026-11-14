
type ExpertiseAnimationState = {
    animation: Animation;
    visible: boolean;
    timer: number | null;
};

let expertiseObserver: IntersectionObserver | null = null;

const expertiseStates = new Map<HTMLElement, ExpertiseAnimationState>();

const cleanupExpertise = (): void => {
    expertiseObserver?.disconnect();
    expertiseObserver = null;

    expertiseStates.forEach(({ animation, timer }) => {
        if (timer !== null) {
            window.clearTimeout(timer);
        }

        animation.cancel();
    });

    expertiseStates.clear();
};

const showExpertiseElement = (
    element: HTMLElement,
    index: number,
): void => {
    const state = expertiseStates.get(element);

    if (!state || state.visible) return;

    state.visible = true;

    if (state.timer !== null) {
        window.clearTimeout(state.timer);
        state.timer = null;
    }

    const currentTime = Number(state.animation.currentTime ?? 0);

    if (currentTime > 0) {
        state.animation.playbackRate = 1;
        state.animation.play();
        return;
    }

    state.timer = window.setTimeout(() => {
        state.timer = null;

        if (!state.visible) return;

        state.animation.playbackRate = 1;
        state.animation.play();
    }, Math.min(index * 110, 440));
};

const hideExpertiseElement = (element: HTMLElement): void => {
    const state = expertiseStates.get(element);

    if (!state || !state.visible) return;

    state.visible = false;

    if (state.timer !== null) {
        window.clearTimeout(state.timer);
        state.timer = null;
        return;
    }

    const currentTime = Number(state.animation.currentTime ?? 0);

    if (currentTime <= 0) return;

    state.animation.playbackRate = -1;
    state.animation.play();
};

const initAboutExpertise = (): void => {
    cleanupExpertise();

    const section = document.querySelector<HTMLElement>("#about-expertise");

    if (!section) return;

    const elements = Array.from(
        section.querySelectorAll<HTMLElement>("[data-expertise-reveal]"),
    );

    if (!elements.length) return;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (
        reducedMotion ||
        !("animate" in Element.prototype) ||
        !("IntersectionObserver" in window)
    ) {
        return;
    }

    elements.forEach((element) => {
        const animation = element.animate(
            [
                {
                    opacity: 0,
                    transform: "translate3d(0, 38px, 0)",
                    filter: "blur(5px)",
                },
                {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0)",
                    filter: "blur(0px)",
                },
            ],
            {
                duration: 1150,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
            },
        );

        animation.pause();
        animation.currentTime = 0;

        expertiseStates.set(element, {
            animation,
            visible: false,
            timer: null,
        });
    });

    expertiseObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target as HTMLElement;
                const index = elements.indexOf(element);

                if (entry.isIntersecting) {
                    showExpertiseElement(element, index);
                } else {
                    hideExpertiseElement(element);
                }
            });
        },
        {
            threshold: 0.01,
            rootMargin: "0px 0px -8% 0px",
        },
    );

    elements.forEach((element) => {
        expertiseObserver?.observe(element);
    });
};

document.removeEventListener("astro:page-load", initAboutExpertise);
document.removeEventListener("astro:before-swap", cleanupExpertise);

document.addEventListener("astro:page-load", initAboutExpertise);
document.addEventListener("astro:before-swap", cleanupExpertise);

initAboutExpertise();
