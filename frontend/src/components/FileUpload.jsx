import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";

/* ── animation variants ── */
const mainVariant = {
  initial: { x: 0, y: 0 },
  animate: { x: 20, y: -20, opacity: 0.9 },
};

const secondaryVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

/* ── GridPattern background ── */
const GridPattern = () => {
  const columns = 41;
  const rows = 11;
  return (
    <div
      style={{
        display: "flex",
        flexShrink: 0,
        transform: "scale(1.05)",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "1px",
        background: "var(--surface-container)",
        width: "100%",
        height: "100%",
      }}
    >
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              style={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: 2,
                background:
                  index % 2 === 0
                    ? "var(--surface-container-low)"
                    : "var(--surface-container-lowest)",
                boxShadow:
                  index % 2 !== 0
                    ? "0px 0px 1px 3px rgba(255,255,255,0.9) inset"
                    : "none",
              }}
            />
          );
        })
      )}
    </div>
  );
};

/* ── Main FileUpload component ── */
export const FileUpload = ({ onChange, accept = "application/pdf", label = "Dosya Yükle", hint = "PDF dosyanızı buraya sürükleyin veya tıklayın" }) => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (newFiles) => {
    setFiles((prev) => [...prev, ...newFiles]);
    onChange && onChange(newFiles);
  };

  const handleClick = () => fileInputRef.current?.click();

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    accept: { "application/pdf": [".pdf"] },
    onDrop: handleFileChange,
    onDropRejected: (err) => console.warn("Reddedilen dosya:", err),
  });

  return (
    <div style={{ width: "100%" }} {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          cursor: "pointer",
          overflow: "hidden",
          borderRadius: 12,
          padding: "40px 32px",
        }}
      >
        {/* hidden file input */}
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          accept={accept}
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          style={{ display: "none" }}
        />

        {/* grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            maskImage: "radial-gradient(ellipse at center, white, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse at center, white, transparent)",
            pointerEvents: "none",
          }}
        >
          <GridPattern />
        </div>

        {/* content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 17,
              fontWeight: 700,
              color: "var(--on-surface)",
            }}
          >
            {label}
          </p>
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "var(--secondary)",
            }}
          >
            {hint}
          </p>

          {/* file list or upload icon */}
          <div
            style={{
              position: "relative",
              margin: "32px auto 0",
              width: "100%",
              maxWidth: 480,
            }}
          >
            {files.length > 0 ? (
              files.map((file, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: "relative",
                    zIndex: 40,
                    margin: "12px auto 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    overflow: "hidden",
                    borderRadius: 10,
                    background: "var(--surface-container-lowest)",
                    padding: "14px 18px",
                    border: "1px solid rgba(188,202,186,0.4)",
                    boxShadow: "var(--shadow-sm)",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span
                        className="material-symbols-outlined icon-filled"
                        style={{ fontSize: 22, color: "var(--error)", flexShrink: 0 }}
                      >
                        picture_as_pdf
                      </span>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--on-surface)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 260,
                        }}
                      >
                        {file.name}
                      </p>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--secondary)",
                        background: "var(--surface-container)",
                        borderRadius: 6,
                        padding: "3px 9px",
                      }}
                    >
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      width: "100%",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--secondary)",
                    }}
                  >
                    <span
                      style={{
                        background: "var(--primary-glow)",
                        color: "var(--primary)",
                        borderRadius: 4,
                        padding: "2px 8px",
                        fontWeight: 600,
                      }}
                    >
                      {file.type || "application/pdf"}
                    </span>
                    <span>
                      Değiştirildi:{" "}
                      {new Date(file.lastModified).toLocaleDateString("tr-TR")}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <>
                {/* floating upload card */}
                <motion.div
                  layoutId="file-upload"
                  variants={mainVariant}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{
                    position: "relative",
                    zIndex: 40,
                    margin: "0 auto",
                    display: "flex",
                    height: 112,
                    width: 112,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    background: "var(--surface-container-lowest)",
                    boxShadow: "0px 10px 50px rgba(253,124,49,0.15)",
                    border: "1.5px solid rgba(253,124,49,0.25)",
                  }}
                >
                  {isDragActive ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        color: "var(--tertiary-container)",
                      }}
                    >
                      <span
                        className="material-symbols-outlined icon-filled"
                        style={{ fontSize: 28 }}
                      >
                        file_download
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>Bırak</span>
                    </motion.div>
                  ) : (
                    <span
                      className="material-symbols-outlined icon-filled"
                      style={{ fontSize: 32, color: "var(--tertiary-container)" }}
                    >
                      upload_file
                    </span>
                  )}
                </motion.div>

                {/* dashed highlight border — orange on hover/drag */}
                <motion.div
                  variants={secondaryVariant}
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 30,
                    margin: "0 auto",
                    display: "flex",
                    height: 112,
                    width: 112,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    border: "2px dashed var(--tertiary-container)",
                    background: "rgba(253,124,49,0.06)",
                    opacity: 0,
                  }}
                />
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FileUpload;
