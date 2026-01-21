import React from "react";

export default function BulkBarcodePrint({ purchase, items }) {
  // ✅ label size in mm (change as your sticker size)
  const LABEL_W = 70; // width mm
  const LABEL_H = 30; // height mm

  const printLabel = (row) => {
    const svgHtml = row?.barcode_svg || "";
    const text = row?.stock?.barcode || row?.stock?.batch_no || "N/A"; // আপনি চাইলে এখানে PO-11-MKMZ set করবেন

    if (!svgHtml) return;

    const win = window.open("", "_blank", "width=600,height=500");
    if (!win) return;

    win.document.open();
    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Barcode</title>

          <style>
            @page { size: ${LABEL_W}mm ${LABEL_H}mm; margin: 0; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

            html, body {
              width: ${LABEL_W}mm;
              height: ${LABEL_H}mm;
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: #fff;
              font-family: Arial, sans-serif;
            }

            /* ✅ label wrapper exactly like your image */
            .label {
              width: 100%;
              height: 100%;
              padding: 2mm 2mm 0mm 2mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: stretch;
              gap: 0.5mm;
            }

            /* ✅ barcode area */
            .barcode {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            svg {
              width: 100% !important;
              height: 100% !important;
              max-width: 100%;
              max-height: 100%;
              display: block;
            }

            /* ✅ Hide SVG built-in text (we will show our own text under it) */
            svg text {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
            }

            /* ✅ text under barcode (center) */
            .txt {
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 12px;
              letter-spacing: 0.5px;
              line-height: 1;
              text-align: center;
              white-space: nowrap;
            }
          </style>
        </head>

        <body>
          <div class="label">
            <div class="barcode">
              ${svgHtml}
            </div>
            <div class="txt">${escapeHtml(text)}</div>
          </div>

          <script>
            window.onload = function(){
              setTimeout(function(){
                window.focus();
                window.print();
                window.close();
              }, 120);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Purchase: {purchase?.purchase_no}</h2>
      <hr style={{ margin: "12px 0" }} />

      {items?.map((row, idx) => (
        <div
          key={idx}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            marginBottom: 12,
            borderRadius: 8,
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={() => printLabel(row)}
            style={{
              position: "absolute",
              right: 10,
              top: 10,
              fontSize: 12,
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Print
          </button>

          {/* On-screen preview */}
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            Barcode Text: <b>{row?.stock?.barcode || "N/A"}</b>
          </div>

          <div dangerouslySetInnerHTML={{ __html: row?.barcode_svg || "" }} />
        </div>
      ))}
    </div>
  );
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
