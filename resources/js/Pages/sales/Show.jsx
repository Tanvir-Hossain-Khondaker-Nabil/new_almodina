import React, { useMemo, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download } from "lucide-react";

export default function SaleShow({ sale }) {
  const { auth } = usePage().props;
  const [isPrinting, setIsPrinting] = useState(false);

  // ========= Bangla Helpers =========
  const toBanglaDigit = (value) => {
    const map = { 0: "০", 1: "১", 2: "২", 3: "৩", 4: "৪", 5: "৫", 6: "৬", 7: "৭", 8: "৮", 9: "৯" };
    return String(value ?? "").replace(/\d/g, (d) => map[d]);
  };

  const formatMoneyBn = (amount) => {
    const num = new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
    return toBanglaDigit(num);
  };

  const formatDateBn = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear());
    return toBanglaDigit(`${dd}/${mm}/${yy}`);
  };

  const formatDateTimeBn = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear());
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return toBanglaDigit(`${dd}/${mm}/${yy} ${hh}:${mi}`);
  };

  // ========= Data =========
  const items = useMemo(() => sale?.items || [], [sale]);

  const totalQty = useMemo(
    () => items.reduce((sum, it) => sum + Number(it?.quantity || 0), 0),
    [items]
  );

  // ========= আল-মদিনা স্টোর Theme =========
  const MB_DARK = "rgb(15, 45, 26)";
  const MB_LIGHT = "rgb(30, 77, 43)";
  const MB_GRADIENT = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

  const BORDER = "border-[#0f2d1a]";
  const TEXT = "text-[#1e4d2b]";

  // ========= Dynamic Header =========
  const PAD_TITLE = sale?.creator?.business?.name || "আল-মদিনা স্টোর";
  const PAD_OWNER = "প্রোঃ মোঃ সবুজ হোসেন";
  const PAD_NOTE =
    "এখানে বেবী ফুডস, মুদি মালামাল, কসমেটিকস সামগ্রী সুলভ মূল্যে ক্রয়-বিক্রয় করা হয়। বিশেষ অর্ডারে সকল ধরনের কেক পাওয়া যায় এবং অর্ডার নেয়া হয়।";

  const padAddressLine =
    sale?.creator?.business?.address ||
    "নেভী চেকপোস্ট, খালিশপুর, খুলনা";

  const padMobile = sale?.creator?.business?.phone || "০১৬৭৪-০০৭৪৭২";

  const memoNo = sale?.invoice_no || sale?.id || "";
  const invoiceDate = formatDateBn(sale?.created_at);

  const customerName =
    sale?.customer?.customer_name || sale?.customer?.name || "Walk-in Customer";

  const customerAddress =
    sale?.customer?.address || sale?.customer?.customer_address || "";

  const tableRows = useMemo(() => {
    return items.map((item) => {
      const desc =
        item?.product?.name || item?.product_name || item?.description || "N/A";
      const qty = Number(item?.quantity || 0);
      const rate = Number(item?.unit_price || 0);
      const amount = Number(item?.total_price || 0);
      return { desc, qty, rate, amount };
    });
  }, [items]);

  // ========= Print =========
  const handlePrint = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setTimeout(() => setIsPrinting(false), 400);
      }, 80);
    });
  };

  const handleDownload = () => handlePrint();

  // ✅ Component (SAFE) — no crash
  const InvoicePad = ({ isPrint = false } = {}) => {
    return (
      <div className={`pad-border border-2 ${BORDER} p-4`}>
        {/* Title gradient text */}
        <div
          className={`text-center ${isPrint ? "text-[34px]" : "text-[34px] sm:text-[38px]"} font-extrabold leading-tight`}
          style={{
            background: MB_GRADIENT,
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          {PAD_TITLE}
        </div>

        <div className="text-center mt-2">
          <span
            className="inline-block text-white px-4 py-1 rounded-full text-sm font-bold"
            style={{ background: MB_GRADIENT }}
          >
            {PAD_OWNER}
          </span>
        </div>

        <div className="text-center text-xs sm:text-sm leading-relaxed mt-2 px-1">
          {PAD_NOTE}
        </div>

        <div className="text-center text-xs sm:text-sm font-bold mt-2">
          {padAddressLine}
        </div>

        <div className="text-center text-xs sm:text-sm font-semibold mt-1">
          মোবাঃ {toBanglaDigit(padMobile)}
        </div>

        {/* dotted fields */}
        <div className="mt-3 space-y-2 text-sm font-bold">
          <div className="grid grid-cols-[42px_1fr_38px_1fr] gap-2 items-end">
            <div>নং-</div>
            <div className="flex items-end gap-2">
              <span className="text-xs font-semibold">{toBanglaDigit(memoNo)}</span>
              <span className={`flex-1 border-b-2 border-dotted ${BORDER} h-4`} />
            </div>
            <div>তারিখ</div>
            <div className="flex items-end gap-2">
              <span className="text-xs font-semibold">{invoiceDate}</span>
              <span className={`flex-1 border-b-2 border-dotted ${BORDER} h-4`} />
            </div>
          </div>

          <div className="grid grid-cols-[42px_1fr] gap-2 items-end">
            <div>নাম</div>
            <div className="flex items-end gap-2">
              <span className="text-xs font-semibold">{customerName}</span>
              <span className={`flex-1 border-b-2 border-dotted ${BORDER} h-4`} />
            </div>
          </div>

          <div className="grid grid-cols-[42px_1fr] gap-2 items-end">
            <div>ঠিকানা</div>
            <div className="flex items-end gap-2">
              <span className="text-xs font-semibold">{customerAddress}</span>
              <span className={`flex-1 border-b-2 border-dotted ${BORDER} h-4`} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr>
                <th className={`border-2 ${BORDER} font-extrabold text-sm py-2 w-[55%]`} style={{ color: MB_LIGHT }}>
                  বিবরণ
                </th>
                <th className={`border-2 ${BORDER} font-extrabold text-sm py-2 w-[15%]`} style={{ color: MB_LIGHT }}>
                  পরিমাণ
                </th>
                <th className={`border-2 ${BORDER} font-extrabold text-sm py-2 w-[15%]`} style={{ color: MB_LIGHT }}>
                  দর
                </th>
                <th className={`border-2 ${BORDER} font-extrabold text-sm py-2 w-[15%]`} style={{ color: MB_LIGHT }}>
                  টাকা
                </th>
              </tr>
            </thead>

            <tbody>
              {tableRows.length ? (
                tableRows.map((r, idx) => (
                  <tr key={idx}>
                    <td className={`border-l-2 border-r-2 ${BORDER} px-2 py-2 text-sm`}>{r.desc}</td>
                    <td className={`border-l-2 border-r-2 ${BORDER} px-2 py-2 text-sm text-center`}>
                      {toBanglaDigit(r.qty)}
                    </td>
                    <td className={`border-l-2 border-r-2 ${BORDER} px-2 py-2 text-sm text-center`}>
                      {formatMoneyBn(r.rate)}
                    </td>
                    <td className={`border-l-2 border-r-2 ${BORDER} px-2 py-2 text-sm text-center`}>
                      {formatMoneyBn(r.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={`border-l-2 border-r-2 border-b-2 ${BORDER} px-3 py-8 text-center text-gray-500`}>
                    কোনো আইটেম পাওয়া যায়নি
                  </td>
                </tr>
              )}

              <tr>
                <td colSpan={4} className={`border-b-2 ${BORDER}`} style={{ height: 1 }} />
              </tr>
            </tbody>
          </table>

          <div className="mt-3 flex flex-wrap justify-end gap-4 text-xs font-extrabold">
            <span>
              মোট পরিমাণ: <b className={TEXT}>{toBanglaDigit(totalQty)}</b>
            </span>
            <span>
              মোট টাকা: <b className={TEXT}>{formatMoneyBn(sale?.grand_total)}</b>
            </span>
            <span>
              পরিশোধ: <b className={TEXT}>{formatMoneyBn(sale?.paid_amount)}</b>
            </span>
            <span>
              বকেয়া: <b className={TEXT}>{formatMoneyBn(sale?.due_amount)}</b>
            </span>
          </div>

          <div className="mt-2 text-[11px] text-gray-700">
            সময়: {formatDateTimeBn(sale?.created_at)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-box">
      {/* ✅ Print CSS: prints ONLY #printPad */}
      <style>{`
        /* screen default */
        #printPad { display: none; }

        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          html, body { height: auto !important; }
          body { margin: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body * { visibility: hidden !important; }
          #printPad, #printPad * { visibility: visible !important; }

          #printPad {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            background: #fff !important;
            padding: 0 !important;
          }

          #printPad .pad-border {
            max-width: 190mm !important;
            margin: 0 auto !important;
            border: 2px solid ${MB_DARK} !important;
            padding: 16px !important;
            min-height: 277mm !important;
            display: flex !important;
            flex-direction: column !important;
          }

          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header Actions */}
      <div className="p-5 border-b border-gray-200 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href={route("sales.index")} className="btn btn-ghost btn-sm btn-circle">
                <ArrowLeft size={16} />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Sale Invoice (Pad)</h1>
            </div>
            <p className="text-gray-600">
              Invoice #:{" "}
              <span className="font-mono font-semibold">{toBanglaDigit(memoNo)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="btn text-white btn-sm"
              style={{ background: MB_GRADIENT }}
              disabled={isPrinting}
            >
              <Printer size={16} />
              Print
              {isPrinting && <span className="loading loading-spinner loading-xs ml-2"></span>}
            </button>

            <button
              onClick={handleDownload}
              className="btn btn-outline btn-sm"
              disabled={isPrinting}
            >
              <Download size={16} />
              Download PDF
              {isPrinting && <span className="loading loading-spinner loading-xs ml-2"></span>}
            </button>
          </div>
        </div>
      </div>

      {/* Screen Preview */}
      <div className="p-5 bg-gray-50 no-print">
        <div className="mx-auto max-w-[860px] bg-white">
          <InvoicePad />
        </div>
      </div>

      {/* ✅ PRINT ONLY */}
      <div id="printPad">
        <div className="mx-auto max-w-[860px] bg-white">
          <InvoicePad isPrint />
        </div>
      </div>
    </div>
  );
}
