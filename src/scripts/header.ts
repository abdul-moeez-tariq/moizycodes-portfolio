// src/scripts/header.ts

type NavLink = HTMLAnchorElement;

type HeaderWindow = Window & {
  __portfolioHeaderController?: AbortController;
};

let menuOpen = false;
let discoverOpen = false;

let sectionObserver: IntersectionObserver | null = null;

const observedSections = new Map<HTMLElement, IntersectionObserverEntry>();

const headerWindow = window as HeaderWindow;

// --------------------------------------------------
// DOM helpers
// --------------------------------------------------

const getElement = <T extends HTMLElement>(selector: string): T | null =>
  document.querySelector<T>(selector);

const normalizePath = (path: string): string => {
  return path.replace(/\/+$/, "") || "/";
};

const getLinkUrl = (link: NavLink): URL | null => {
  const href = link.getAttribute("href");

  if (!href) return null;

  try {
    return new URL(href, window.location.href);
  } catch {
    return null;
  }
};

const isSameDestination = (linkUrl: URL, currentUrl: URL): boolean => {
  return (
    linkUrl.origin === currentUrl.origin &&
    normalizePath(linkUrl.pathname) ===
    normalizePath(currentUrl.pathname) &&
    linkUrl.hash === currentUrl.hash
  );
};

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => {
    return (
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.getClientRects().length > 0
    );
  });
};

// --------------------------------------------------
// Active navigation
// --------------------------------------------------

function applyActiveLink(link: NavLink, active: boolean): void {
  link.classList.toggle("active", active);

  if (active) {
    link.setAttribute(
      "aria-current",
      link.hash ? "location" : "page",
    );
  } else {
    link.removeAttribute("aria-current");
  }
}

function updateDesktopLink(link: NavLink, active: boolean): void {
  link.classList.toggle("active", active);

  link.style.setProperty(
    "--nav-underline-scale",
    active ? "1" : "0",
  );

  // Preserve Tailwind hover color behavior.
  link.style.fontWeight = active ? "700" : "";
}

function updateActiveNavigation(): void {
  const currentUrl = new URL(window.location.href);

  const allNavLinks =
    document.querySelectorAll<NavLink>("[data-nav]");

  const desktopLinks =
    document.querySelectorAll<NavLink>(
      ".site-header .nav-link",
    );

  allNavLinks.forEach((link) => {
    const linkUrl = getLinkUrl(link);

    const active =
      linkUrl !== null &&
      link.getAttribute("target") !== "_blank" &&
      isSameDestination(linkUrl, currentUrl);

    applyActiveLink(link, active);
  });

  desktopLinks.forEach((link) => {
    const linkUrl = getLinkUrl(link);

    const active =
      linkUrl !== null &&
      link.getAttribute("target") !== "_blank" &&
      isSameDestination(linkUrl, currentUrl);

    updateDesktopLink(link, active);
  });
}

function updateActiveSection(sectionId: string): void {
  const currentPath = normalizePath(
    window.location.pathname,
  );

  const allNavLinks =
    document.querySelectorAll<NavLink>("[data-nav]");

  const desktopLinks =
    document.querySelectorAll<NavLink>(
      ".site-header .nav-link",
    );

  allNavLinks.forEach((link) => {
    const linkUrl = getLinkUrl(link);

    if (!linkUrl) {
      applyActiveLink(link, false);
      return;
    }

    const samePath =
      normalizePath(linkUrl.pathname) === currentPath;

    const active =
      samePath &&
      linkUrl.origin === window.location.origin &&
      (
        linkUrl.hash === `#${sectionId}` ||
        (sectionId === "home" && !linkUrl.hash)
      );

    applyActiveLink(link, active);
  });

  desktopLinks.forEach((link) => {
    const linkUrl = getLinkUrl(link);

    if (!linkUrl) {
      updateDesktopLink(link, false);
      return;
    }

    const samePath =
      normalizePath(linkUrl.pathname) === currentPath;

    const active =
      samePath &&
      linkUrl.origin === window.location.origin &&
      link.getAttribute("target") !== "_blank" &&
      (
        linkUrl.hash === `#${sectionId}` ||
        (sectionId === "home" && !linkUrl.hash)
      );

    updateDesktopLink(link, active);
  });
}

// --------------------------------------------------
// Homepage section observer
// --------------------------------------------------

