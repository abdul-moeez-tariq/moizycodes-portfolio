
type BioAnimationState = {
    animation: Animation;
    visible: boolean;
};

let bioObserver: IntersectionObserver | null = null;

let bioAnimations = new Map<HTMLElement, BioAnimationState>();

let bioElements: HTMLElement[] = [];

const bioReducedMotion = (): boolean =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --------------------------------------------------
// Cleanup
// --------------------------------------------------

function cleanupBiography(): void {
    bioObserver?.disconnect();
    bioObserver = null;

    bioAnimations.forEach(({ animation }) => {
        animation.cancel();
    });

    bioAnimations.clear();
    bioElements = [];
}

// --------------------------------------------------
// Set animation direction
// --------------------------------------------------

function setBiographyVisibility(
    element: HTMLElement,
    visible: boolean,
): void {
    const state = bioAnimations.get(element);

    if (!state || state.visible === visible) return;

    state.visible = visible;

    const { animation } = state;

    // Reverse or continue the existing animation
    animation.playbackRate = visible ? 1 : -1;
    animation.play();
}

// --------------------------------------------------
// Create animations
// --------------------------------------------------

function prepareBiographyAnimations(): void {
    bioElements.forEach((element, index) => {
        const animation = element.animate(
            [
                {
                    opacity: 0,
                    transform: "translate3d(0, 30px, 0)",
                },
                {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0)",
                },
            ],
            {
                duration: 1100,
                delay: index * 90,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
            },
        );

        // Keep the element in its initial hidden state
        animation.pause();
        animation.currentTime = 0;

        bioAnimations.set(element, {
            animation,
            visible: false,
        });
    });
}

// --------------------------------------------------
// Initialize Biography
// --------------------------------------------------

function initBiography(): void {
    cleanupBiography();

    const section = document.querySelector<HTMLElement>("#biography");

    if (!section) return;

    bioElements = Array.from(
        section.querySelectorAll<HTMLElement>(".bio-reveal"),
    );

    if (!bioElements.length) return;

    // Reduced motion support
    if (bioReducedMotion()) {
        bioElements.forEach((element) => {
            element.style.opacity = "1";
            element.style.transform = "none";
        });

        return;
    }

    // Fallback for unsupported browsers
    if (
        !("IntersectionObserver" in window) ||
        !("animate" in Element.prototype)
    ) {
        bioElements.forEach((element) => {
            element.style.opacity = "1";
            element.style.transform = "none";
        });

        return;
    }

    prepareBiographyAnimations();

    bioObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target as HTMLElement;

                setBiographyVisibility(
                    element,
                    entry.isIntersecting,
                );
            });
        },
        {
            threshold: 0,
            rootMargin: "0px 0px -8% 0px",
        },
    );

    bioElements.forEach((element) => {
        bioObserver?.observe(element);
    });
}

// --------------------------------------------------
// Astro lifecycle
// --------------------------------------------------

document.addEventListener(
    "astro:page-load",
    initBiography,
);

document.addEventListener(
    "astro:before-swap",
    cleanupBiography,
);

initBiography();
