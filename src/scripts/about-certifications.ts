
type CertificationAnimationState = {
    animation: Animation;
    visible: boolean;
    timer: number | null;
};

let certificationObserver: IntersectionObserver | null = null;

const certificationStates = new Map<
    HTMLElement,
    CertificationAnimationState
>();

const cleanupCertifications = (): void => {
    certificationObserver?.disconnect();
    certificationObserver = null;

    certificationStates.forEach(({ animation, timer }) => {
        if (timer !== null) {
            window.clearTimeout(timer);
        }

        animation.cancel();
    });

    certificationStates.clear();
};

const showCertification = (
    element: HTMLElement,
    index: number,
): void => {
    const state = certificationStates.get(element);

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
    }, Math.min(index * 120, 480));
};

const hideCertification = (element: HTMLElement): void => {
    const state = certificationStates.get(element);

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

const initAboutCertifications = (): void => {
    cleanupCertifications();

    const section = document.querySelector<HTMLElement>(
        "#about-certifications",
    );

    if (!section) return;

    const elements = Array.from(
        section.querySelectorAll<HTMLElement>(
            "[data-certification-reveal]",
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
                    transform: "translate3d(0, 34px, 0)",
                    filter: "blur(5px)",
                },
                {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0)",
                    filter: "blur(0px)",
                },
            ],
            {
                duration: 1100,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
            },
        );

        animation.pause();
        animation.currentTime = 0;

        certificationStates.set(element, {
            animation,
            visible: false,
            timer: null,
        });
    });

    certificationObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target as HTMLElement;
                const index = elements.indexOf(element);

                if (entry.isIntersecting) {
                    showCertification(element, index);
                } else {
                    hideCertification(element);
                }
            });
        },
        {
            threshold: 0.01,
            rootMargin: "0px 0px -8% 0px",
        },
    );

    elements.forEach((element) => {
        certificationObserver?.observe(element);
    });
};

document.removeEventListener(
    "astro:page-load",
    initAboutCertifications,
);

document.removeEventListener(
    "astro:before-swap",
    cleanupCertifications,
);

document.addEventListener(
    "astro:page-load",
    initAboutCertifications,
);

document.addEventListener(
    "astro:before-swap",
    cleanupCertifications,
);

initAboutCertifications();
