import { useEffect, useRef, useState } from "react";
import NavCompanion from "../NavCompanion.jsx";

function normalizePath(path = "/") {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function resolveActiveLink(nav, pathname) {
  const path = normalizePath(pathname);
  const links = [...nav.querySelectorAll(".ms-header-link")];

  const exact = links.find(
    (link) => normalizePath(link.getAttribute("href") ?? "") === path,
  );
  if (exact) return exact;

  const nested = links.find((link) => {
    const href = normalizePath(link.getAttribute("href") ?? "");
    return href !== "/" && path.startsWith(href);
  });

  return (
    nested ??
    links.find((link) => link.getAttribute("href") === "/") ??
    links[0]
  );
}

function measureLinkX(rail, cat, link) {
  if (!rail || !cat || !link) return null;

  const railRect = rail.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const catWidth = cat.offsetWidth || 48;
  const x = linkRect.left - railRect.left + (linkRect.width - catWidth) / 2;

  if (!Number.isFinite(x)) return null;
  return Math.max(0, x);
}

const SLIDE_MS = 580;

export default function ManuscriptNavCat() {
  const railRef = useRef(null);
  const catRef = useRef(null);
  const xRef = useRef(null);
  const animatingRef = useRef(false);
  const animTimerRef = useRef(null);
  const reducedMotionRef = useRef(false);
  const [x, setX] = useState(null);
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const getLayout = () => {
      const rail = railRef.current;
      const stage = rail?.closest(".ms-header-nav-stage");
      const nav = stage?.querySelector(".ms-header-nav");
      const cat = catRef.current;
      return rail && nav && cat ? { rail, nav, cat, stage } : null;
    };

    const clearAnimTimer = () => {
      if (animTimerRef.current != null) {
        window.clearTimeout(animTimerRef.current);
        animTimerRef.current = null;
      }
    };

    const markAnimating = () => {
      clearAnimTimer();
      animatingRef.current = true;
      animTimerRef.current = window.setTimeout(() => {
        animatingRef.current = false;
        animTimerRef.current = null;
      }, SLIDE_MS + 40);
    };

    const applyX = (nextX, { instant = false } = {}) => {
      if (nextX == null) return;

      xRef.current = nextX;
      setReady(true);

      if (instant || reducedMotionRef.current) {
        setStill(true);
        setX(nextX);
        return;
      }

      setStill(false);
      setX(nextX);
    };

    const snapToLink = (link) => {
      const layout = getLayout();
      if (!layout) return;
      const nextX = measureLinkX(layout.rail, layout.cat, link);
      if (nextX == null) return;
      applyX(nextX, { instant: true });
    };

    const snapToActive = () => {
      const layout = getLayout();
      if (!layout) return;
      const active = resolveActiveLink(layout.nav, window.location.pathname);
      if (active) snapToLink(active);
    };

    const slideToLink = (link) => {
      const layout = getLayout();
      if (!layout) return;

      const nextX = measureLinkX(layout.rail, layout.cat, link);
      if (nextX == null) return;

      const fromX = xRef.current;
      const shouldSlide =
        fromX != null &&
        !reducedMotionRef.current &&
        Math.abs(fromX - nextX) > 2;

      if (shouldSlide) markAnimating();
      applyX(nextX, { instant: !shouldSlide });
    };

    const onPageLoad = () => {
      requestAnimationFrame(() => {
        if (animatingRef.current) {
          clearAnimTimer();
          animTimerRef.current = window.setTimeout(() => {
            animatingRef.current = false;
            animTimerRef.current = null;
            snapToActive();
          }, SLIDE_MS + 40);
          return;
        }
        snapToActive();
      });
    };

    const onResize = () => {
      if (!animatingRef.current) snapToActive();
    };

    const onClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest(".ms-header-link");
      if (!(link instanceof HTMLAnchorElement)) return;

      slideToLink(link);
    };

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      reducedMotionRef.current = media.matches;
      setReducedMotion(media.matches);
    };
    syncMotion();
    media.addEventListener("change", syncMotion);

    const stage = railRef.current?.closest(".ms-header-nav-stage");
    stage?.addEventListener("click", onClick);
    document.addEventListener("astro:page-load", onPageLoad);
    window.addEventListener("resize", onResize);

    requestAnimationFrame(snapToActive);

    return () => {
      clearAnimTimer();
      stage?.removeEventListener("click", onClick);
      document.removeEventListener("astro:page-load", onPageLoad);
      window.removeEventListener("resize", onResize);
      media.removeEventListener("change", syncMotion);
    };
  }, []);

  return (
    <div className="ms-nav-cat-rail" ref={railRef} aria-hidden="true">
      <div
        className={["ms-nav-cat", still ? "ms-nav-cat--still" : ""]
          .filter(Boolean)
          .join(" ")}
        ref={catRef}
        style={{
          transform: x == null ? undefined : `translate3d(${x}px, 0, 0)`,
          opacity: ready ? 1 : 0,
        }}
      >
        <div className="ms-nav-cat-inner">
          <NavCompanion paused={reducedMotion} />
        </div>
      </div>
    </div>
  );
}
