import React from "react";
import { motion } from "framer-motion";

/**
 * AuroraBackground — BioBistro temasına özel aurora efekti.
 * Renk paleti: Sağlık yeşili (#006d2f) + Canlılık turuncusu (#fd7c31)
 * Yemek & Sağlık motivasyonunu yansıtır.
 */
export const AuroraBackground = ({
  children,
  showRadialGradient = true,
  style = {},
  className = "",
}) => {
  return (
    <div
      className={`bb-aurora-root ${className}`}
      style={style}
    >
      {/* Aurora katmanı */}
      <div className="bb-aurora-layer">
        <div
          className={`bb-aurora-glow${showRadialGradient ? " bb-aurora-masked" : ""}`}
        />
      </div>

      {/* İçerik */}
      <div className="bb-aurora-content">{children}</div>
    </div>
  );
};

/**
 * AuroraAuthPage — Login/Register gibi tam sayfa auth layoutları için.
 * Aurora arka plan + ortada içerik kartı.
 */
export const AuroraAuthPage = ({ children }) => {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
        className="bb-aurora-card-wrap"
      >
        {children}
      </motion.div>
    </AuroraBackground>
  );
};

export default AuroraBackground;
