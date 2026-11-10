
type ExpertiseAnimationState = {
    animation: Animation;
    visible: boolean;
    timer: number | null;
};

let expertiseObserver: IntersectionObserver | null = null;
let expertiseStates = new Map<HTMLElement, ExpertiseAnimationState>();

function cleanupExpertise(): void {
    expertiseObserver?.disconnect();
    expertiseObserver = null;

    expertiseStates.forEach(({ animation, timer }) => {
        if (timer !== null) window.clearTimeout(timer);
        animation.cancel();
    });

    expertiseStates.clear();
}

function showExpertiseElement(element: HTMLElement, index: number): void {
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
    }, Math.min(index * 120, 360));
}

function hideExpertiseElement(element: HTMLElement): void {
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
}

function initAboutExpertise(): void {
    cleanupExpertise();

    const section = document.querySelector<HTMLElement>("#about-expertise");
    if (!section) return;

    const elements = Array.from(
        section.querySelectorAll<HTMLElement>(".expertise-reveal, .expertise-card"),
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
        const isCard = element.classList.contains("expertise-card");

        const animation = element.animate(
            [
                {
                    opacity: 0,
                    transform: isCard
                        ? "translate3d(0, 38px, 0) scale(0.985)"
                        : "translate3d(0, 28px, 0)",
                },
                {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0) scale(1)",
                },
            ],
            {
                duration: isCard ? 1200 : 1000,
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
}

document.removeEventListener("astro:page-load", initAboutExpertise);
document.removeEventListener("astro:before-swap", cleanupExpertise);

document.addEventListener("astro:page-load", initAboutExpertise);
document.addEventListener("astro:before-swap", cleanupExpertise);

initAboutExpertise();