function initializeSectionObserver(): void {
  sectionObserver?.disconnect();
  sectionObserver = null;

  observedSections.clear();

  // Section tracking only applies to the homepage.
  if (normalizePath(window.location.pathname) !== "/") {
    return;
  }

  const sections =
    document.querySelectorAll<HTMLElement>(
      "#home, #projects, #about, #expertise, #experience, #services, #contact",
    );

  if (!sections.length) return;

  if (!("IntersectionObserver" in window)) {
    return;
  }

  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const section = entry.target as HTMLElement;

        if (entry.isIntersecting) {
          observedSections.set(section, entry);
        } else {
          observedSections.delete(section);
        }
      });

      if (!observedSections.size) {
        return;
      }

      const activationPoint =
        window.innerHeight * 0.25;

      const visibleSections = Array.from(
        observedSections.values(),
      );

      visibleSections.sort((a, b) => {
        const ratioDifference =
          b.intersectionRatio - a.intersectionRatio;

        if (Math.abs(ratioDifference) > 0.05) {
          return ratioDifference;
        }

        const distanceA = Math.abs(
          a.boundingClientRect.top - activationPoint,
        );

        const distanceB = Math.abs(
          b.boundingClientRect.top - activationPoint,
        );

        return distanceA - distanceB;
      });

      const activeSection = visibleSections[0];

      if (activeSection) {
        updateActiveSection(
          (activeSection.target as HTMLElement).id,
        );
      }
    },
    {
      rootMargin: "-15% 0px -65% 0px",
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    },
  );

  sections.forEach((section) => {
    sectionObserver?.observe(section);
  });
}

// --------------------------------------------------
// Mobile menu open
// --------------------------------------------------

function openMenu(): void {
  if (menuOpen) return;

  const menuToggle =
    getElement<HTMLButtonElement>("#menu-toggle");

  const mobileMenu =
    getElement<HTMLDivElement>("#mobile-navigation");

  const menuInner =
    mobileMenu?.querySelector<HTMLDivElement>(".menu-inner");

  const backdrop =
    getElement<HTMLDivElement>("#mobile-backdrop");

  if (!menuToggle || !mobileMenu || !menuInner || !backdrop) {
    return;
  }

  // Prevent both menus from being open together.
  closeDiscover();

  menuOpen = true;

  mobileMenu.classList.remove(
    "invisible",
    "pointer-events-none",
    "opacity-0",
  );

  mobileMenu.classList.add(
    "pointer-events-auto",
    "opacity-100",
  );

  mobileMenu.removeAttribute("inert");
  mobileMenu.setAttribute("aria-hidden", "false");

  menuInner.classList.remove(
    "translate-y-[-30px]",
    "scale-[0.97]",
    "opacity-0",
  );

  menuInner.classList.add(
    "translate-y-0",
    "scale-100",
    "opacity-100",
  );

  backdrop.classList.remove(
    "invisible",
    "opacity-0",
  );

  backdrop.classList.add(
    "visible",
    "opacity-100",
  );

  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute(
    "aria-label",
    "Close navigation menu",
  );

  const bars = menuToggle.querySelectorAll("span");

  bars[0]?.classList.add(
    "translate-y-[6px]",
    "rotate-45",
  );

  bars[1]?.classList.add(
    "translate-x-2",
    "opacity-0",
  );

  bars[2]?.classList.add(
    "translate-y-[-6px]",
    "-rotate-45",
  );

  const mobileLinks =
    mobileMenu.querySelectorAll<HTMLAnchorElement>(
      ".mobile-link",
    );

  mobileLinks.forEach((link, index) => {
    link.classList.remove(
      "translate-y-6",
      "opacity-0",
    );

    link.classList.add(
      "translate-y-0",
      "opacity-100",
    );

    link.style.transitionDelay =
      `${0.08 + index * 0.06}s`;
  });

  const menuFooter =
    mobileMenu.querySelector<HTMLElement>(".menu-footer");

  menuFooter?.classList.remove(
    "translate-y-5",
    "opacity-0",
  );

  menuFooter?.classList.add(
    "translate-y-0",
    "opacity-100",
  );

  const socialLinks =
    mobileMenu.querySelectorAll<HTMLAnchorElement>(
      ".socials a",
    );

  socialLinks.forEach((link, index) => {
    link.classList.remove(
      "translate-y-3",
      "scale-90",
      "opacity-0",
    );

    link.classList.add(
      "translate-y-0",
      "scale-100",
      "opacity-100",
    );

    link.style.transitionDelay =
      `${0.34 + index * 0.06}s`;
  });

  document.body.classList.add("menu-open");

  // Move keyboard focus into the opened menu.
  requestAnimationFrame(() => {
    if (!menuOpen) return;

    const firstFocusable =
      getFocusableElements(mobileMenu)[0];

    firstFocusable?.focus();
  });
}

// --------------------------------------------------
// Mobile menu close
// --------------------------------------------------

