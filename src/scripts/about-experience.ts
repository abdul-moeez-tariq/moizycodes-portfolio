
type ExperienceAnimationState = {
    animation: Animation;
    visible: boolean;
    timer: number | null;
};

let experienceObserver: IntersectionObserver | null = null;

const experienceStates = new Map<
    HTMLElement,
    ExperienceAnimationState
>();

const cleanupExperience = (): void => {
    experienceObserver?.disconnect();
    experienceObserver = null;

    experienceStates.forEach(({ animation, timer }) => {
        if (timer !== null) {
            window.clearTimeout(timer);
        }

        animation.cancel();
    });

    experienceStates.clear();
};

const showExperienceElement = (
    element: HTMLElement,
    index: number,
): void => {
    const state = experienceStates.get(element);

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

const hideExperienceElement = (
    element: HTMLElement,
): void => {
    const state = experienceStates.get(element);

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

const initAboutExperience = (): void => {
    cleanupExperience();

    const section = document.querySelector<HTMLElement>(
        "#about-experience",
    );

    if (!section) return;

    const elements = Array.from(
        section.querySelectorAll<HTMLElement>(
            "[data-experience-reveal]",
        ),
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

        experienceStates.set(element, {
            animation,
            visible: false,
            timer: null,
        });
    });

    experienceObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target as HTMLElement;
                const index = elements.indexOf(element);

                if (entry.isIntersecting) {
                    showExperienceElement(element, index);
                } else {
                    hideExperienceElement(element);
                }
            });
        },
        {
            threshold: 0.01,
            rootMargin: "0px 0px -8% 0px",
        },
    );

    elements.forEach((element) => {
        experienceObserver?.observe(element);
    });
};

document.removeEventListener(
    "astro:page-load",
    initAboutExperience,
);

document.removeEventListener(
    "astro:before-swap",
    cleanupExperience,
);

document.addEventListener(
    "astro:page-load",
    initAboutExperience,
);

document.addEventListener(
    "astro:before-swap",
    cleanupExperience,
);

initAboutExperience();
