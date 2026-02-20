import { router, usePage } from "@inertiajs/react";
import { ArrowLeft, Printer, Download, SlidersHorizontal, X, Check } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * ✅ PurchaseShow (2 invoice designs)
 * - Default: Design-1 (your first one)
 * - Right side floating icon (PORTAL to body) opens sidebar
 * - User selects invoice design
 * - Persist via localStorage + cookie
 * - Design-1 print: prints #invoiceArea only
 * - Design-2 print: prints #printPad only
 */
export default function PurchaseShow({ purchase, isShadowUser, businessProfile }) {
  const { auth } = usePage().props;
  const [isPrinting, setIsPrinting] = useState(false);

  // =========================
  // ✅ Persisted invoice type
  // =========================
  const STORAGE_KEY = "purchase_invoice_design";
  const COOKIE_KEY = "purchase_invoice_design";

  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const setCookie = (name, value, days = 30) => {
    if (typeof document === "undefined") return;
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/`;
  };

  const readPersistedDesign = () => {
    try {
      const ls = localStorage.getItem(STORAGE_KEY);
      if (ls === "1" || ls === "2") return ls;
    } catch (_) {}
    const ck = getCookie(COOKIE_KEY);
    if (ck === "1" || ck === "2") return ck;
    return "1"; // default
  };

  const [invoiceDesign, setInvoiceDesign] = useState("1");

  useEffect(() => {
    setInvoiceDesign(readPersistedDesign());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistDesign = (value) => {
    setInvoiceDesign(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (_) {}
    setCookie(COOKIE_KEY, value, 30);
  };

  // =========================
  // ✅ Sidebar states
  // =========================
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeSidebar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // =========================
  // ✅ Business profile (shared)
  // =========================
  const resolveAssetUrl = (path) => {
    if (!path) return "";
    if (typeof path !== "string") return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    if (path.startsWith("/")) return path;
    return `/storage/${path}`;
  };

  const profile = businessProfile || null;

  const companyName = profile?.name || "Business Name";
  const companyEmail = profile?.email || "mail@example.com";
  const companyPhone = profile?.phone || "০১৬******৮৮";
  const companyAddr = profile?.address || "Address";
  const companyWebsite = profile?.website || "";

  const companyLogo =
    resolveAssetUrl(profile?.logo) ||
    resolveAssetUrl(profile?.thum) ||
    "/media/uploads/logo.png";

  // =========================
  // ✅ Design-1 helpers
  // =========================
  const formatCurrency = (amount) => {
    const n = Number(amount || 0);
    return n.toFixed(2);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getPrice = (item, field) => {
    if (isShadowUser) {
      switch (field) {
        case "unit_price":
          return item.shadow_unit_price;
        case "total_price":
          return item.shadow_total_price;
        case "sale_price":
          return item.shadow_sale_price;
        default:
          return item[field];
      }
    }
    return item[field];
  };

  const getPurchaseAmount = (field) => {
    if (isShadowUser) {
      switch (field) {
        case "grand_total":
          return purchase.shadow_grand_total;
        case "paid_amount":
          return purchase.shadow_paid_amount;
        case "due_amount":
          return purchase.shadow_due_amount;
        default:
          return purchase[field];
      }
    }
    return purchase[field];
  };

  const totalQty = useMemo(() => {
    return purchase.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) || 0;
  }, [purchase]);

  const getVariantDisplayName = (variant) => {
    if (variant?.attribute_values && typeof variant.attribute_values === "object") {
      return Object.values(variant.attribute_values).join(", ");
    }
    return variant?.attribute_values || "N/A";
  };

  const getBrandName = (item) => {
    return item.product?.brand?.name || item.brand?.name || item.product?.brand || "N/A";
  };

  const getProductDisplayName = (item) => item.product?.name || "N/A";
  const getProductCode = (item) => item.product?.product_no || item.product_id || "N/A";

  const items = purchase.items || [];

  // ✅ Print Design-1 (invoiceArea only)
  const handlePrintDesign1 = () => {
    const printContents = document.getElementById("invoiceArea")?.innerHTML;
    if (!printContents) return;

    const originalContents = document.body.innerHTML;

    document.body.innerHTML = `
      <html>
      <head>
        <title>Purchase Invoice Print</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { background: white; }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>${printContents}</body>
      </html>
    `;

    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // =========================
  // ✅ Design-2 (Pad style) helpers
  // =========================
  const safeItems = useMemo(() => purchase?.items || [], [purchase]);

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

  const totalQty2 = useMemo(
    () => safeItems.reduce((s, it) => s + Number(it?.quantity || 0), 0),
    [safeItems]
  );

  const getPrice2 = (item, field) => {
    if (!item) return 0;
    if (isShadowUser) {
      if (field === "unit_price") return item.shadow_unit_price ?? item.unit_price ?? 0;
      if (field === "total_price") return item.shadow_total_price ?? item.total_price ?? 0;
    }
    return item[field] ?? 0;
  };

  const getPurchaseAmount2 = (field) => {
    if (!purchase) return 0;
    if (isShadowUser) {
      if (field === "grand_total") return purchase.shadow_grand_total ?? purchase.grand_total ?? 0;
      if (field === "paid_amount") return purchase.shadow_paid_amount ?? purchase.paid_amount ?? 0;
      if (field === "due_amount") return purchase.shadow_due_amount ?? purchase.due_amount ?? 0;
    }
    return purchase[field] ?? 0;
  };

  const rows2 = useMemo(() => {
    return safeItems.map((item) => {
      const desc = item?.product?.name || item?.product_name || item?.description || "N/A";
      const qty = Number(item?.quantity || 0);
      const rate = Number(getPrice2(item, "unit_price") || 0);
      const amount = Number(getPrice2(item, "total_price") || 0);
      return { desc, qty, rate, amount };
    });
  }, [safeItems, isShadowUser]);

  const totals2 = useMemo(() => {
    const grandTotal = Number(getPurchaseAmount2("grand_total") || 0);
    const paid = Number(getPurchaseAmount2("paid_amount") || 0);
    const due = grandTotal - paid;
    return { grandTotal, paid, due };
  }, [purchase, isShadowUser]);

  // Theme constants (Design-2)
  const MB_DARK = "rgb(15, 45, 26)";
  const MB_LIGHT = "rgb(30, 77, 43)";
  const MB_GRADIENT = "linear-gradient(rgb(15, 45, 26) 0%, rgb(30, 77, 43) 100%)";
  const BORDER = "border-[#0f2d1a]";
  const TEXT = "text-[#1e4d2b]";

  // Pad header (Design-2 static)
  const STORE_NAME = "Al Modina";
  const OWNER_NAME = "প্রোঃ মোঃ সবুজ হোসেন";
  const STORE_NOTE =
    "এখানে বেবী ফুডস, মুদি মালামাল, কসমেটিকস সামগ্রী সুলভ মূল্যে ক্রয়-বিক্রয় করা হয়। বিশেষ অর্ডারে সকল ধরনের কেক পাওয়া যায় এবং অর্ডার নেয়া হয়।";

  const customerName =
    purchase?.supplier?.company ||
    purchase?.supplier?.name ||
    purchase?.supplier?.contact_person ||
    "";

  const customerAddress = purchase?.supplier?.address || purchase?.warehouse?.address || "";

  const memoNo = purchase?.purchase_no || purchase?.id || "";
  const invoiceDate2 = formatDateBn(purchase?.purchase_date);

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

      <div className="text-center text-xs sm:text-sm leading-relaxed mt-2 px-1">{STORE_NOTE}</div>

      <div className="text-center text-xs sm:text-sm font-semibold mt-2">
        {purchase?.warehouse?.name ? `${purchase.warehouse.name} — ` : ""}
        {purchase?.warehouse?.address || ""}
      </div>

      <div className="mt-3 space-y-2 text-sm font-semibold">
        <div className="grid grid-cols-[42px_1fr_38px_1fr] gap-2 items-end">
          <div>নং-</div>
          <div className="flex items-end gap-2">
            <span className="text-xs font-medium">{toBanglaDigit(memoNo)}</span>
            <span className={`flex-1 border-b-2 border-dotted ${BORDER} h-4`} />
          </div>
          <div>তারিখ</div>
          <div className="flex items-end gap-2">
            <span className="text-xs font-medium">{invoiceDate2}</span>
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
            {rows2.length ? (
              rows2.map((r, idx) => (
                <tr key={idx}>
                  <td className={`border-l-2 border-r-2 ${BORDER} px-2 py-2 text-sm`}>{r.desc}</td>
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

        <div className="mt-3 flex flex-wrap justify-end gap-4 text-xs font-bold">
          <span>
            মোট পরিমাণ: <b className={TEXT}>{formatNumberBn(totalQty2)}</b>
          </span>
          <span>
            মোট টাকা: <b className={TEXT}>{formatMoneyBn(totals2.grandTotal)}</b>
          </span>
          <span>
            পরিশোধ: <b className={TEXT}>{formatMoneyBn(totals2.paid)}</b>
          </span>
          <span>
            বকেয়া: <b className={TEXT}>{formatMoneyBn(totals2.due)}</b>
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

  const handlePrintDesign2 = () => {
    setIsPrinting(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setTimeout(() => setIsPrinting(false), 400);
      }, 80);
    });
  };

  // =========================
  // ✅ Print selection
  // =========================
  const handlePrint = () => {
    if (invoiceDesign === "2") return handlePrintDesign2();
    return handlePrintDesign1();
  };

  const handleDownloadPDF = () => handlePrint();

  // =========================
  // ✅ Floating button (Portal to body)
  // =========================
  function FloatingSettingsButton({ onClick }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(
      <button
        type="button"
        onClick={onClick}
        className="no-print fixed right-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-lg rounded-full w-11 h-11 flex items-center justify-center hover:bg-gray-50"
        style={{
          zIndex: 2147483647,
          pointerEvents: "auto",
        }}
        title="Invoice Settings"
      >
        <SlidersHorizontal size={18} />
      </button>,
      document.body
    );
  }

  // =========================
  // ✅ Sidebar / Drawer (Portal to body)
  // =========================
  function SidebarDrawer() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(
      <>
        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="no-print fixed inset-0 bg-black/40"
            style={{ zIndex: 2147483646 }}
            onClick={closeSidebar}
          />
        )}

        {/* Drawer */}
        <div
          className={`no-print fixed top-0 right-0 h-full w-[320px] bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ zIndex: 2147483647 }}
        >
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-gray-900">Invoice Settings</div>
              <div className="text-xs text-gray-500">Select invoice design (saved)</div>
            </div>
            <button
              type="button"
              onClick={closeSidebar}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <DesignCard
              title="Design 1 (Default)"
              desc="Standard A4 invoice"
              active={invoiceDesign === "1"}
              onSelect={() => persistDesign("1")}
            />
            <DesignCard
              title="Design 2 (Pad Style)"
              desc="Bangla pad invoice"
              active={invoiceDesign === "2"}
              onSelect={() => persistDesign("2")}
            />

            <div className="mt-4 p-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-600">
              ✅ Selected design is stored using <b>localStorage</b> and also written as a <b>cookie</b>.
              Next time you open this page, it will keep the same design.
            </div>
          </div>
        </div>
      </>,
      document.body
    );
  }

  function DesignCard({ title, desc, active, onSelect }) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left p-3 rounded-xl border transition ${
          active ? "border-green-600 bg-green-50" : "border-gray-200 hover:bg-gray-50"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-bold text-gray-900">{title}</div>
            <div className="text-xs text-gray-600 mt-1">{desc}</div>
          </div>
          {active ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">
              <Check size={16} /> Active
            </span>
          ) : (
            <span className="text-xs font-semibold text-gray-500">Select</span>
          )}
        </div>
      </button>
    );
  }

  // =========================
  // ✅ Design-1 UI (unchanged)
  // =========================
  const InvoiceDesign1 = () => (
    <div className="bg-gray-100 min-h-screen p-3">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      {/* Top actions (hidden on print) */}
      <div className="no-print mb-3 bg-white border border-gray-300 rounded-md p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <div className="font-semibold text-gray-800">Purchase Invoice: #{purchase.purchase_no}</div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>Date: {formatDate(purchase.purchase_date)}</span>
            {isShadowUser && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">Shadow Purchase</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.visit(route("purchase.list"))}
            className="btn btn-sm btn-ghost border border-gray-300"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to List
          </button>

          <button
            onClick={handlePrint}
            className="btn btn-sm bg-red-700 hover:bg-red-800 text-white"
            disabled={isPrinting}
          >
            <Printer size={16} className="mr-1" />
            Print
            {isPrinting && <span className="loading loading-spinner loading-xs ml-1"></span>}
          </button>

          <button
            onClick={handleDownloadPDF}
            className="btn btn-sm bg-gray-800 hover:bg-gray-900 text-white"
            disabled={isPrinting}
          >
            <Download size={16} className="mr-1" />
            Download
          </button>
        </div>
      </div>

      {/* Invoice Paper */}
      <div
        id="invoiceArea"
        className="bg-white border border-gray-400 mx-auto rounded-md shadow-sm relative overflow-hidden"
        style={{ maxWidth: "210mm" }}
      >
        {/* Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
          <div className="w-[200px] h-[200px] rounded-full border-[10px] border-red-700 flex items-center justify-center">
            <div className="text-[80px] font-black text-red-200">
              <img
                src={companyLogo}
                className="h-full w-full object-contain p-1"
                style={{ borderRadius: "50%" }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/media/uploads/logo.png";
                }}
                alt="Logo"
              />
            </div>
          </div>
        </div>

        <div className="relative p-4">
          {/* Header line */}
          <div className="flex items-start justify-between gap-4 border-b border-black pb-2">
            {/* Left brand */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-red-400 flex items-center justify-center">
                <img
                  src={companyLogo}
                  className="h-full w-full object-contain p-1"
                  style={{ borderRadius: "50%" }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/media/uploads/logo.png";
                  }}
                  alt="Company Logo"
                />
              </div>
              <div>
                <div className="text-xl font-black tracking-wide text-gray-900">{companyName}</div>
              </div>
            </div>

            {/* Offices */}
            <div className="flex gap-4 text-[10px] leading-4 text-gray-800">
              <div className="border-l border-gray-300 pl-3">
                <div className="font-bold text-red-700">অফিস</div>
                <div className="max-w-[240px]">{companyAddr}</div>
                <div>{companyPhone}</div>
                <div>{companyEmail}</div>
                {companyWebsite ? <div>{companyWebsite}</div> : null}
              </div>
            </div>
          </div>

          {/* Invoice Title row */}
          <div className="flex items-center justify-center py-2">
            <div className="px-4 py-1 border border-black text-[12px] font-bold uppercase tracking-wider">
              Purchase Invoice
            </div>
          </div>

          {/* Meta info grid */}
          <div className="grid grid-cols-2 gap-3 text-[10px] border-b border-gray-300 pb-2">
            <div className="space-y-1">
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Bill No</span>
                <span className="font-mono">#{purchase.purchase_no}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Purchase Date</span>
                <span>{formatDate(purchase.purchase_date)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Supplier</span>
                <span className="text-right">{purchase.supplier?.company || purchase.supplier?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Supplier Address</span>
                <span className="text-right">{purchase.supplier?.address || "N/A"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Reference No</span>
                <span>{purchase.reference_no || purchase.id}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Warehouse</span>
                <span>{purchase.warehouse?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Served By</span>
                <span>{purchase.created_by?.name || auth.user?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="font-semibold">Date & Time</span>
                <span>{formatDateTime(purchase.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-[10px] border border-black">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 w-[4%]">SL</th>
                  <th className="border border-black p-1 w-[10%]">Code</th>
                  <th className="border border-black p-1 text-left w-[30%]">Item Name</th>
                  <th className="border border-black p-1 text-left w-[16%]">Model / Variant</th>
                  <th className="border border-black p-1 w-[10%]">Brand</th>
                  <th className="border border-black p-1 w-[6%]">Qty</th>
                  <th className="border border-black p-1 w-[10%]">Unit Price</th>
                  <th className="border border-black p-1 w-[6%]">Add (5%)</th>
                  <th className="border border-black p-1 w-[8%]">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const unitPrice = Number(getPrice(item, "unit_price") || 0);
                  const totalPrice = Number(getPrice(item, "total_price") || 0);
                  const qty = Number(item.quantity || 0);
                  const addAmount = totalPrice - unitPrice * qty;

                  return (
                    <tr key={item.id || index}>
                      <td className="border border-black p-1 text-center">{index + 1}</td>
                      <td className="border border-black p-1 text-center font-mono">{getProductCode(item)}</td>
                      <td className="border border-black p-1">
                        <div className="font-semibold">{getProductDisplayName(item)}</div>
                        {item.variant?.sku && <div className="text-[9px] text-gray-600">SKU: {item.variant.sku}</div>}
                      </td>
                      <td className="border border-black p-1">{getVariantDisplayName(item.variant)}</td>
                      <td className="border border-black p-1 text-center">{getBrandName(item)}</td>
                      <td className="border border-black p-1 text-center font-bold">{item.quantity}</td>
                      <td className="border border-black p-1 text-right font-mono">{formatCurrency(unitPrice)}</td>
                      <td className="border border-black p-1 text-right font-mono">{formatCurrency(addAmount)}</td>
                      <td
                        className="border border-black p-1 text-right font-mono font-bold"
                        style={{ color: isShadowUser ? "#d97706" : "#1d4ed8" }}
                      >
                        {formatCurrency(totalPrice)}
                      </td>
                    </tr>
                  );
                })}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={9} className="border border-black p-3 text-center text-gray-600">
                      No items found in this purchase
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot>
                <tr>
                  <td colSpan={5} className="border border-black p-1 text-right font-bold">
                    Total Items: {items.length}
                  </td>
                  <td className="border border-black p-1 text-center font-bold">{totalQty}</td>
                  <td className="border border-black p-1"></td>
                  <td className="border border-black p-1"></td>
                  <td
                    className="border border-black p-1 text-right font-bold"
                    style={{ color: isShadowUser ? "#d97706" : "#1d4ed8" }}
                  >
                    {formatCurrency(getPurchaseAmount("grand_total"))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-[10px]">
            <div className="border border-gray-300 p-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total Items</span>
                <span className="font-mono">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Total Quantity</span>
                <span className="font-mono">{totalQty}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1">
                <span>Grand Total</span>
                <span className="font-mono" style={{ color: isShadowUser ? "#d97706" : "#1d4ed8" }}>
                  {formatCurrency(getPurchaseAmount("grand_total"))}
                </span>
              </div>
            </div>

            <div className="border border-gray-300 p-2">
              <div className="flex justify-between">
                <span className="font-semibold">Paid Amount</span>
                <span className="font-mono">{formatCurrency(getPurchaseAmount("paid_amount"))}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Due Amount</span>
                <span className="font-mono">
                  {formatCurrency(getPurchaseAmount("grand_total") - getPurchaseAmount("paid_amount"))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Payment Status</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    purchase.payment_status === "paid"
                      ? "bg-green-100 text-green-800"
                      : purchase.payment_status === "partial"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {purchase.payment_status?.toUpperCase() || "UNPAID"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-4 text-[10px]">
            <div className="text-center">
              <div className="border-t border-black pt-1 font-semibold">Checked By</div>
              <div className="text-[9px] text-gray-600">(Name, seal, time)</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1 font-semibold">Authorised</div>
              <div className="text-[9px] text-gray-600">(Signature & Seal)</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1 font-semibold">Received</div>
              <div className="text-[9px] text-gray-600">(Signature & Seal)</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1 font-semibold">Delivery By</div>
              <div className="text-[9px] text-gray-600">Software by TETRA SOFT</div>
              <div className="text-[9px] text-gray-600">Phone 01911-387001</div>
            </div>
          </div>

          <div className="mt-3 text-[9px] text-gray-600 flex justify-between border-t border-gray-300 pt-2">
            <div>
              <span>বিক্রয়িত পণ্য ১৫ দিনের মধ্যে ফেরত যোগ্য । পণ্য ফেরতের সময় অবশ্যই মেমোর ফটোকপি দিতে হবে</span>
            </div>
            <div>
              Powered by: Nexoryn
              <br />
            </div>
          </div>

          {purchase.notes && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-bold text-sm mb-2">Additional Notes</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{purchase.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // =========================
  // ✅ Design-2 UI
  // =========================
  const InvoiceDesign2 = () => (
    <div className="bg-gray-50 min-h-screen p-4">
      <style>{`
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

      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Purchase Invoice (Pad Style)</h1>
            <p className="text-sm text-gray-600 mt-1">
              নং: <span className="font-semibold">{toBanglaDigit(memoNo)}</span> • তারিখ:{" "}
              <span className="font-semibold">{invoiceDate2}</span>
              {isShadowUser && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Shadow</span>
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
              {isPrinting && <span className="loading loading-spinner loading-xs ml-2"></span>}
            </button>

            <button
              onClick={handleDownloadPDF}
              className="btn btn-sm text-white"
              style={{ background: MB_GRADIENT }}
              disabled={isPrinting}
            >
              <Download size={15} className="mr-1" />
              PDF
              {isPrinting && <span className="loading loading-spinner loading-xs ml-2"></span>}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[860px] bg-white shadow-sm rounded-lg border no-print">
        <div className="p-4 sm:p-6">
          <InvoicePad />
        </div>
      </div>

      <div id="printPad">
        <div className="mx-auto max-w-[860px] bg-white">
          <InvoicePad isPrint />
        </div>
      </div>
    </div>
  );

  // =========================
  // ✅ Render selected design
  // =========================
  return (
    <div className="relative">
      {/* ✅ Floating icon always visible (Portal + max z-index) */}
      <FloatingSettingsButton onClick={openSidebar} />
      <SidebarDrawer />

      {invoiceDesign === "2" ? <InvoiceDesign2 /> : <InvoiceDesign1 />}
    </div>
  );
}
