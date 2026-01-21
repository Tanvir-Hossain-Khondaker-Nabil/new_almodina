import { router, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import { useMemo, useState } from "react";

export default function PurchaseShow({ purchase, isShadowUser }) {
  const { auth } = usePage().props;
  const { locale } = useTranslation();
  const [isPrinting, setIsPrinting] = useState(false);

  const safeItems = useMemo(() => purchase?.items || [], [purchase]);

  // ========= Bangla Helpers (always Bangla for date/price/qty) =========
  const toBanglaDigit = (value) => {
    const map = { 0: "০", 1: "১", 2: "২", 3: "৩", 4: "৪", 5: "৫", 6: "৬", 7: "৭", 8: "৮", 9: "৯" };
    return String(value ?? "").replace(/\d/g, (d) => map[d]);
  };

  const formatMoneyBn = (num) => {
    const n = Number(num || 0);
    const s = new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
    return toBanglaDigit(s);
  };

  const formatNumberBn = (num) => {
    const n = Number(num || 0);
    const s = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(n);
    return toBanglaDigit(s);
  };

  const formatDateBn = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear());
    return toBanglaDigit(`${dd}/${mm}/${yy}`);
  };

  const formatDateTimeBn = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear());
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return toBanglaDigit(`${dd}/${mm}/${yy} ${hh}:${mi}`);
  };

  // Shadow price support
  const getPrice = (item, field) => {
    if (!item) return 0;
    if (isShadowUser) {
      if (field === "unit_price") return item.shadow_unit_price ?? item.unit_price ?? 0;
      if (field === "total_price") return item.shadow_total_price ?? item.total_price ?? 0;
    }
    return item[field] ?? 0;
  };

  const getPurchaseAmount = (field) => {
    if (!purchase) return 0;
    if (isShadowUser) {
      if (field === "grand_total") return purchase.shadow_grand_total ?? purchase.grand_total ?? 0;
      if (field === "paid_amount") return purchase.shadow_paid_amount ?? purchase.paid_amount ?? 0;
      if (field === "due_amount") return purchase.shadow_due_amount ?? purchase.due_amount ?? 0;
    }
    return purchase[field] ?? 0;
  };

  const totalQty = useMemo(
    () => safeItems.reduce((s, it) => s + Number(it?.quantity || 0), 0),
    [safeItems]
  );

  // ========= আল-মদিনা স্টোর Theme =========
  const MB_DARK = "rgb(15, 45, 26)";
  const MB_LIGHT = "rgb(30, 77, 43)";
  const MB_GRADIENT = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

  const BORDER = "border-[#0f2d1a]";
  const TEXT = "text-[#1e4d2b]";
  const DOTTED = `border-dotted ${BORDER}`;

  // ====== Header content (Pad style) ======
  const STORE_NAME = "আল-মদিনা স্টোর";
  const OWNER_NAME = "প্রোঃ মোঃ সবুজ হোসেন";
  const STORE_NOTE =
    "এখানে বেবী ফুডস, মুদি মালামাল, কসমেটিকস সামগ্রী সুলভ মূল্যে ক্রয়-বিক্রয় করা হয়। বিশেষ অর্ডারে সকল ধরনের কেক পাওয়া যায় এবং অর্ডার নেয়া হয়।";

  const customerName =
    purchase?.supplier?.company ||
    purchase?.supplier?.name ||
    purchase?.supplier?.contact_person ||
    "";

  const customerAddress =
    purchase?.supplier?.address ||
    purchase?.warehouse?.address ||
    "";

  const memoNo = purchase?.purchase_no || purchase?.id || "";
  const invoiceDate = formatDateBn(purchase?.purchase_date);

  const rows = useMemo(() => {
    return safeItems.map((item) => {
      const desc = item?.product?.name || item?.product_name || item?.description || "N/A";
      const qty = Number(item?.quantity || 0);
      const rate = Number(getPrice(item, "unit_price") || 0);
      const amount = Number(getPrice(item, "total_price") || 0);
      return { desc, qty, rate, amount };
    });
  }, [safeItems, isShadowUser]);

  const totals = useMemo(() => {
    const grandTotal = Number(getPurchaseAmount("grand_total") || 0);
    const paid = Number(getPurchaseAmount("paid_amount") || 0);
    const due = grandTotal - paid;
    return { grandTotal, paid, due };
  }, [purchase, isShadowUser]);

  // ========= Print (ONLY window.print) =========
  const handlePrint = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setTimeout(() => setIsPrinting(false), 400);
      }, 80);
    });
  };

  const handleDownloadPDF = () => handlePrint();

  // ========= Same pad used for screen + print =========
  const InvoicePad = ({ isPrint = false } = {}) => (
    <div className={`pad-border border-2 ${BORDER} p-3 sm:p-4`}>
      <div
        className={`text-center ${isPrint ? "text-[34px]" : "text-[34px] sm:text-[38px]"} font-extrabold leading-tight`}
        style={{
          background: MB_GRADIENT,
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        {STORE_NAME}
      </div>

      <div className="text-center mt-2">
        <span
          className="inline-block text-white px-4 py-1 rounded-full text-sm font-bold"
          style={{ background: MB_GRADIENT }}
        >
          {OWNER_NAME}
        </span>
      </div>

      <div className="text-center text-xs sm:text-sm leading-relaxed mt-2 px-1">
        {STORE_NOTE}
      </div>

      <div className="text-center text-xs sm:text-sm font-semibold mt-2">
        {purchase?.warehouse?.name ? `${purchase.warehouse.name} — ` : ""}
        {purchase?.warehouse?.address || ""}
      </div>

      {/* dotted fields */}
      <div className="mt-3 space-y-2 text-sm font-semibold">
        <div className="grid grid-cols-[42px_1fr_38px_1fr] gap-2 items-end">
          <div>নং-</div>
          <div className="flex items-end gap-2">
            <span className="text-xs font-medium">{toBanglaDigit(memoNo)}</span>
            <span className={`flex-1 border-b-2 border-dotted ${BORDER} h-4`} />
          </div>
          <div>তারিখ</div>
          <div className="flex items-end gap-2">
            <span className="text-xs font-medium">{invoiceDate}</span>
            <span className={`flex-1 border-b-2 border-dotted ${BORDER} h-4`} />
          </div>
        </div>

        <div className="grid grid-cols-[42px_1fr] gap-2 items-end">
          <div>নাম</div>
          <div className="flex items-end gap-2">
            <span className="text-xs font-medium">{customerName}</span>
            <span className={`flex-1 border-b-2 border-dotted ${BORDER} h-4`} />
          </div>
        </div>

        <div className="grid grid-cols-[42px_1fr] gap-2 items-end">
          <div>ঠিকানা</div>
          <div className="flex items-end gap-2">
            <span className="text-xs font-medium">{customerAddress}</span>
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
            {rows.length ? (
              rows.map((r, idx) => (
                <tr key={idx}>
                  <td className={`border-l-2 border-r-2 ${BORDER} px-2 py-2 text-sm`}>
                    {r.desc}
                  </td>
                  <td className={`border-l-2 border-r-2 ${BORDER} px-2 py-2 text-sm text-center`}>
                    {formatNumberBn(r.qty)}
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
                <td
                  colSpan={4}
                  className={`border-l-2 border-r-2 border-b-2 ${BORDER} px-3 py-8 text-center text-gray-500`}
                >
                  কোনো আইটেম পাওয়া যায়নি
                </td>
              </tr>
            )}

            <tr>
              <td colSpan={4} className={`border-b-2 ${BORDER}`} style={{ height: 1 }} />
            </tr>
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-3 flex flex-wrap justify-end gap-4 text-xs font-bold">
          <span>
            মোট পরিমাণ:{" "}
            <b className={TEXT}>{formatNumberBn(totalQty)}</b>
          </span>
          <span>
            মোট টাকা:{" "}
            <b className={TEXT}>{formatMoneyBn(totals.grandTotal)}</b>
          </span>
          <span>
            পরিশোধ:{" "}
            <b className={TEXT}>{formatMoneyBn(totals.paid)}</b>
          </span>
          <span>
            বকেয়া:{" "}
            <b className={TEXT}>{formatMoneyBn(totals.due)}</b>
          </span>
        </div>

        <div className="mt-2 text-[11px] text-gray-700">
          সময়: {formatDateTimeBn(purchase?.purchase_date || purchase?.created_at)}
        </div>

        {purchase?.notes && (
          <div className="mt-2 text-xs text-gray-700">
            <b>নোট:</b> {purchase.notes}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* ✅ Print CSS: print ONLY #printPad */}
      <style>{`
        /* screen default */
        #printPad { display: none; }

        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          html, body { height: auto !important; }
          body {
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

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
          }

          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }

          .no-print { display: none !important; }
        }
      `}</style>

      {/* Actions */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Purchase Invoice (Pad Style)
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              নং: <span className="font-semibold">{toBanglaDigit(memoNo)}</span> • তারিখ:{" "}
              <span className="font-semibold">{invoiceDate}</span>
              {isShadowUser && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                  Shadow
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.visit(route("purchase.list"))}
              className="btn btn-sm btn-ghost border border-gray-300"
            >
              <ArrowLeft size={15} className="mr-1" />
              Back
            </button>

            <button
              onClick={handlePrint}
              className="btn btn-sm text-white"
              style={{ background: MB_GRADIENT }}
              disabled={isPrinting}
            >
              <Printer size={15} className="mr-1" />
              Print
              {isPrinting && (
                <span className="loading loading-spinner loading-xs ml-2"></span>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              className="btn btn-sm text-white"
              style={{ background: MB_GRADIENT }}
              disabled={isPrinting}
            >
              <Download size={15} className="mr-1" />
              PDF
              {isPrinting && (
                <span className="loading loading-spinner loading-xs ml-2"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Screen invoice preview (same style) */}
      <div className="mx-auto max-w-[860px] bg-white shadow-sm rounded-lg border no-print">
        <div className="p-4 sm:p-6">
          <InvoicePad />
        </div>
      </div>

      {/* ✅ PRINT ONLY (same design) */}
      <div id="printPad">
        <div className="mx-auto max-w-[860px] bg-white">
          <InvoicePad isPrint />
        </div>
      </div>
    </div>
  );
}
