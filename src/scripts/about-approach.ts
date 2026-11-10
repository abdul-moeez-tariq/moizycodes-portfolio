
type ApproachAnimationState = {
    animation: Animation;
    visible: boolean;
    timer: number | null;
};

let approachObserver: IntersectionObserver | null = null;
let approachStates = new Map<HTMLElement, ApproachAnimationState>();

function cleanupApproach(): void {
    approachObserver?.disconnect();
    approachObserver = null;

    approachStates.forEach(({ animation, timer }) => {
        if (timer !== null) window.clearTimeout(timer);
        animation.cancel();
    });

    approachStates.clear();
}

function showElement(element: HTMLElement, index: number): void {
    const state = approachStates.get(element);

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
    }, Math.min(index * 130, 390));
}

function hideElement(element: HTMLElement): void {
    const state = approachStates.get(element);

    if (!state || !state.visible) return;

    state.visible = false;

    if (state.timer !== null) {
        window.clearTimeout(state.timer);
        state.timer = null;
        return;
    }

    if (Number(state.animation.currentTime ?? 0) <= 0) return;

    state.animation.playbackRate = -1;
    state.animation.play();
}

function initAboutApproach(): void {
    cleanupApproach();

    const section = document.querySelector<HTMLElement>("#about-approach");

    if (!section) return;

    const elements = Array.from(
        section.querySelectorAll<HTMLElement>(".approach-reveal"),
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
        const isCard = element.classList.contains("approach-card");

        const animation = element.animate(
            [
                {
                    opacity: 0,
                    transform: isCard
                        ? "translate3d(0, 42px, 0) scale(0.975)"
                        : "translate3d(0, 28px, 0)",
                },
                {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0) scale(1)",
                },
            ],
            {
                duration: isCard ? 1250 : 1050,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
            },
        );

        animation.pause();
        animation.currentTime = 0;

        approachStates.set(element, {
            animation,
            visible: false,
            timer: null,
        });
    });

    approachObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target as HTMLElement;
                const index = elements.indexOf(element);

                if (entry.isIntersecting) {
                    showElement(element, index);
                } else {
                    hideElement(element);
                }
            });
        },
        {
            threshold: 0.05,
            rootMargin: "0px 0px -7% 0px",
        },
    );

    elements.forEach((element) => {
        approachObserver?.observe(element);
    });
}

document.removeEventListener("astro:page-load", initAboutApproach);
document.removeEventListener("astro:before-swap", cleanupApproach);

document.addEventListener("astro:page-load", initAboutApproach);
document.addEventListener("astro:before-swap", cleanupApproach);

initAboutApproach();
