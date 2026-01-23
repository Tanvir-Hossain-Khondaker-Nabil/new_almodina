import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  X,
  LayoutDashboard,
  LogOut,
  User,
  Settings,
  Home,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  CreditCard,
  Building,
  FileText,
  Calendar,
  DollarSign,
  Award,
  Shield,
  Bell,
  HelpCircle,
  Search,
  Menu,
  ChevronRight,
  ArrowRightLeft,
  BadgeCent,
  BaggageClaim,
  BanknoteArrowUp,
  Barcode,
  Box,
  ShoppingBag,
  ShoppingBasket,
  UserPlus,
  WalletMinimal,
  Warehouse,
  Receipt,
  Trophy,
  TrendingUp,
  Gift,
  Star,
  BadgeDollarSign,
  Clock,
  Plane,
  BoxIcon,
  TagIcon,
  Store,
} from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

/** ---------------------------
 * Base Menu
 * --------------------------- */
const baseMenu = [
  { title: "Dashboard", icon: "home", route: "home", routeParams: null, active: "home", role: "all", category: "Main" },

  { title: "Add Sale (Inventory)", icon: "baggage-claim", route: "sales.create", routeParams: null, active: "sales.create", role: "all", category: "Sales" },
  { title: "Add Sale (POS)", icon: "baggage-claim", route: "sales.add", routeParams: null, active: "sales.add", role: "all", category: "Sales" },
  { title: "All Orders (Inventory)", icon: "badge-cent", route: "sales.index", routeParams: null, active: "sales.index", role: "all", category: "Sales" },
  { title: "All Orders (POS)", icon: "badge-cent", route: "salesPos.index", routeParams: { pos: "pos" }, active: "salesPos.index", role: "all", category: "Sales" },
  { title: "All Sales Items", icon: "badge-cent", route: "salesItems.list", routeParams: null, active: "salesItems.list", role: "all", category: "Sales" },
  { title: "All Sales Return", icon: "badge-cent", route: "salesReturn.list", routeParams: null, active: "salesReturn.list", role: "all", category: "Sales" },

  { title: "Purchase", icon: "receipt", route: "purchase.list", routeParams: null, active: "purchase.list", role: "all", category: "Purchase" },
  { title: "Add Purchase", icon: "arrow-right-left", route: "purchase.create", routeParams: null, active: "purchase.create", role: "all", category: "Purchase" },
  { title: "All Purchase Items", icon: "arrow-right-left", route: "purchase.items", routeParams: null, active: "purchase.items", role: "all", category: "Purchase" },

  { title: "Purchase Return", icon: "receipt", route: "purchase-return.list", routeParams: null, active: "purchase-return.list", role: "all", category: "Purchase" },
  { title: "Add Purchase Return", icon: "arrow-right-left", route: "purchase-return.create", routeParams: null, active: "purchase-return.create", role: "all", category: "Purchase" },

  { title: "Warehouse", icon: "warehouse", route: "warehouse.list", routeParams: null, active: "warehouse.list", role: "all", category: "Inventory" },
  { title: "Supplier", icon: "shopping-basket", route: "supplier.view", routeParams: null, active: "supplier.view", role: "all", category: "Inventory" },
  { title: "Attribute", icon: "shopping-basket", route: "attributes.index", routeParams: null, active: "attributes.index", role: "all", category: "Inventory" },
  { title: "Products", icon: "shopping-basket", route: "product.list", routeParams: null, active: "product.list", role: "all", category: "Inventory" },
  { title: "Add Products", icon: "shopping-bag", route: "product.add", routeParams: null, active: "product.add", role: "all", category: "Inventory" },
  { title: "Categories", icon: "box", route: "category.view", routeParams: null, active: "category.view", role: "all", category: "Inventory" },
  { title: "Brands", icon: "box", route: "brands.index", routeParams: null, active: "brands.index", role: "all", category: "Inventory" },

  { title: "Expense Category", icon: "banknote-arrow-up", route: "expenses.category", routeParams: null, active: "expenses.category", role: "all", category: "Finance" },
  { title: "Expense", icon: "wallet-minimal", route: "expenses.list", routeParams: null, active: "expenses.list", role: "all", category: "Finance" },
  { title: "Transactions", icon: "dollar-sign", route: "payments.index", routeParams: null, active: "payments.index", role: "all", category: "Finance" },
  { title: "Accounts", icon: "dollar-sign", route: "accounts.index", routeParams: null, active: "accounts.index", role: "all", category: "Finance" },
  { title: "Ledgers", icon: "box", route: "ledgers.index", routeParams: null, active: "ledgers.index", role: "all", category: "Finance" },

  // { title: "Dealerships", icon: "box", route: "dealerships.index", routeParams: null, active: "dealerships.index", role: "all", category: "Partners" },

  { title: "Users", icon: "user", route: "userlist.view", routeParams: null, active: "userlist.view", role: "all", category: "Admin" },
  { title: "Roles", icon: "user", route: "roles.index", routeParams: null, active: "roles.index", role: "all", category: "Admin" },


  { title: "Customer", icon: "user-plus", route: "customer.index", routeParams: null, active: "customer.index", role: "all", category: "CRM" },
  { title: "Companies", icon: "user-plus", route: "companies.index", routeParams: null, active: "companies.index", role: "all", category: "CRM" },

  { title: "Employees", icon: "users", route: "employees.index", routeParams: null, active: "employees.index", role: "all", category: "HR" },
  { title: "Attendance", icon: "calendar", route: "attendance.index", routeParams: null, active: "attendance.index", role: "all", category: "HR" },
  { title: "Salary", icon: "credit-card", route: "salary.index", routeParams: null, active: "salary.index", role: "all", category: "HR" },
  { title: "Allowances", icon: "trending-up", route: "allowances.index", routeParams: null, active: "allowances.index", role: "all", category: "HR" },
  { title: "Ranks", icon: "star", route: "ranks.index", routeParams: null, active: "ranks.index", role: "all", category: "HR" },
  { title: "Bonus", icon: "gift", route: "bonus.index", routeParams: null, active: "bonus.index", role: "all", category: "HR" },
  { title: "SMS", icon: "gift", route: "sms-templates.index", routeParams: null, active: "sms-templates.index", role: "all", category: "HR" },

  // { title: "Outlet", icon: "store", route: "outlets.index", routeParams: null, active: "outlets.index", role: "all", category: "Outlets" },
];

