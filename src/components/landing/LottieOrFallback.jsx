import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

/**
 * Renders a .lottie animation if the file exists at `src`, otherwise shows a
 * static fallback. The two provided .lottie files (Bug_Hunting, new_ting) are
 * expected at src/assets/lottie/ — until they're dropped in, the fallback keeps
 * the section visually complete instead of rendering an empty box.
 *
 * We probe the asset with a HEAD/GET so a missing file degrades gracefully
 * rather than throwing inside the player.
 */
export default function LottieOrFallback({ src, fallback, className = "", loop = true, autoplay = true }) {
  const [status, setStatus] = useState("checking"); // checking | ok | missing

  useEffect(() => {
    let alive = true;
    fetch(src, { method: "GET" })
      .then((res) => {
        if (!alive) return;
        setStatus(res.ok ? "ok" : "missing");
      })
      .catch(() => alive && setStatus("missing"));
    return () => {
      alive = false;
    };
  }, [src]);

  if (status === "ok") {
    return (
      <div className={className}>
        <DotLottieReact src={src} loop={loop} autoplay={autoplay} />
      </div>
    );
  }

  if (status === "missing") {
    return <div className={className}>{fallback}</div>;
  }

  // checking — reserve the space to avoid layout shift
  return <div className={className} aria-hidden="true" />;
}
