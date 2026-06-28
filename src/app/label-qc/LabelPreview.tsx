"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const btn: React.CSSProperties = {
  padding: "4px 10px", borderRadius: 5, border: "1px solid var(--border)",
  background: "transparent", color: "var(--text-secondary)", cursor: "pointer",
  fontSize: 13, lineHeight: 1, transition: "background 0.1s",
};

interface Props { file: File; }

export default function LabelPreview({ file }: Props) {
  const [url, setUrl]           = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage]         = useState(1);
  const [scale, setScale]       = useState(1.0);
  const [fitWidth, setFitWidth] = useState(true);
  const containerRef            = useRef<HTMLDivElement>(null);
  const [cWidth, setCWidth]     = useState(700);

  // Create / revoke blob URL whenever file changes
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    setPage(1);
    setScale(1.0);
    setFitWidth(true);
    setNumPages(0);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Track container width for fit-width mode
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setCWidth(entry.contentRect.width - 32));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const zoomIn  = useCallback(() => { setFitWidth(false); setScale(s => Math.min(+(s + 0.25).toFixed(2), 3)); }, []);
  const zoomOut = useCallback(() => { setFitWidth(false); setScale(s => Math.max(+(s - 0.25).toFixed(2), 0.25)); }, []);
  const doFit   = useCallback(() => { setFitWidth(true); }, []);
  const prevPage = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const nextPage = useCallback((n: number) => () => setPage(p => Math.min(n, p + 1)), []);

  if (!url) return null;

  const isPdf  = file.type === "application/pdf";
  const isImg  = file.type.startsWith("image/");
  const width  = fitWidth ? Math.max(cWidth, 200) : Math.round(cWidth * scale);
  const scaleLabel = fitWidth ? "Fit" : `${Math.round(scale * 100)}%`;

  return (
    <div style={{
      marginBottom: 28,
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px", borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}>
          Uploaded Label Preview
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Page navigation — only for multi-page PDFs */}
          {isPdf && numPages > 1 && (
            <>
              <button onClick={prevPage} disabled={page <= 1} style={btn}>‹</button>
              <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 56, textAlign: "center" }}>
                {page} / {numPages}
              </span>
              <button onClick={nextPage(numPages)} disabled={page >= numPages} style={btn}>›</button>
              <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 6px" }} />
            </>
          )}

          {/* Zoom controls */}
          <button onClick={zoomOut} style={btn} title="Zoom out">−</button>
          <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 42, textAlign: "center", userSelect: "none" }}>
            {scaleLabel}
          </span>
          <button onClick={zoomIn} style={btn} title="Zoom in">+</button>
          <button
            onClick={doFit}
            title="Fit width"
            style={{ ...btn, marginLeft: 2, fontSize: 12, fontWeight: fitWidth ? 700 : 400, color: fitWidth ? "var(--accent-teal)" : "var(--text-secondary)", borderColor: fitWidth ? "var(--accent-teal)" : "var(--border)" }}
          >
            ⟷
          </button>
        </div>
      </div>

      {/* ── Preview body ── */}
      <div
        ref={containerRef}
        style={{
          height: 700, overflowY: "auto", overflowX: "auto",
          background: "var(--bg-base)",
          display: "flex", justifyContent: "center", alignItems: "flex-start",
          padding: "16px",
        }}
      >
        {isPdf && (
          <Document
            file={url}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={
              <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 48, textAlign: "center" }}>
                Loading PDF…
              </div>
            }
            error={
              <div style={{ color: "#E84040", fontSize: 13, padding: 48, textAlign: "center" }}>
                Failed to render PDF. Check that the file is a valid PDF.
              </div>
            }
          >
            <Page
              pageNumber={page}
              width={width}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        )}

        {isImg && (
          <img
            src={url}
            alt="Uploaded label"
            style={{ maxWidth: width, maxHeight: "100%", objectFit: "contain", borderRadius: 4 }}
          />
        )}
      </div>

      {/* ── Footer ── */}
      {isPdf && numPages > 0 && (
        <div style={{ padding: "6px 14px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>{file.name}</span>
          <span>{numPages} page{numPages !== 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}
