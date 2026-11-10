
type JourneyAnimationState = {
    animation: Animation;
    visible: boolean;
    timer: number | null;
};

let journeyObserver: IntersectionObserver | null = null;
let journeyStates = new Map<HTMLElement, JourneyAnimationState>();

function cleanupJourney(): void {
    journeyObserver?.disconnect();
    journeyObserver = null;

    journeyStates.forEach(({ animation, timer }) => {
        if (timer !== null) window.clearTimeout(timer);
        animation.cancel();
    });

    journeyStates.clear();
}

function showJourneyElement(element: HTMLElement, index: number): void {
    const state = journeyStates.get(element);

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
    }, Math.min(index * 100, 350));
}

function hideJourneyElement(element: HTMLElement): void {
    const state = journeyStates.get(element);

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
}

function initJourney(): void {
    cleanupJourney();

    const section = document.querySelector<HTMLElement>("#journey");
    if (!section) return;

    const elements = Array.from(
        section.querySelectorAll<HTMLElement>(".journey-reveal"),
    );

    if (!elements.length) return;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || !("animate" in Element.prototype)) {
        elements.forEach((element) => {
            element.style.opacity = "1";
            element.style.transform = "none";
        });
        return;
    }

    elements.forEach((element) => {
        const animation = element.animate(
            [
                {
                    opacity: 0,
                    transform: "translate3d(0, 32px, 0)",
                },
                {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0)",
                },
            ],
            {
                duration: 1000,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
            },
        );

        animation.pause();
        animation.currentTime = 0;

        journeyStates.set(element, {
            animation,
            visible: false,
            timer: null,
        });
    });

    journeyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target as HTMLElement;
                const index = elements.indexOf(element);

                if (entry.isIntersecting) {
                    showJourneyElement(element, index);
                } else {
                    hideJourneyElement(element);
                }
            });
        },
        {
            threshold: 0.01,
            rootMargin: "0px 0px -8% 0px",
        },
    );

    elements.forEach((element) => {
        journeyObserver?.observe(element);
    });
}

document.removeEventListener("astro:page-load", initJourney);
document.removeEventListener("astro:before-swap", cleanupJourney);

document.addEventListener("astro:page-load", initJourney);
document.addEventListener("astro:before-swap", cleanupJourney);

initJourney();