function closeMenu(
  force = false,
  restoreFocus = false,
): void {
  if (!force && !menuOpen) return;

  menuOpen = false;

  const menuToggle =
    getElement<HTMLButtonElement>("#menu-toggle");

  const mobileMenu =
    getElement<HTMLDivElement>("#mobile-navigation");

  const menuInner =
    mobileMenu?.querySelector<HTMLDivElement>(".menu-inner");

  const backdrop =
    getElement<HTMLDivElement>("#mobile-backdrop");

  // Always reset body state.
  document.body.classList.remove("menu-open");

  if (mobileMenu) {
    mobileMenu.classList.add(
      "pointer-events-none",
      "opacity-0",
    );

    mobileMenu.classList.remove(
      "pointer-events-auto",
      "opacity-100",
    );

    mobileMenu.setAttribute("inert", "");
    mobileMenu.setAttribute("aria-hidden", "true");
  }

  if (menuInner) {
    menuInner.classList.add(
      "translate-y-[-30px]",
      "scale-[0.97]",
      "opacity-0",
    );

    menuInner.classList.remove(
      "translate-y-0",
      "scale-100",
      "opacity-100",
    );
  }

  if (backdrop) {
    backdrop.classList.add(
      "invisible",
      "opacity-0",
    );

    backdrop.classList.remove(
      "visible",
      "opacity-100",
    );
  }

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");

    menuToggle.setAttribute(
      "aria-label",
      "Open navigation menu",
    );

    const bars = menuToggle.querySelectorAll("span");

    bars[0]?.classList.remove(
      "translate-y-[6px]",
      "rotate-45",
    );

    bars[1]?.classList.remove(
      "translate-x-2",
      "opacity-0",
    );

    bars[2]?.classList.remove(
      "translate-y-[-6px]",
      "-rotate-45",
    );
  }

  const mobileLinks =
    mobileMenu?.querySelectorAll<HTMLAnchorElement>(
      ".mobile-link",
    );

  mobileLinks?.forEach((link) => {
    link.classList.add(
      "translate-y-6",
      "opacity-0",
    );

    link.classList.remove(
      "translate-y-0",
      "opacity-100",
    );

    link.style.transitionDelay = "0s";
  });

  const menuFooter =
    mobileMenu?.querySelector<HTMLElement>(".menu-footer");

  menuFooter?.classList.add(
    "translate-y-5",
    "opacity-0",
  );

  menuFooter?.classList.remove(
    "translate-y-0",
    "opacity-100",
  );

  const socialLinks =
    mobileMenu?.querySelectorAll<HTMLAnchorElement>(
      ".socials a",
    );

  socialLinks?.forEach((link) => {
    link.classList.add(
      "translate-y-3",
      "scale-90",
      "opacity-0",
    );

    link.classList.remove(
      "translate-y-0",
      "scale-100",
      "opacity-100",
    );

    link.style.transitionDelay = "0s";
  });

  if (restoreFocus && menuToggle) {
    menuToggle.focus();
  }
}

// --------------------------------------------------
// Discover dropdown open
// --------------------------------------------------

function openDiscover(): void {
  if (discoverOpen) return;

  const discoverToggle =
    getElement<HTMLButtonElement>("#discover-toggle");

  const discoverMenu =
    getElement<HTMLDivElement>("#discover-menu");

  const discoverArrow =
    getElement<SVGElement>("#discover-arrow");

  if (!discoverToggle || !discoverMenu) {
    return;
  }

  // Prevent both menus from being open together.
  closeMenu();

  discoverOpen = true;

  discoverMenu.classList.remove(
    "invisible",
    "pointer-events-none",
    "opacity-0",
    "translate-y-3",
  );

  discoverMenu.classList.add(
    "visible",
    "pointer-events-auto",
    "opacity-100",
    "translate-y-0",
  );

  discoverMenu.removeAttribute("inert");
  discoverMenu.setAttribute("aria-hidden", "false");

  discoverToggle.setAttribute("aria-expanded", "true");

  discoverArrow?.classList.add("rotate-180");
}

// --------------------------------------------------
// Discover dropdown close
// --------------------------------------------------

function closeDiscover(
  force = false,
  restoreFocus = false,
): void {
  if (!force && !discoverOpen) return;

  discoverOpen = false;

  const discoverToggle =
    getElement<HTMLButtonElement>("#discover-toggle");

  const discoverMenu =
    getElement<HTMLDivElement>("#discover-menu");

  const discoverArrow =
    getElement<SVGElement>("#discover-arrow");

  if (discoverMenu) {
    discoverMenu.classList.add(
      "invisible",
      "pointer-events-none",
      "opacity-0",
      "translate-y-3",
    );

    discoverMenu.classList.remove(
      "visible",
      "pointer-events-auto",
      "opacity-100",
      "translate-y-0",
    );

    discoverMenu.setAttribute("inert", "");
    discoverMenu.setAttribute("aria-hidden", "true");
  }

  discoverToggle?.setAttribute(
    "aria-expanded",
    "false",
  );

  discoverArrow?.classList.remove("rotate-180");

  if (restoreFocus) {
    discoverToggle?.focus();
  }
}

