
const initProjectsOverview = () => {
    const section = document.querySelector<HTMLElement>(
        ".projects-overview"
    );

    if (!section || section.dataset.initialized === "true") return;

    section.dataset.initialized = "true";

    const filters = Array.from(
        section.querySelectorAll<HTMLButtonElement>("[data-project-filter]")
    );

    const cards = Array.from(
        section.querySelectorAll<HTMLElement>("[data-project-card]")
    );

    const count = section.querySelector<HTMLElement>("#projects-count");
    const empty = section.querySelector<HTMLElement>("#projects-empty");

    if (!filters.length || !cards.length) return;

    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const animations = new Map<HTMLElement, Animation>();
    const visibility = new Map<HTMLElement, boolean>();

    let activeFilter = "ALL";
    let observer: IntersectionObserver | null = null;

    // Scroll reveal and hide
    const animateCard = (card: HTMLElement, show: boolean) => {
        animations.get(card)?.cancel();

        if (reduceMotion) {
            card.style.opacity = show ? "1" : "0";
            return;
        }

        const animation = card.animate(
            show
                ? [
                    {
                        opacity: 0,
                        transform: "translate3d(0, 35px, 0)",
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
                        transform: "translate3d(0, -20px, 0)",
                        filter: "blur(5px)",
                    },
                ],
            {
                duration: show ? 750 : 400,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "both",
            }
        );

        animations.set(card, animation);
    };

    const observeCard = (card: HTMLElement) => {
        if (reduceMotion) return;

        observer?.observe(card);
    };

    observer = reduceMotion
        ? null
        : new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const card = entry.target as HTMLElement;

                    if (card.hidden) return;

                    const isVisible = entry.isIntersecting;

                    if (visibility.get(card) === isVisible) return;

                    visibility.set(card, isVisible);
                    animateCard(card, isVisible);
                });
            },
            {
                threshold: 0.08,
                rootMargin: "-5% 0px -5% 0px",
            }
        );

    // 3D mouse movement
    const enableTilt = () => {
        if (reduceMotion) return;

        cards.forEach((card) => {
            const scene = card.querySelector<HTMLElement>(
                ".project-card-scene"
            );

            const inner = card.querySelector<HTMLElement>(
                ".project-card-inner"
            );

            if (!scene || !inner) return;

            const handleMove = (event: PointerEvent) => {
                if (event.pointerType !== "mouse") return;

                const rect = scene.getBoundingClientRect();

                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;

                const rotateY = (x - 0.5) * 10;
                const rotateX = (0.5 - y) * 8;

                inner.style.transition = "transform 100ms ease-out";
                inner.style.transform =
                    `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            };

            const resetTilt = () => {
                inner.style.transition =
                    "transform 600ms cubic-bezier(.2,.7,.2,1)";
                inner.style.transform = "rotateX(0deg) rotateY(0deg)";
            };

            scene.addEventListener("pointermove", handleMove);
            scene.addEventListener("pointerleave", resetTilt);
            scene.addEventListener("pointercancel", resetTilt);
        });
    };

    // Update filter buttons
    const updateActiveFilter = (selected: string) => {
        filters.forEach((button) => {
            const active = button.dataset.projectFilter === selected;

            button.setAttribute("aria-pressed", String(active));
            button.classList.toggle("is-active", active);
        });
    };

    // Filter projects
    const applyFilter = (selected: string) => {
        if (selected === activeFilter) return;

        activeFilter = selected;

        updateActiveFilter(selected);

        let visibleCount = 0;

        cards.forEach((card) => {
            const categories = (card.dataset.categories || "").split("|");

            const matches =
                selected === "ALL" || categories.includes(selected);

            animations.get(card)?.cancel();
            animations.delete(card);

            observer?.unobserve(card);
            visibility.delete(card);

            if (!matches) {
                card.hidden = true;
                card.style.opacity = "";
                card.style.transform = "";
                card.style.filter = "";
                return;
            }

            card.hidden = false;
            visibleCount++;

            if (reduceMotion) {
                card.style.opacity = "1";
                observeCard(card);
            } else {
                card.style.opacity = "0";
                card.style.transform = "translate3d(0, 35px, 0)";
                card.style.filter = "blur(7px)";

                requestAnimationFrame(() => {
                    if (!card.hidden) {
                        animateCard(card, true);
                    }
                });

                observeCard(card);
            }
        });

        if (count) {
            count.textContent =
                `${String(visibleCount).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
        }

        empty?.classList.toggle("hidden", visibleCount !== 0);
    };

    filters.forEach((button) => {
        button.addEventListener("click", () => {
            const selected = button.dataset.projectFilter;

            if (selected) applyFilter(selected);
        });
    });

    // Initial setup
    cards.forEach((card) => {
        if (!reduceMotion) {
            card.style.opacity = "0";
            card.style.transform = "translate3d(0, 35px, 0)";
            card.style.filter = "blur(7px)";
            observeCard(card);
        }
    });

    enableTilt();

    if (count) {
        count.textContent = `${String(cards.length).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
    }

    // Astro navigation cleanup
    document.addEventListener(
        "astro:before-swap",
        () => {
            observer?.disconnect();

            animations.forEach((animation) => animation.cancel());
            animations.clear();

            cards.forEach((card) => {
                card.style.opacity = "";
                card.style.transform = "";
                card.style.filter = "";
            });

            section.dataset.initialized = "false";
        },
        { once: true }
    );
};

document.addEventListener("astro:page-load", initProjectsOverview);
