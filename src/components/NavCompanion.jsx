import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import navCatWalk from "../animations/navCatWalk.json";

export default function NavCompanion({ className = "" }) {
  return (
    <div className={`nav-track ${className}`.trim()} aria-hidden="true">
      <div className="nav-companion">
        <DotLottieReact
          className="nav-companion-art"
          data={navCatWalk}
          autoplay
          loop
          speed={0.95}
          layout={{ fit: "contain", align: [0.5, 0.56] }}
          renderConfig={{ autoResize: true, devicePixelRatio: 2 }}
        />
      </div>
    </div>
  );
}
