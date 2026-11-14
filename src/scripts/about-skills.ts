
let skillsObserver: IntersectionObserver | null = null;

const skillsAnimations = new Map<HTMLElement, Animation>();

const cancelSkillsAnimation = (element: HTMLElement): void => {
    const animation = skillsAnimations.get(element);

    if (!animation) return;

    animation.cancel();
    skillsAnimations.delete(element);
};

const animateSkillsElement = (
    element: HTMLElement,
    visible: boolean,
    index = 0,
): void => {
    cancelSkillsAnimation(element);

    const animation = element.animate(
        visible
            ? [
                {
                    opacity: 0,
                    transform: "translate3d(0, 48px, 0)",
                    filter: "blur(7px)",
                },
                {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0)",
                    filter: "blur(0px)",
                },
            ]
            : [
                {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0)",
                    filter: "blur(0px)",
                },
                {
                    opacity: 0,
                    transform: "translate3d(0, 32px, 0)",
                    filter: "blur(5px)",
                },
            ],
        {
            duration: visible ? 1200 : 650,
            delay: visible ? Math.min(index * 90, 270) : 0,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "both",
        },
    );

    skillsAnimations.set(element, animation);

    animation.onfinish = () => {
        if (skillsAnimations.get(element) !== animation) return;

        skillsAnimations.delete(element);
    };
};

const animateSkillItems = (
    container: HTMLElement,
    visible: boolean,
): void => {
    const items = container.querySelectorAll<HTMLElement>("[data-skill-item]");

    items.forEach((item, index) => {
        animateSkillsElement(item, visible, index);
    });
};

const cleanupSkillsAnimation = (): void => {
    skillsObserver?.disconnect();
    skillsObserver = null;

    skillsAnimations.forEach((animation) => animation.cancel());
    skillsAnimations.clear();

    document
        .querySelectorAll<HTMLElement>(
            "[data-skills-reveal], [data-skill-item]",
        )
        .forEach((element) => {
            element.style.removeProperty("opacity");
            element.style.removeProperty("transform");
            element.style.removeProperty("filter");
        });
};

const initSkillsAnimation = (): void => {
    cleanupSkillsAnimation();

    const section = document.querySelector<HTMLElement>("#about-skills");

    if (!section) return;

    const revealElements = Array.from(
        section.querySelectorAll<HTMLElement>("[data-skills-reveal]"),
    );

    const skillItems = Array.from(
        section.querySelectorAll<HTMLElement>("[data-skill-item]"),
    );

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
        return;
    }

    // Set initial hidden state before observing.
    revealElements.forEach((element) => {
        element.style.opacity = "0";
        element.style.transform = "translate3d(0, 48px, 0)";
        element.style.filter = "blur(7px)";
    });

    skillItems.forEach((element) => {
        element.style.opacity = "0";
        element.style.transform = "translate3d(0, 14px, 0)";
    });

    skillsObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                const element = entry.target as HTMLElement;

                const index = revealElements.indexOf(element);
                const isVisible = entry.isIntersecting;

                animateSkillsElement(element, isVisible, index);

                animateSkillItems(element, isVisible);
            });
        },
        {
            threshold: 0.08,
            rootMargin: "0px 0px -35px 0px",
        },
    );

    revealElements.forEach((element) => {
        skillsObserver?.observe(element);
    });
};

document.addEventListener("astro:page-load", initSkillsAnimation);

document.addEventListener("astro:before-swap", cleanupSkillsAnimation);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSkillsAnimation, {
        once: true,
    });
} else {
    initSkillsAnimation();
}