const iconComponents = {
  dashboard: LayoutDashboard,
  user: User,
  settings: Settings,
  home: Home,
  "shopping-cart": ShoppingCart,
  package: Package,
  users: Users,
  "bar-chart": BarChart3,
  "credit-card": CreditCard,
  building: Building,
  "file-text": FileText,
  calendar: Calendar,
  "dollar-sign": DollarSign,
  award: Award,
  shield: Shield,
  bell: Bell,
  "help-circle": HelpCircle,
  "arrow-right-left": ArrowRightLeft,
  "badge-cent": BadgeCent,
  "baggage-claim": BaggageClaim,
  "banknote-arrow-up": BanknoteArrowUp,
  barcode: Barcode,
  box: Box,
  "shopping-bag": ShoppingBag,
  "shopping-basket": ShoppingBasket,
  "user-plus": UserPlus,
  "wallet-minimal": WalletMinimal,
  warehouse: Warehouse,
  receipt: Receipt,
  trophy: Trophy,
  "trending-up": TrendingUp,
  gift: Gift,
  star: Star,
  "badge-dollar-sign": BadgeDollarSign,
  clock: Clock,
  plane: Plane,
  "box-icon": BoxIcon,
  "tag-icon": TagIcon,
  store: Store,
};

function safeRoute(name, params) {
  try {
    return params ? route(name, params) : route(name);
  } catch (e) {
    console.error(`Route error for ${name}`, e);
    return "#";
  }
}

/**
 * Smart dropdown behavior:
 * - Groups by category
 * - Auto opens the active category
 * - Accordion mode: only one category open at a time (configurable)
 * - Search expands categories that have matches
 * - Keyboard accessible (Enter/Space toggles)
 */
