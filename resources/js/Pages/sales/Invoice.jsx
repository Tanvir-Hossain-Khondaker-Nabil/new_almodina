import React, { useMemo, useState } from "react";
import { usePage, Link } from "@inertiajs/react";
import { Printer, Download, ArrowLeft } from "lucide-react";

export default function Invoice({ sale }) {
  const { auth } = usePage().props;
  const [isPrinting, setIsPrinting] = useState(false);

  // ======= Bangla Helpers =======
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

  const items = useMemo(() => sale?.items || [], [sale]);

  const totalQty = useMemo(
    () => items.reduce((sum, it) => sum + Number(it?.quantity || 0), 0),
    [items]
  );

  // ===== আল-মদিনা স্টোর Theme =====
  const MB_DARK = "rgb(15, 45, 26)";
  const MB_LIGHT = "rgb(30, 77, 43)";
  const MB_GRADIENT =
    "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";

  // ======= Dynamic Header Data =======
  const STORE_NAME = sale?.creator?.business?.name || "আল-মদিনা স্টোর";
  const OWNER_NAME = "প্রোঃ মোঃ সবুজ হোসেন";
  const STORE_NOTE =
    "এখানে বেবী ফুডস, মুদি মালামাল, কসমেটিকস সামগ্রী সুলভ মূল্যে ক্রয়-বিক্রয় করা হয়। বিশেষ অর্ডারে সকল ধরনের কেক পাওয়া যায় এবং অর্ডার নেয়া হয়।";

  const STORE_ADDRESS =
    sale?.creator?.business?.address ||
    "নেভী চেকপোস্ট, খালিশপুর, খুলনা";

  const STORE_PHONE = sale?.creator?.business?.phone || "০১৬৭৪-০০৭৪৭২";

  const customerName =
    sale?.customer?.customer_name || sale?.customer?.name || "Walk-in Customer";

  const customerAddress =
    sale?.customer?.address || sale?.customer?.customer_address || "";

  const memoNo = sale?.invoice_no || sale?.id || "";
  const invoiceDate = formatDateBn(sale?.created_at);

  // ======= Table Rows =======
  const tableRows = items.map((item) => {
    const desc =
      item?.product?.name || item?.product_name || item?.description || "N/A";

    const qty = Number(item?.quantity || 0);
    const rate = Number(item?.unit_price || 0);
    const amount = Number(item?.total_price || 0);

    return { desc, qty, rate, amount };
  });

  // ======= Print (ONLY window.print) =======
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

  const BorderColor = "border-[#0f2d1a]";
  const TextColor = "text-[#1e4d2b]";
  const DottedBorder = "border-dotted border-[#0f2d1a]";

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
      {/* ✅ Print CSS: print ONLY #printPad */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          html, body { height: auto !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

          body * { visibility: hidden !important; }
          #printPad, #printPad * { visibility: visible !important; }

          #printPad {
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

          #printPad .print-down{
            margin-top: auto !important;
          }
        }
      `}</style>

      {/* Header Actions */}
      <div className="flex justify-between items-center p-6 border-b no-print">
        <Link href={route("sales.index")} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} />
          Back to Sales
        </Link>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="btn text-white btn-sm"
            style={{ background: MB_GRADIENT }}
            disabled={isPrinting}
          >
            <Printer size={16} />
            Print
            {isPrinting && (
              <span className="loading loading-spinner loading-xs ml-2"></span>
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            className="btn btn-outline btn-sm"
            disabled={isPrinting}
          >
            <Download size={16} />
            PDF
            {isPrinting && (
              <span className="loading loading-spinner loading-xs ml-2"></span>
            )}
          </button>
        </div>
      </div>

      {/* Screen Preview */}
      <div className="p-6 bg-gray-50 no-print">
        <div className="mx-auto max-w-[860px] bg-white">
          <div className={`border-2 ${BorderColor} p-4`}>
            {/* Title with gradient text */}
            <div
              className="text-center text-[34px] sm:text-[38px] font-extrabold leading-tight"
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

            <div className="text-center text-xs sm:text-sm font-bold mt-2">
              {STORE_ADDRESS}
            </div>
            <div className="text-center text-xs sm:text-sm font-semibold mt-1">
              মোবাঃ {STORE_PHONE}
            </div>

            {/* dotted fields */}
            <div className="mt-3 space-y-2 text-sm font-bold">
              <div className="grid grid-cols-[42px_1fr_38px_1fr] gap-2 items-end">
                <div>নং-</div>
                <div className="flex items-end gap-2">
                  <span className="text-xs font-semibold">
                    {toBanglaDigit(memoNo)}
                  </span>
                  <span className={`flex-1 border-b-2 ${DottedBorder} h-4`} />
                </div>
                <div>তারিখ</div>
                <div className="flex items-end gap-2">
                  <span className="text-xs font-semibold">{invoiceDate}</span>
                  <span className={`flex-1 border-b-2 ${DottedBorder} h-4`} />
                </div>
              </div>

              <div className="grid grid-cols-[42px_1fr] gap-2 items-end">
                <div>নাম</div>
                <div className="flex items-end gap-2">
                  <span className="text-xs font-semibold">{customerName}</span>
                  <span className={`flex-1 border-b-2 ${DottedBorder} h-4`} />
                </div>
              </div>

              <div className="grid grid-cols-[42px_1fr] gap-2 items-end">
                <div>ঠিকানা</div>
                <div className="flex items-end gap-2">
                  <span className="text-xs font-semibold">
                    {customerAddress}
                  </span>
                  <span className={`flex-1 border-b-2 ${DottedBorder} h-4`} />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr>
                    <th
                      className={`border-2 ${BorderColor} font-extrabold text-sm py-2 w-[55%]`}
                      style={{ color: MB_LIGHT }}
                    >
                      বিবরণ
                    </th>
                    <th
                      className={`border-2 ${BorderColor} font-extrabold text-sm py-2 w-[15%]`}
                      style={{ color: MB_LIGHT }}
                    >
                      পরিমাণ
                    </th>
                    <th
                      className={`border-2 ${BorderColor} font-extrabold text-sm py-2 w-[15%]`}
                      style={{ color: MB_LIGHT }}
                    >
                      দর
                    </th>
                    <th
                      className={`border-2 ${BorderColor} font-extrabold text-sm py-2 w-[15%]`}
                      style={{ color: MB_LIGHT }}
                    >
                      টাকা
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length ? (
                    tableRows.map((r, idx) => (
                      <tr key={idx}>
                        <td className={`border-l-2 border-r-2 ${BorderColor} px-2 py-2 text-sm`}>
                          {r.desc}
                        </td>
                        <td className={`border-l-2 border-r-2 ${BorderColor} px-2 py-2 text-sm text-center`}>
                          {toBanglaDigit(r.qty)}
                        </td>
                        <td className={`border-l-2 border-r-2 ${BorderColor} px-2 py-2 text-sm text-center`}>
                          {formatMoneyBn(r.rate)}
                        </td>
                        <td className={`border-l-2 border-r-2 ${BorderColor} px-2 py-2 text-sm text-center`}>
                          {formatMoneyBn(r.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className={`border-l-2 border-r-2 border-b-2 ${BorderColor} px-3 py-8 text-center text-gray-500`}
                      >
                        কোনো আইটেম পাওয়া যায়নি
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td colSpan={4} className={`border-b-2 ${BorderColor}`} style={{ height: 1 }} />
                  </tr>
                </tbody>
              </table>

              {/* totals */}
              <div className="mt-3 flex flex-wrap justify-end gap-4 text-xs font-extrabold">
                <span>
                  মোট পরিমাণ:{" "}
                  <b className={TextColor}>{toBanglaDigit(totalQty)}</b>
                </span>
                <span>
                  মোট টাকা:{" "}
                  <b className={TextColor}>{formatMoneyBn(sale?.grand_total)}</b>
                </span>
                <span>
                  পরিশোধ:{" "}
                  <b className={TextColor}>{formatMoneyBn(sale?.paid_amount)}</b>
                </span>
                <span>
                  বকেয়া:{" "}
                  <b className={TextColor}>{formatMoneyBn(sale?.due_amount)}</b>
                </span>
              </div>

              <div className="mt-2 text-[11px] text-gray-700">
                সময়: {formatDateTimeBn(sale?.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT ONLY */}
      <div id="printPad" className="hidden print:block">
        <div className="pad-border border-2 border-[#0f2d1a] p-4">
          <div
            className="text-center text-[34px] font-extrabold leading-tight"
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

          <div className="text-center text-xs leading-relaxed mt-2 px-1">
            {STORE_NOTE}
          </div>

          <div className="text-center text-xs font-bold mt-2">
            {STORE_ADDRESS}
          </div>
          <div className="text-center text-xs font-semibold mt-1">
            মোবাঃ {STORE_PHONE}
          </div>

          <div className="mt-3 space-y-2 text-sm font-bold">
            <div className="grid grid-cols-[42px_1fr_38px_1fr] gap-2 items-end">
              <div>নং-</div>
              <div className="flex items-end gap-2">
                <span className="text-xs font-semibold">
                  {toBanglaDigit(memoNo)}
                </span>
                <span className={`flex-1 border-b-2 ${DottedBorder} h-4`} />
              </div>
              <div>তারিখ</div>
              <div className="flex items-end gap-2">
                <span className="text-xs font-semibold">{invoiceDate}</span>
                <span className={`flex-1 border-b-2 ${DottedBorder} h-4`} />
              </div>
            </div>

            <div className="grid grid-cols-[42px_1fr] gap-2 items-end">
              <div>নাম</div>
              <div className="flex items-end gap-2">
                <span className="text-xs font-semibold">{customerName}</span>
                <span className={`flex-1 border-b-2 ${DottedBorder} h-4`} />
              </div>
            </div>

            <div className="grid grid-cols-[42px_1fr] gap-2 items-end">
              <div>ঠিকানা</div>
              <div className="flex items-end gap-2">
                <span className="text-xs font-semibold">{customerAddress}</span>
                <span className={`flex-1 border-b-2 ${DottedBorder} h-4`} />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr>
                  <th
                    className={`border-2 ${BorderColor} font-extrabold text-sm py-2 w-[55%]`}
                    style={{ color: MB_LIGHT }}
                  >
                    বিবরণ
                  </th>
                  <th
                    className={`border-2 ${BorderColor} font-extrabold text-sm py-2 w-[15%]`}
                    style={{ color: MB_LIGHT }}
                  >
                    পরিমাণ
                  </th>
                  <th
                    className={`border-2 ${BorderColor} font-extrabold text-sm py-2 w-[15%]`}
                    style={{ color: MB_LIGHT }}
                  >
                    দর
                  </th>
                  <th
                    className={`border-2 ${BorderColor} font-extrabold text-sm py-2 w-[15%]`}
                    style={{ color: MB_LIGHT }}
                  >
                    টাকা
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length ? (
                  tableRows.map((r, idx) => (
                    <tr key={idx}>
                      <td className={`border-l-2 border-r-2 ${BorderColor} px-2 py-2 text-sm`}>
                        {r.desc}
                      </td>
                      <td className={`border-l-2 border-r-2 ${BorderColor} px-2 py-2 text-sm text-center`}>
                        {toBanglaDigit(r.qty)}
                      </td>
                      <td className={`border-l-2 border-r-2 ${BorderColor} px-2 py-2 text-sm text-center`}>
                        {formatMoneyBn(r.rate)}
                      </td>
                      <td className={`border-l-2 border-r-2 ${BorderColor} px-2 py-2 text-sm text-center`}>
                        {formatMoneyBn(r.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className={`border-l-2 border-r-2 border-b-2 ${BorderColor} px-3 py-8 text-center text-gray-500`}
                    >
                      কোনো আইটেম পাওয়া যায়নি
                    </td>
                  </tr>
                )}

                <tr>
                  <td colSpan={4} className={`border-b-2 ${BorderColor}`} style={{ height: 1 }} />
                </tr>
              </tbody>
            </table>

            <div className="mt-3 flex flex-wrap justify-end gap-4 text-xs font-extrabold">
              <span>
                মোট পরিমাণ: <b className={TextColor}>{toBanglaDigit(totalQty)}</b>
              </span>
              <span>
                মোট টাকা: <b className={TextColor}>{formatMoneyBn(sale?.grand_total)}</b>
              </span>
              <span>
                পরিশোধ: <b className={TextColor}>{formatMoneyBn(sale?.paid_amount)}</b>
              </span>
              <span>
                বকেয়া: <b className={TextColor}>{formatMoneyBn(sale?.due_amount)}</b>
              </span>
            </div>

            <div className="mt-2 text-[11px] text-gray-700">
              সময়: {formatDateTimeBn(sale?.created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
