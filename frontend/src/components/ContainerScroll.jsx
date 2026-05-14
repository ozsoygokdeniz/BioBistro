import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";

/**
 * ContainerScroll — single-frame scroll-parallax wrapper.
 * All content is shown inside one rotating card that straightens as user scrolls into it.
 */
export const ContainerScroll = ({ titleComponent, children }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Card starts tilted, straightens as you scroll into it
  const rotate = useTransform(scrollYProgress, [0, 0.25], isMobile ? [8, 0] : [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.25], isMobile ? [0.92, 1] : [0.96, 1]);
  const translateY = useTransform(scrollYProgress, [0, 0.25], [40, 0]);

  return (
    <div
      ref={containerRef}
      style={{ perspective: "1400px", paddingTop: 16, position: "relative" }}
    >
      {/* Title / header — slides up as card straightens */}
      {titleComponent && (
        <motion.div style={{ translateY }} className="bb-scroll-title">
          {titleComponent}
        </motion.div>
      )}

      {/* The single rotating frame that holds ALL days */}
      <motion.div
        style={{
          rotateX: rotate,
          scale,
          transformOrigin: "top center",
          boxShadow:
            "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000022, 0 84px 50px #00000012",
        }}
        className="bb-scroll-card"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ContainerScroll;
