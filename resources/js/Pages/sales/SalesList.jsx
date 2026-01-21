import React, { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import Invoice from "../../components/Invoice";
import { ArrowLeftRight, Frown, Plus, Printer, Trash2, X } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { toast } from "react-toastify";

export default function SalesList({ sales, filters, salesdata }) {
    const { auth } = usePage().props;
    const [invoiceModel, setInvoiceModel] = useState(false);
    // invoice
    useEffect(() => {
        if (salesdata) {
            setInvoiceModel(true);
        }
    }, [salesdata]);

    // handle search
    const searchForm = useForm({
        search: filters.search || "",
    });
    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        const queryString = value ? { search: value } : {};

        router.get(route("sales.list.all"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    // due collct model
    const [selectedSystem, setSelectedSystem] = useState("");
    const [dueModel, setDueModel] = useState(false);
    const DueForm = useForm({
        id: "",
        amount: "",
        payments: [{ system: "cash", amount: "" }],
        trime: false,
    });
    const handleCashCollactModel = (id, amount, type = "open") => {
        if (!id && !amount) {
            if (type === "close") {
                setDueModel(false);
                DueForm.reset();
            } else toast.error("Something went wrong, try again.");
            return;
        }

        setDueModel(type === "open");
        DueForm.setData("id", id);
        DueForm.setData("amount", amount);
    };

    const handleDueCollactForm = (e) => {
        e.preventDefault();

        DueForm.post(route("sales.list.duecollact"), {
            onSuccess: () => {
                DueForm.reset();
                setDueModel(false);
            },
        });
    };

    // payment system
    const handleAddSystem = () => {
        if (!selectedSystem) return;

        // আগেই যোগ করা আছে কিনা check
        const alreadyAdded = DueForm.data.payments?.some(
            (p) => p.system === selectedSystem
        );

        if (alreadyAdded) return alert("This payment system is already added!");

        DueForm.setData("payments", [
            ...(DueForm.data.payments || []),
            { system: selectedSystem, amount: "" },
        ]);

        setSelectedSystem(""); // reset dropdown
    };
    const handleChangeAmount = (index, value) => {
        const updated = [...DueForm.data.payments];
        updated[index].amount = value;
        DueForm.setData("payments", updated);
    };
    const handleRemove = (index) => {
        const updated = DueForm.data.payments.filter((_, i) => i !== index);
        DueForm.setData("payments", updated);
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader
                title="Sales list"
                subtitle="Manage your all sales from here."
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder="Search.."
                        className="input input-sm"
                    />
                    <Link
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                        href={route("sales.add")}
                    >
                        <Plus size={13} />
                        Add sales
                    </Link>
                </div>
            </PageHeader>

            <div className="print:hidden">
                <div className="overflow-x-auto">
                    {sales.data.length > 0 ? (
                        <table className="table table-auto w-full">
                            <thead className="bg-[#1e4d2b] text-white text-white">
                                <tr>
                                    <th>Sales ID</th>
                                    <th>Customer</th>
                                    <th>Solded by</th>
                                    <th>Total</th>
                                    <th>Pay</th>
                                    <th>Due</th>
                                    <th>Delevery status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.data.map((user, index) => (
                                    <tr key={index}>
                                        <th>{user.sales_id}</th>
                                        <td>
                                            <p>
                                                <strong>Name:</strong>{" "}
                                                {user.customer
                                                    ? user.customer
                                                          .customer_name
                                                    : "Wark in cas"}
                                            </p>
                                            <p>
                                                <strong>Phone:</strong>{" "}
                                                {user.customer
                                                    ? user.customer.phone
                                                    : "N/A"}
                                            </p>
                                        </td>
                                        <td>
                                            {user?.created_by && (
                                                <>
                                                    <p>
                                                        <strong>Name:</strong>{" "}
                                                        {user?.created_by?.name}
                                                    </p>
                                                    <p>
                                                        <strong>Email:</strong>{" "}
                                                        {
                                                            user?.created_by
                                                                ?.email
                                                        }
                                                    </p>
                                                </>
                                            )}
                                        </td>
                                        <td>{Number(user.grandtotal)} Tk</td>
                                        <td>
                                            {(() => {
                                                const payments = JSON.parse(
                                                    user?.pay || "[]"
                                                );

                                                // total হিসাব করা
                                                const total = payments.reduce(
                                                    (sum, val) =>
                                                        sum +
                                                        Number(val.amount || 0),
                                                    0
                                                );

                                                return (
                                                    <>
                                                        {payments.map(
                                                            (val, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="uppercase text-xs"
                                                                >
                                                                    (
                                                                    {
                                                                        val?.system
                                                                    }
                                                                    :{" "}
                                                                    {
                                                                        val?.amount
                                                                    }
                                                                    )
                                                                </span>
                                                            )
                                                        )}

                                                        {/* 🔥 total দেখাও */}
                                                        {payments.length >
                                                            0 && (
                                                            <span className="font-semibold uppercase text-xs text-primary ml-1">
                                                                = {total} Tk
                                                            </span>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </td>
                                        <td
                                            className={`${
                                                user?.nextdue > 0 &&
                                                "text-red-500"
                                            }`}
                                        >
                                            {user?.nextdue > 0 ? (
                                                <span>
                                                    {Number(
                                                        user?.nextdue
                                                    ).toFixed(2)}{" "}
                                                    Tk
                                                </span>
                                            ) : (
                                                <span className="text-primary">
                                                    Paid
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {user.status == "exhance" ? (
                                                <div className="badge badge-warning text-white capitalize">
                                                    {user.status}
                                                </div>
                                            ) : (
                                                <div className="badge badge-success text-white capitalize">
                                                    {user.status}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {new Date(
                                                user.created_at
                                            ).toLocaleString("en-GB", {
                                                timeZone: "Asia/Dhaka",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2 flex-wrap max-w-[200px]">
                                                <Link
                                                    href={route(
                                                        "sales.list.all",
                                                        {
                                                            salesid: user.id,
                                                        }
                                                    )}
                                                    preserveScroll
                                                    preserveState
                                                    className="btn btn-xs btn-info"
                                                >
                                                    <Printer size={13} /> Print
                                                </Link>
                                                {user?.status == "normal" && (
                                                    <Link
                                                        href={route(
                                                            "sales.add",
                                                            {
                                                                exchangeid:
                                                                    user.sales_id,
                                                            }
                                                        )}
                                                        preserveScroll
                                                        preserveState
                                                        className="btn btn-xs btn-secondary"
                                                    >
                                                        <ArrowLeftRight
                                                            size={13}
                                                        />{" "}
                                                        Exchange
                                                    </Link>
                                                )}
                                                {(Number(user?.nextdue) || 0) >
                                                    0 && (
                                                    <button
                                                        onClick={() =>
                                                            handleCashCollactModel(
                                                                user.id,
                                                                Number(
                                                                    user?.nextdue
                                                                ).toFixed(2),
                                                                "open"
                                                            )
                                                        }
                                                        className="btn btn-xs btn-warning"
                                                    >
                                                        <Plus size={13} /> Due
                                                        collact
                                                    </button>
                                                )}

                                                    <Link
                                                        href={route(
                                                            "sales.list.del",
                                                            {
                                                                id: user.id,
                                                            }
                                                        )}
                                                        onClick={(e) => {
                                                            if (
                                                                !confirm(
                                                                    "Are you sure you want to delete this sales list?"
                                                                )
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        className="btn btn-xs btn-error"
                                                    >
                                                        <Trash2 size={10} />{" "}
                                                        Delete
                                                    </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                            <Frown size={20} className="text-gray-500" />
                            <h1 className="text-gray-500 text-sm">
                                Data not found!
                            </h1>
                        </div>
                    )}
                </div>

                {/* pagination */}
                <Pagination data={sales} />
            </div>

            {/* due cash collect model */}
            <dialog className="modal" open={dueModel}>
                <div className="modal-box">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <h1 className="text-base font-medium text-gray-900">
                            Due collact
                        </h1>
                        <button
                            onClick={() => {
                                handleCashCollactModel("", "", "close");
                            }}
                            className="btn btn-circle btn-xs btn-error"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    <div>
                        <div className="bg-[#1e4d2b] text-white/20 rounded-box py-2 mb-3 px-2">
                            <h1 className="font-xl text-center font-bold text-neutral">
                                {DueForm.data?.amount} Tk
                            </h1>
                        </div>

                        {/* 🔽 Select + Add Button */}
                        <fieldset className="fieldset w-full">
                            <legend className="fieldset-legend">
                                Payment system*
                            </legend>
                            <div className="flex gap-2">
                                <select
                                    className="select flex-1"
                                    value={selectedSystem}
                                    onChange={(e) =>
                                        setSelectedSystem(e.target.value)
                                    }
                                >
                                    <option value="">Select a system</option>
                                    <option value="cash">Cash</option>
                                    <option disabled>--Mobile banking--</option>
                                    <option value="bkash">Bkash</option>
                                    <option value="nagod">Nagod</option>
                                    <option value="upay">Upay</option>
                                    <option value="rocket">Rocket</option>
                                    <option disabled>--Banking--</option>
                                    <option value="city_bank">City Bank</option>
                                    <option value="ucb">UCB</option>
                                    <option value="DBBL">DBBL</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={handleAddSystem}
                                    className="btn bg-[#1e4d2b] text-white btn-square"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        </fieldset>

                        {/* 🔥 Dynamic list of added systems */}
                        {DueForm.data.payments?.length > 0 && (
                            <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto border border-dashed border-primary p-3">
                                {DueForm.data.payments.map((p, i) => (
                                    <fieldset
                                        key={i}
                                        className="fieldset w-full relative"
                                    >
                                        <legend className="fieldset-legend capitalize">
                                            {p.system.replaceAll("_", " ")}{" "}
                                            amount*
                                        </legend>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={0}
                                                step={0.01}
                                                value={p.amount}
                                                onChange={(e) =>
                                                    handleChangeAmount(
                                                        i,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Enter ${p.system} amount`}
                                                className="input flex-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(i)}
                                                className="btn btn-error btn-square"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </fieldset>
                                ))}
                            </div>
                        )}

                        <label className="label mt-3">
                            <input
                                type="checkbox"
                                checked={DueForm.data.trime || false}
                                onChange={(e) =>
                                    DueForm.setData("trime", e.target.checked)
                                }
                                className="checkbox checkbox-sm"
                            />
                            Trim extra amount
                        </label>

                        <button
                            onClick={handleDueCollactForm}
                            className="btn bg-[#1e4d2b] text-white w-full mt-4"
                        >
                            Collect Due
                        </button>
                    </div>
                </div>
            </dialog>

            {/* invoice */}
            <Invoice
                open={invoiceModel}
                setOpen={setInvoiceModel}
                data={salesdata ?? []}
                redirect={route("sales.list.all")}
            />
        </div>
    );
}