// --------------------------------------------------
// Click handling
// --------------------------------------------------

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target;

  if (!(target instanceof Element)) return;

  // Mobile menu button.
  const menuToggle = target.closest("#menu-toggle");

  if (menuToggle) {
    event.preventDefault();

    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }

    return;
  }

  // Mobile backdrop.
  if (target.closest("#mobile-backdrop")) {
    closeMenu();
    return;
  }

  // Discover toggle.
  const discoverToggle =
    target.closest("#discover-toggle");

  if (discoverToggle) {
    event.preventDefault();

    if (discoverOpen) {
      closeDiscover();
    } else {
      openDiscover();
    }

    return;
  }

  // Mobile navigation links.
  if (target.closest(".mobile-link")) {
    closeMenu();
    closeDiscover();
    return;
  }

  // Close Discover after selecting one of its links.
  if (target.closest("#discover-menu a")) {
    closeDiscover();
    return;
  }

  // Close Discover when clicking outside.
  if (discoverOpen) {
    const discoverMenu =
      getElement<HTMLDivElement>("#discover-menu");

    const currentDiscoverToggle =
      getElement<HTMLButtonElement>(
        "#discover-toggle",
      );

    if (
      !discoverMenu?.contains(target) &&
      !currentDiscoverToggle?.contains(target)
    ) {
      closeDiscover();
    }
  }

  // Close menus after clicking a navigation link.
  if (target.closest("[data-nav]")) {
    closeMenu();
    closeDiscover();
  }
}

// --------------------------------------------------
// Keyboard handling
// --------------------------------------------------

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    if (menuOpen) {
      closeMenu(false, true);
      return;
    }

    if (discoverOpen) {
      closeDiscover(false, true);
      return;
    }
  }

  // Keep keyboard focus inside the mobile menu.
  if (event.key !== "Tab" || !menuOpen) {
    return;
  }

  const mobileMenu =
    getElement<HTMLDivElement>("#mobile-navigation");

  if (!mobileMenu) return;

  const focusableElements =
    getFocusableElements(mobileMenu);

  if (!focusableElements.length) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];

  const lastElement =
    focusableElements[focusableElements.length - 1];

  if (
    event.shiftKey &&
    document.activeElement === firstElement
  ) {
    event.preventDefault();
    lastElement.focus();
  } else if (
    !event.shiftKey &&
    document.activeElement === lastElement
  ) {
    event.preventDefault();
    firstElement.focus();
  }
}

// --------------------------------------------------
// Responsive handling
// --------------------------------------------------

function handleResize(): void {
  // Tailwind's default md breakpoint is 768px.
  if (window.innerWidth >= 768) {
    closeMenu();
  }
}

// --------------------------------------------------
// URL navigation handling
// --------------------------------------------------

function handleHashChange(): void {
  updateActiveNavigation();

  const hash = window.location.hash.slice(1);

  if (
    hash &&
    normalizePath(window.location.pathname) === "/"
  ) {
    const section = document.getElementById(hash);

    if (section) {
      updateActiveSection(section.id);
    }
  }
}

function handlePopState(): void {
  updateActiveNavigation();
}

// --------------------------------------------------
// Astro navigation lifecycle
// --------------------------------------------------

function initializeHeader(): void {
  // Reset overlays after navigation.
  closeMenu(true);
  closeDiscover(true);

  // Update links for the current URL.
  updateActiveNavigation();

  // Reinitialize section tracking for the current page.
  initializeSectionObserver();
}

function handleBeforeSwap(): void {
  // Close overlays before the old page DOM is replaced.
  closeMenu(true);
  closeDiscover(true);

  sectionObserver?.disconnect();
  sectionObserver = null;

  observedSections.clear();
}

// --------------------------------------------------
// Event listener registration
// --------------------------------------------------

// Abort any previous registration.
// This also protects against duplicate listeners during HMR.
headerWindow.__portfolioHeaderController?.abort();

const controller = new AbortController();

headerWindow.__portfolioHeaderController = controller;

const listenerOptions: AddEventListenerOptions = {
  signal: controller.signal,
};

document.addEventListener(
  "click",
  handleDocumentClick,
  listenerOptions,
);

document.addEventListener(
  "keydown",
  handleKeydown,
  listenerOptions,
);

document.addEventListener(
  "astro:before-swap",
  handleBeforeSwap,
  listenerOptions,
);

document.addEventListener(
  "astro:page-load",
  initializeHeader,
  listenerOptions,
);

window.addEventListener(
  "resize",
  handleResize,
  listenerOptions,
);

window.addEventListener(
  "hashchange",
  handleHashChange,
  listenerOptions,
);

window.addEventListener(
  "popstate",
  handlePopState,
  listenerOptions,
);

// Initial page setup.
initializeHeader();