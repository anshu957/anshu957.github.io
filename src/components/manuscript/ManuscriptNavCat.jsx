import { useCallback, useEffect, useRef, useState } from "react";
import NavCompanion from "../NavCompanion.jsx";

function resolveActiveLink(nav, pathname) {
  const links = [...nav.querySelectorAll(".ms-header-link")];
  const exact = links.find((link) => link.getAttribute("href") === pathname);
  if (exact) return exact;

  const nested = links.find((link) => {
    const href = link.getAttribute("href");
    return href !== "/" && pathname.startsWith(href);
  });

  return nested ?? links.find((link) => link.getAttribute("href") === "/") ?? links[0];
}

export default function ManuscriptNavCat({ currentPath = "/" }) {
  const railRef = useRef(null);
  const catRef = useRef(null);
  const xRef = useRef(null);
  const [x, setX] = useState(null);
  const [facingLeft, setFacingLeft] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const reposition = useCallback(
    (targetLink) => {
      const stage = railRef.current?.closest(".ms-header-nav-stage");
      const nav = stage?.querySelector(".ms-header-nav");
      const cat = catRef.current;
      if (!stage || !nav || !cat) return;

      const pathname =
        typeof window !== "undefined" ? window.location.pathname : currentPath;
      const active = targetLink ?? resolveActiveLink(nav, pathname);
      if (!active) return;

      const stageRect = stage.getBoundingClientRect();
      const linkRect = active.getBoundingClientRect();
      const catWidth = cat.offsetWidth;
      const nextX = linkRect.left - stageRect.left + (linkRect.width - catWidth) / 2;

      if (xRef.current != null && nextX < xRef.current - 2) {
        setFacingLeft(true);
      } else if (xRef.current != null && nextX > xRef.current + 2) {
        setFacingLeft(false);
      }

      xRef.current = nextX;
      setX(nextX);
    },
    [currentPath],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    syncMotion();
    media.addEventListener("change", syncMotion);
    return () => media.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => reposition());

    const onResize = () => reposition();
    const onPageLoad = () => reposition();
    const stage = railRef.current?.closest(".ms-header-nav-stage");
    const nav = stage?.querySelector(".ms-header-nav");

    const onLinkClick = (event) => {
      const link = event.currentTarget;
      if (link instanceof HTMLAnchorElement) {
        reposition(link);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("astro:page-load", onPageLoad);
    nav?.querySelectorAll(".ms-header-link").forEach((link) => {
      link.addEventListener("click", onLinkClick);
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("astro:page-load", onPageLoad);
      nav?.querySelectorAll(".ms-header-link").forEach((link) => {
        link.removeEventListener("click", onLinkClick);
      });
    };
  }, [reposition, currentPath]);

  return (
    <div className="ms-nav-cat-rail" ref={railRef} aria-hidden="true">
      <div
        className={[
          "ms-nav-cat",
          reducedMotion ? "ms-nav-cat--still" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        ref={catRef}
        style={{
          transform: x == null ? undefined : `translateX(${x}px)`,
          opacity: x == null ? 0 : 1,
        }}
      >
        <div
          className={[
            "ms-nav-cat-inner",
            facingLeft ? "ms-nav-cat-inner--left" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <NavCompanion paused={reducedMotion} />
        </div>
      </div>
    </div>
  );
}