export default function Sidebar({ status, setStatus }) {
  const { auth, currentRoute } = usePage().props;
  const { t, locale } = useTranslation();
  const sidebarRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState({}); // { [category]: boolean }

  // ✅ SUPER ADMIN DETECT (from inertia share)
  const isSuperAdmin = !!auth?.user?.is_super_admin;
  // ✅ Outlet gate: super admin হলে outlet লাগবে না
  const isLoggedIntoOutlet = isSuperAdmin ? true : !!auth?.user?.is_logged_into_outlet;

  const outletOnlyMenu = useMemo(
    () => [
      {
        title: "Outlet",
        icon: "store",
        route: "outlets.index",
        routeParams: null,
        active: "outlets.index",
        role: "all",
        category: "Outlet Management",
      },
    ],
    []
  );

  const getIconComponent = (iconName) => {
    const IconComponent = iconComponents[iconName] || LayoutDashboard;
    return <IconComponent size={18} />;
  };

  const getTranslatedTitle = (englishTitle) => {
    const translationMap = {
      Dashboard: t("auth.dashboard", "Dashboard"),
      Outlet: t("auth.outlet", "Outlet"),
      "Outlet Management": t("auth.outlet_management", "Outlet Management"),
      Main: t("auth.main", "Main"),
      Sales: t("auth.sales", "Sales"),
      Purchase: t("auth.purchase", "Purchase"),
      Inventory: t("auth.inventory", "Inventory"),
      Finance: t("auth.finance", "Finance"),
      Partners: t("auth.partners", "Partners"),
      CRM: t("auth.crm", "CRM"),
      HR: t("auth.hr", "HR"),
      Outlets: t("auth.outlets", "Outlets"),

      "Add Sale (Inventory)": t("auth.add_sale_inventory", "Add Sale (Inventory)"),
      "Add Sale (POS)": t("auth.add_sale_pos", "Add Sale (POS)"),
      "All Orders (Inventory)": t("auth.all_orders_inventory", "All Orders (Inventory)"),
      "All Orders (POS)": t("auth.all_orders_pos", "All Orders (POS)"),
      "All Sales Items": t("auth.all_sales_items", "All Sales Items"),
      "All Sales Return": t("auth.all_sales_return", "All Sales Return"),

      "Add Purchase": t("auth.add_purchase", "Add Purchase"),
      "Purchase Return": t("auth.purchase_return", "Purchase Return"),
      "Add Purchase Return": t("auth.add_purchase_return", "Add Purchase Return"),
      "All Purchase Items": t("auth.all_purchase_items", "All Purchase Items"),

      Users: t("auth.users", "Users"),

      Warehouse: t("auth.warehouse", "Warehouse"),
      Supplier: t("auth.supplier", "Supplier"),
      Attribute: t("auth.attribute", "Attribute"),
      Products: t("auth.products", "Products"),
      "Add Products": t("auth.add_products", "Add Products"),
      Categories: t("auth.categories", "Categories"),
      Brands: t("auth.brands", "Brands"),

      "Extra cash": t("auth.extra_cash", "Extra Cash"),
      Expense: t("auth.expense", "Expense"),
      Transactions: t("auth.transactions", "Transactions"),
      Accounts: t("auth.accounts", "Accounts"),
      Ledgers: t("auth.ledgers", "Ledgers"),

      Dealerships: t("auth.dealerships", "Dealerships"),
      Customer: t("auth.customer", "Customer"),
      Companies: t("auth.companies", "Companies"),

      Employees: t("auth.employees", "Employees"),
      Attendance: t("auth.attendance", "Attendance"),
      Salary: t("auth.salary", "Salary"),
      Allowances: t("auth.allowances", "Allowances"),
      Ranks: t("auth.ranks", "Ranks"),
      Bonus: t("auth.bonus", "Bonus"),
      SMS: t("auth.sms", "SMS"),
    };

    return translationMap[englishTitle] || englishTitle;
  };

  const menuToShow = isLoggedIntoOutlet ? baseMenu : outletOnlyMenu;

  const filteredAndGrouped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const categories = {};

    for (const item of menuToShow) {
      // role gate
      if (!(item.role === "all" || item.role === auth?.user?.role)) continue;

      const category = item.category || "General";

      // text match
      const title = getTranslatedTitle(item.title).toLowerCase();
      const matches = !q || title.includes(q);

      // children match (future-proof)
      const childMatches =
        item.children?.some((c) => getTranslatedTitle(c.title).toLowerCase().includes(q)) || false;

      if (matches || childMatches) {
        categories[category] ||= [];
        categories[category].push(item);
      }
    }

    return categories;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuToShow, searchQuery, auth?.user?.role, locale, currentRoute]);

  const categoryOrder = useMemo(() => Object.keys(filteredAndGrouped), [filteredAndGrouped]);

  // ✅ find active category (smart open)
  const activeCategory = useMemo(() => {
    for (const [cat, items] of Object.entries(filteredAndGrouped)) {
      if (items.some((it) => it.active === currentRoute || it.children?.some((c) => c.active === currentRoute))) {
        return cat;
      }
    }
    return null;
  }, [filteredAndGrouped, currentRoute]);

  // ✅ Smart dropdown settings
  const ACCORDION = true; // only one category open at a time

  const toggleCategory = useCallback(
    (cat) => {
      setOpenCategories((prev) => {
        const next = { ...prev };

        if (ACCORDION) {
          // close all others
          for (const k of Object.keys(next)) next[k] = false;
        }
        next[cat] = !prev?.[cat];

        return next;
      });
    },
    [ACCORDION]
  );

  // ✅ Auto-open active category on route change (and when sidebar opens)
  useEffect(() => {
    if (!activeCategory) return;
    setOpenCategories((prev) => ({
      ...prev,
      [activeCategory]: true,
    }));
  }, [activeCategory]);

  // ✅ When searching: open only categories that have results
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;

    const next = {};
    for (const cat of Object.keys(filteredAndGrouped)) next[cat] = true;
    setOpenCategories(next);
  }, [searchQuery, filteredAndGrouped]);

  // ✅ Click outside close (mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (status && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setStatus(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [status, setStatus]);

  // ✅ ESC close (mobile)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && status) setStatus(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [status, setStatus]);

  return (
    <>
      {status && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40 transition-opacity duration-300"
          onClick={() => setStatus(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        id="sidebar"
        className={`w-72 fixed h-full z-50 transition-all duration-300 ${
          status ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } lg:translate-x-0 lg:shadow-xl`}
        style={{ background: "linear-gradient(180deg, #0f2d1a 0%, #1e4d2b 100%)" }}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-xl shadow-lg">
                <img
                  src="https://i.ibb.co.com/t0bPR3c/output-onlinepngtools-12-1.png"
                  className="w-[80px] h-[80px]"
                  alt=""
                />
              </div>
            </div>

            <button
              onClick={() => setStatus(false)}
              className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* ✅ Outlet warning only for non-super-admin */}
          {!isSuperAdmin && !isLoggedIntoOutlet && (
            <div className="mb-6 bg-gradient-to-r from-amber-500/20 to-amber-600/10 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <Store size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">
                    {locale === "bn" ? "আউটলেট নির্বাচন করুন" : "Select an Outlet"}
                  </p>
                  <p className="text-white/70 text-xs">
                    {locale === "bn"
                      ? "সব ফিচার এক্সেস করতে আউটলেটে লগইন করুন"
                      : "Login to an outlet to access all features"}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Link
                  href={safeRoute("outlets.index")}
                  className="inline-flex items-center justify-center w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                >
                  <Store size={16} className="mr-2" />
                  {locale === "bn" ? "আউটলেট নির্বাচন করুন" : "Select Outlet"}
                </Link>
              </div>
            </div>
          )}

          {/* Search Bar */}
          {isLoggedIntoOutlet && (
            <div className="mb-6 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white w-4 h-4" />
                <input
                  type="text"
                  placeholder={locale === "bn" ? "মেনু সার্চ করুন..." : "Search menu..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto no-scrollbar space-y-4 text-sm font-medium pr-2">
            {categoryOrder.map((category) => {
              const items = filteredAndGrouped[category] || [];
              if (!items.length) return null;

              const isOpen = !!openCategories[category];
              const categoryTitle = getTranslatedTitle(category);

              return (
                <div key={category} className="space-y-2">
                  {/* ✅ Smart Category Dropdown Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleCategory(category);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                      isOpen
                        ? "bg-white/10 border border-white/10"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                    aria-expanded={isOpen}
                  >
                    <span className="text-[12px] text-white font-bold tracking-widest">
                      {categoryTitle}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* count pill */}
                      <span className="text-[10px] font-bold text-white/80 bg-white/10 border border-white/10 px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                      <ChevronRight
                        size={16}
                        className={`text-white transition-transform duration-200 ${
                          isOpen ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* ✅ Category Items (dropdown body) */}
                  <div
                    className={`grid transition-all duration-200 ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-1 pl-1">
                        {items.map((item, idx) => {
                          const isActive = currentRoute === item.active;
                          const translatedTitle = getTranslatedTitle(item.title);
                          const hasChildren = !!(item.children && item.children.length);

                          // If in future you add children, you can extend here.
                          return (
                            <div key={`${category}-${idx}`} className="relative">
                              {!hasChildren ? (
                                <Link
                                  href={safeRoute(item.route, item.routeParams)}
                                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                                    isActive
                                      ? "bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm border border-white/10"
                                      : "hover:bg-white/5"
                                  }`}
                                >
                                  <span
                                    className={`${
                                      isActive ? "text-white" : "text-white/70 group-hover:text-white"
                                    }`}
                                  >
                                    {getIconComponent(item.icon || "dashboard")}
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      locale === "bn" ? "text-sm leading-relaxed" : ""
                                    } ${isActive ? "text-white" : "text-white/90 group-hover:text-white"}`}
                                  >
                                    {translatedTitle}
                                  </span>

                                  {/* active dot */}
                                  {isActive && (
                                    <span className="ml-auto w-2 h-2 rounded-full bg-[#35a952] shadow-sm" />
                                  )}
                                </Link>
                              ) : (
                                <div className="px-4 py-3 rounded-xl bg-white/5 text-white/80">
                                  {/* placeholder for nested menus */}
                                  {translatedTitle}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Info message when not logged into outlet (non-super-admin only) */}
            {!isSuperAdmin && !isLoggedIntoOutlet && (
              <div className="text-center py-8">
                <Store className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white text-sm font-medium mb-2">
                  {locale === "bn" ? "শুধুমাত্র আউটলেট মেনু" : "Outlet Menu Only"}
                </p>
                <p className="text-white/60 text-xs">
                  {locale === "bn"
                    ? "সম্পূর্ণ মেনু দেখতে আউটলেটে লগইন করুন"
                    : "Login to an outlet to see full menu"}
                </p>
              </div>
            )}
          </nav>

          {/* Logout */}
          <div className="mt-auto pt-6 border-t border-white/10">
            <Link
              href={safeRoute("logout")}
              onClick={(e) => {
                if (!confirm(locale === "bn" ? "আপনি কি লগআউট করতে চান?" : "Are you sure you want to logout?")) {
                  e.preventDefault();
                }
              }}
              className="w-full bg-gradient-to-r from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border border-red-500/20 rounded-xl px-4 py-3 transition-all duration-200 flex items-center justify-center gap-2 text-white text-sm font-semibold group"
            >
              <LogOut size={16} className="group-hover:rotate-180 transition-transform duration-300" />
              <span>{locale === "bn" ? "লগআউট" : "LOGOUT"}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setStatus(true)}
        className="fixed bottom-4 right-4 lg:hidden z-40 bg-gradient-to-r from-[#1e4d2b] to-[#35a952] text-white p-3 rounded-full shadow-2xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
      >
        <Menu size={24} />
      </button>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
        .no-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
    </>
  );
}
