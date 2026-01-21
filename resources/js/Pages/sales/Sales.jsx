import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Invoice from "../../components/Invoice";
import Select from "react-select";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import { Check, DollarSign, Frown, Plus, Save, Trash, X } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";

export default function Sales({
    product,
    customer,
    category,
    filter,
    cart: initialCart,
    grandTotal,
    salesdata,
    exchangedata,
    preurl,
    exchangeid,
}) {
    const [invoiceModel, setInvoiceModel] = useState(false);
    const { flash } = usePage().props;

    // old products
    const [oldSelectedProducts, setOldSelectedProducts] = useState([]);
    const handleOldProductSelect = (oldSelectedProductsOne) => {
        try {
            const newProduct = JSON.parse(oldSelectedProductsOne);

            const alreadyExists = oldSelectedProducts.some(
                (p) => p.variant_id === newProduct.variant_id
            );

            if (!alreadyExists && newProduct?.product_id) {
                setOldSelectedProducts((prev) => [...prev, newProduct]);
            } else {
                toast.error("This product already selected");
            }
            oldproductSubtotal();
        } catch (error) {
            console.error("Invalid JSON in oldSelectedProductsOne:", error);
        }
    };
    const deloldSelectedProducts = (vid) => {
        setOldSelectedProducts((prev) =>
            prev.filter((item) => item.variant_id !== vid)
        );
        oldproductSubtotal();
    };
    const oldproductSubtotal = () => {
        return oldSelectedProducts.reduce((sum, p) => {
            const price = parseFloat(p.price) || 0;
            const discount = parseFloat(p.discount) || 0;
            const qty = parseInt(p.qty) || 1;

            const finalPrice = (price - (price * discount) / 100) * qty;
            return sum + finalPrice;
        }, 0);
    };

    useEffect(() => {
        if (salesdata) {
            setInvoiceModel(true);
        }
    }, [salesdata]);

    // sales form
    const [selectedSystem, setSelectedSystem] = useState("");
    const [cashModel, setCashModel] = useState(false);
    const SalesForm = useForm({
        customer_id: exchangedata?.customer?.id || "",
        payments: [{ system: "cash", amount: "" }],
        trime: false,
        exchangedata: null,
        exchangeid: exchangeid || "",
        oldprice: "",

        customer: false,
        customer_name: "",
        customer_phone: "",
        customer_address: "",
    });
    const handleCashModel = () => {
        if (cart.length <= 0) {
            toast.error("No product selected");
            return;
        }
        setCashModel(true);
    };
    const handleSalesForm = (e) => {
        e.preventDefault();
        SalesForm.post(route("sales.done"), {
            onSuccess: (res) => {
                console.log(res);
            },
            preserveScroll: true,
            preserveState: true,
            preserveUrl: true,
        });
    };

    // payment system
    const handleAddSystem = () => {
        if (!selectedSystem) return;

        const alreadyAdded = SalesForm.data.payments?.some(
            (p) => p.system === selectedSystem
        );

        if (alreadyAdded) return alert("This payment system is already added!");
        SalesForm.setData("payments", [
            ...(SalesForm.data.payments || []),
            { system: selectedSystem, amount: "" },
        ]);

        setSelectedSystem(""); 
    };

    const handleChangeAmount = (index, value) => {
        const updated = [...SalesForm.data.payments];
        updated[index].amount = value;
        SalesForm.setData("payments", updated);
    };
    const handleRemove = (index) => {
        const updated = SalesForm.data.payments.filter((_, i) => i !== index);
        SalesForm.setData("payments", updated);
    };

    useEffect(() => {
        SalesForm.setData("exchangedata", oldSelectedProducts);
        SalesForm.setData(
            "oldprice",
            oldproductSubtotal() > 0 ? oldproductSubtotal() : 0
        );
    }, [oldSelectedProducts]);

    // handle search
    const searchForm = useForm({
        category_id: filter.category_id || "",
    });
    
    useEffect(() => {
        const queryString = {
            ...(searchForm.data.category_id && {
                category_id: searchForm.data.category_id,
            }),
        };

        if (searchForm.data.category_id) {
            router.get(route("sales.add"), queryString, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        }
    }, [searchForm.data.category_id]);

    // manage cart
    const [productModel, setProductModel] = useState(false);
    const [selectProduct, setSelectProduct] = useState();
    const [selectProductData, setSelectProductData] = useState();
    useEffect(() => {
        if (selectProduct) {
            axios
                .post(route("sales.add.varaint", { id: selectProduct }))
                .then((res) => {
                    setSelectProductData(res?.data[0]);
                    setProductModel(true);
                })
                .catch((err) => toast.error(err));
        }
    }, [selectProduct]);

    const productModelClose = () => {
        setSelectProduct("");
        setProductModel(false);
    };

    // add in cart
    const [defutlQTy, setDefutlQTy] = useState(1);
    const addinCart = (pid, vid, size, category_id) => {
        if (!pid || !vid || !size || !category_id) {
            toast.error("Opps! somthing issue try again.");
            return;
        }
        let data = {
            product_id: pid,
            variant_id: vid,
            size: size,
            category_id: category_id,
            qty: defutlQTy,
        };
        router.post(route("sales.add.cart"), data, {
            preserveScroll: true,
            preserveUrl: true,
            preserveState: true,
        });
        playSound();
    };

    // handle discount and qty update
    const [cartEdit, setCratEdit] = useState(false);
    const [cart, setCart] = useState([]);

    const handleChange = (index, field, value) => {
        const updatedCart = [...cart];
        updatedCart[index] = {
            ...updatedCart[index],
            [field]: value,
        };
        setCart(updatedCart);
        setCratEdit(true);
    };
    const handlecartupdate = () => {
        router.post(
            route("sales.cart.update"),
            { cart },
            {
                onSuccess: (res) => {
                    setCratEdit(false);
                },
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    useEffect(() => {
        setCart(initialCart ?? []);
    }, [initialCart]);

    useEffect(() => {
        if (flash?.error) {
            if (Array.isArray(flash.error)) {
                flash.error.forEach((err) => {
                    toast.error(err);
                });
            }
            router.get(preurl);
        }
    }, [flash?.error]);

    const handleEnterKey = (e) => {
        if (e.key === "Enter") {
            if (cartEdit) {
                handlecartupdate();
            }
        }
    };

    // play sound
    const playSound = () => {
        const audio = new Audio("/media/static/addcartsound.mp3");
        audio.play();
    };

    // bar code
    const [barcode, setBarcode] = useState("");
    const [lastScanTime, setLastScanTime] = useState(Date.now());

    useEffect(() => {
        const handleKeydown = (e) => {
            const now = Date.now();

            if (now - lastScanTime > 100) {
                setBarcode(e.key);
            } else {
                setBarcode((prev) => prev + e.key);
            }

            setLastScanTime(now);

            if (e.key === "Enter") {
                const finalCode = barcode.trim();
                if (finalCode.length > 0) {
                    handleBarcodeScan(finalCode);
                    setBarcode("");
                }
            }
        };

        window.addEventListener("keydown", handleKeydown);

        return () => {
            window.removeEventListener("keydown", handleKeydown);
        };
    }, [barcode, lastScanTime]);

    const handleBarcodeScan = (code) => {
        const parts = code.split(",");
        const firstPart = parts[0];
        const secondPart = parts[1];

        router.post(
            route(
                "sales.add.cart.scanner",
                {
                    product_id: firstPart,
                    variant_id: secondPart,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                }
            )
        );
    };

    return (
        <div className="bg-white rounded-box p-5">
            <PageHeader title="Add sales" />

            {/* Scanner Alert */}
            <div className="bg-[#1e4d2b] text-white text-primary p-4 rounded-box flex items-center space-x-2 mb-2">
                <Check size={14} />
                <p className="font-medium text-sm">
                    Barcode scanner detected ✅ Connect and start adding
                    products more quickly and efficiently.
                </p>
            </div>

            <div className="print:hidden">
                {/* controller */}
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-end gap-2">
                            <fieldset className="fieldset w-full">
                                <legend className="fieldset-legend">
                                    Customer*
                                </legend>
                                <select
                                    className="select"
                                    value={SalesForm.data.customer_id}
                                    disabled={
                                        exchangedata || SalesForm.data.customer
                                    }
                                    onChange={(e) =>
                                        SalesForm.setData(
                                            "customer_id",
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="" selected>
                                        Wark in cas
                                    </option>
                                    {Object.entries(customer).map(
                                        ([name, id]) => (
                                            <option key={id} value={id}>
                                                {name}
                                            </option>
                                        )
                                    )}
                                </select>
                                {SalesForm.errors.customer_id && (
                                    <p className="label text-red-500">
                                        {SalesForm.errors.customer_id}
                                    </p>
                                )}
                            </fieldset>
                            <button
                                onClick={() =>
                                    SalesForm.setData(
                                        "customer",
                                        !SalesForm.data.customer
                                    )
                                }
                                className={`btn btn-square ${
                                    SalesForm.data.customer
                                        ? "btn-error"
                                        : "bg-[#1e4d2b] text-white"
                                } mb-1`}
                            >
                                {SalesForm.data.customer ? (
                                    <X size={13} />
                                ) : (
                                    <Plus size={13} />
                                )}
                            </button>
                        </div>

                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                Category
                            </legend>
                            <select
                                className="select"
                                value={searchForm.data.category_id}
                                onChange={(e) =>
                                    searchForm.setData(
                                        "category_id",
                                        e.target.value
                                    )
                                }
                            >
                                <option value="" selected>
                                    --All Category--
                                </option>
                                {Object.entries(category).map(([name, id]) => (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </fieldset>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <fieldset className="fieldset col-span-2">
                            <legend className="fieldset-legend">
                                Product*
                            </legend>
                            <Select
                                options={product}
                                value={selectProduct}
                                placeholder="Name, Code..."
                                isClearable
                                onChange={(option) => setSelectProduct(option)}
                            />
                        </fieldset>
                        <fieldset className="fieldset w-full">
                            <legend className="fieldset-legend">
                                Default Quantity*
                            </legend>
                            <input
                                type="number"
                                min={1}
                                step={1}
                                value={defutlQTy}
                                onChange={(e) => setDefutlQTy(e.target.value)}
                                className="input input-md"
                            />
                        </fieldset>
                    </div>
                </div>

                {/* new customer */}
                <div
                    tabIndex={0}
                    className={`collapse bg-base-100 mt-3 ${
                        SalesForm.data.customer
                            ? "collapse-open border-gray-300 border"
                            : "collapse-close"
                    }`}
                >
                    <div className="collapse-content grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <h1 className="col-span-2 mt-2 text-base text-neutral font-bold">New customer</h1>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                Customer name*
                            </legend>
                            <input
                                type="text"
                                className="input"
                                value={SalesForm.data.customer_name}
                                onChange={(e) =>
                                    SalesForm.setData(
                                        "customer_name",
                                        e.target.value
                                    )
                                }
                            />
                            {SalesForm.errors.customer_name && (
                                <p className="label text-error">
                                    {SalesForm.errors.customer_name}
                                </p>
                            )}
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                Customer phone*
                            </legend>
                            <input
                                type="text"
                                className="input"
                                value={SalesForm.data.customer_phone}
                                onChange={(e) =>
                                    SalesForm.setData(
                                        "customer_phone",
                                        e.target.value
                                    )
                                }
                            />
                            {SalesForm.errors.customer_phone && (
                                <p className="label text-error">
                                    {SalesForm.errors.customer_phone}
                                </p>
                            )}
                        </fieldset>
                        <fieldset className="fieldset col-span-2">
                            <legend className="fieldset-legend">
                                Customer address
                            </legend>
                            <textarea
                                value={SalesForm.data.customer_address}
                                onChange={(e) =>
                                    SalesForm.setData(
                                        "customer_address",
                                        e.target.value
                                    )
                                }
                                className="textarea"
                                placeholder="Bio"
                            ></textarea>
                            {SalesForm.errors.customer_address && (
                                <p className="label text-error">
                                    {SalesForm.errors.customer_address}
                                </p>
                            )}
                        </fieldset>
                    </div>
                </div>

                {/* producs */}
                <div
                    className={`overflow-x-auto rounded-box border border-base-content/5 bg-base-100 mt-5`}
                >
                    {cart.length > 0 ? (
                        <table className="table">
                            <thead className="bg-[#1e4d2b] text-white text-white">
                                <tr>
                                    <th>Product</th>
                                    <th>Gross Price</th>
                                    <th>Discount</th>
                                    <th>Quantity</th>
                                    <th>Price</th>
                                    <th>Subtotal</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((user, index) => (
                                    <tr key={index}>
                                        <td className="max-w-[150px]">
                                            <small>{user.product}</small>
                                        </td>
                                        <td>{user.price}</td>

                                        <td>
                                            <input
                                                value={user.discount}
                                                min={0}
                                                max={100}
                                                type="number"
                                                className="input input-xs rounded-box max-w-[70px]"
                                                onChange={(e) =>
                                                    handleChange(
                                                        index,
                                                        "discount",
                                                        e.target.value
                                                    )
                                                }
                                                onKeyUp={handleEnterKey}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                value={user.stock}
                                                min={1}
                                                type="number"
                                                className="input input-xs rounded-box max-w-[70px]"
                                                onChange={(e) =>
                                                    handleChange(
                                                        index,
                                                        "stock",
                                                        e.target.value
                                                    )
                                                }
                                                onKeyUp={handleEnterKey}
                                            />
                                        </td>

                                        <td>
                                            {(
                                                user.price -
                                                (user.price * user.discount) /
                                                    100
                                            ).toFixed(2)}{" "}
                                            Tk
                                        </td>

                                        <td>
                                            {(
                                                (user.price -
                                                    (user.price *
                                                        user.discount) /
                                                        100) *
                                                user.stock
                                            ).toFixed(2)}{" "}
                                            Tk
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    href={route("sales.dele", {
                                                        id: user.id,
                                                    })}
                                                    as="button"
                                                    preserveScroll
                                                    preserveState
                                                    onClick={(e) => {
                                                        if (
                                                            !confirm(
                                                                "Are you sure you want to delete this item?"
                                                            )
                                                        ) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className="btn btn-xs btn-error"
                                                >
                                                    <Trash size={10} />
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

                {/* old product */}
                {exchangedata !== null && (
                    <div className="mt-5 border border-gray-200 rounded-box p-5 bg-[#1e4d2b] text-white">
                        <h1 className="text-neutral text-sm mb-2 font-bold">
                            Old Products
                        </h1>
                        <select
                            className="select"
                            onChange={(e) =>
                                handleOldProductSelect(e.target.value)
                            }
                        >
                            <option value={JSON.stringify({})}>
                                -- Select old product --
                            </option>
                            {exchangedata?.products &&
                                JSON.parse(exchangedata.products)?.map(
                                    (val, i) => (
                                        <option
                                            key={i}
                                            value={JSON.stringify(val)}
                                        >
                                            {val?.name}
                                            {" - "}
                                            {val?.product_no}
                                            {" - "}
                                            {val?.size}/{val?.color}
                                        </option>
                                    )
                                )}
                        </select>

                        <div className="mt-4">
                            {oldSelectedProducts.length <= 0 && (
                                <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                                    <Frown
                                        size={20}
                                        className="text-gray-500"
                                    />
                                    <h1 className="text-gray-500 text-sm">
                                        No product selected!
                                    </h1>
                                </div>
                            )}
                            {oldSelectedProducts.length > 0 && (
                                <div className="space-y-2">
                                    {oldSelectedProducts?.map((val, i) => (
                                        <div
                                            className="border flex items-center justify-between gap-2 border-gray-300 p-2 text-sm rounded-box"
                                            key={i}
                                        >
                                            <h1>
                                                {val?.name} - {val?.product_no}{" "}
                                                -{" "}
                                                <span className="uppercase">
                                                    {val?.size} - {val?.color}
                                                </span>
                                            </h1>
                                            <h1 className="uppercase flex items-center">
                                                {val?.price} * {val?.qty} ={" "}
                                                {Number(
                                                    val?.price * val?.qty
                                                ).toFixed(2)}
                                                Tk{" = "}
                                                <span className="pl-1">
                                                    {(
                                                        val.price * val?.qty -
                                                        (val.price *
                                                            val?.discount) /
                                                            100
                                                    ).toFixed(2)}{" "}
                                                    Tk
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        deloldSelectedProducts(
                                                            val?.variant_id
                                                        )
                                                    }
                                                    className="btn btn-xs btn-circle btn-error ml-3"
                                                >
                                                    <Trash size={10} />
                                                </button>
                                            </h1>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* grand */}
                <div className="bg-[#1e4d2b] text-white flex items-center justify-center mt-5 py-4">
                    <span className="text-lg font-bold text-primary">
                        Grand total: {grandTotal.toFixed(2)} Tk
                    </span>

                    {exchangedata !== null &&
                        oldSelectedProducts.length > 0 && (
                            <>
                                <span className="text-lg font-bold text-primary border-l border-gray-500 pl-3 ml-3">
                                    Return: {oldproductSubtotal()}
                                    Tk
                                </span>
                                <span className="text-lg font-bold border-l border-gray-500 pl-3 ml-3 text-error">
                                    {oldproductSubtotal() -
                                        (Number(exchangedata?.nextdue) || 0) -
                                        grandTotal <
                                        0 && (
                                        <span>
                                            {(() => {
                                                const extracash =
                                                    Number(
                                                        exchangedata?.grandtotal
                                                    ) -
                                                    oldproductSubtotal() -
                                                    Number(
                                                        exchangedata?.paytotal
                                                    );

                                                const canMisun =
                                                    Math.abs(extracash) > 0
                                                        ? Math.abs(extracash)
                                                        : 0;

                                                const amount =
                                                    grandTotal - canMisun;

                                                return <>Payable: {amount}</>;
                                            })()}
                                            Tk
                                        </span>
                                    )}
                                </span>
                            </>
                        )}
                </div>
                <div className="flex items-center gap-2 mt-4 justify-center">
                    {cartEdit && (
                        <button
                            onClick={() => handlecartupdate()}
                            className="btn btn-warning btn-sm"
                        >
                            <Save size={10} /> Update cart
                        </button>
                    )}

                    {!cartEdit && (
                        <button
                            onClick={handleCashModel}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <DollarSign size={10} />{" "}
                            {exchangedata &&
                            Number(oldproductSubtotal() - grandTotal) == 0
                                ? "Exchange"
                                : "Cash"}
                        </button>
                    )}

                    {cart.length > 0 && (
                        <>
                            <Link
                                href={route("sales.cart.clear")}
                                as="button"
                                preserveScroll
                                preserveState
                                onClick={(e) => {
                                    if (
                                        !confirm(
                                            "Are you sure you want to clear cart?"
                                        )
                                    ) {
                                        e.preventDefault();
                                    }
                                }}
                                className="btn btn-error btn-sm"
                            >
                                <X size={10} /> Clear cart
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* product variant controller */}
            <dialog className="modal" open={productModel}>
                <div className="modal-box">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <h1 className="text-base font-medium text-gray-900">
                            Product varaint
                        </h1>
                        <button
                            onClick={productModelClose}
                            className="btn btn-circle btn-xs btn-error"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    <div>
                        {selectProductData && (
                            <>
                                <h1 className="text-neutral font-base font-semibold mb-4">
                                    {selectProductData?.name} -{" "}
                                    {selectProductData?.category?.name}
                                </h1>

                                <div className="max-h-[200px] overflow-y-auto">
                                    {selectProductData?.sizes.map((val, i) => (
                                        <div
                                            className="border border-gray-200 rounded-box p-3"
                                            key={i}
                                        >
                                            <h1 className="text-xs">
                                                {val?.name}
                                            </h1>
                                            <div className="flex gap-3 flex-wrap mt-1">
                                                {val?.colors.map((vval, vi) => (
                                                    <button
                                                        key={vi}
                                                        onClick={() =>
                                                            addinCart(
                                                                selectProductData?.id,
                                                                vval?.id,
                                                                val?.name,
                                                                selectProductData
                                                                    ?.category
                                                                    ?.id
                                                            )
                                                        }
                                                        className="btn btn-xs uppercase"
                                                    >
                                                        {vval?.name} - (
                                                        {vval?.stock})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </dialog>

            {/* cash model */}
            <dialog className="modal" open={cashModel}>
                <div className="modal-box">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <h1 className="text-base font-medium text-gray-900">
                            Cash collect
                        </h1>
                        <button
                            onClick={() => setCashModel(!cashModel)}
                            className="btn btn-circle btn-xs btn-error"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    <div>
                        <div className="bg-[#1e4d2b] text-white/20 rounded-box py-2 mb-3 px-2">
                            <h1 className="font-xl text-center font-bold text-neutral">
                                {(() => {
                                    let amount = 0;
                                    if (exchangedata) {
                                        const extracash =
                                            Number(exchangedata?.grandtotal) -
                                            oldproductSubtotal() -
                                            Number(exchangedata?.paytotal);

                                        const canMisun =
                                            Math.abs(extracash) > 0
                                                ? Math.abs(extracash)
                                                : 0;

                                        amount = grandTotal - canMisun;
                                    } else {
                                        amount = grandTotal.toFixed(2) ?? "00";
                                    }

                                    return <>Payable: {amount} Tk</>;
                                })()}
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
                        {SalesForm.data.payments?.length > 0 && (
                            <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto border border-dashed border-primary p-3">
                                {SalesForm.data.payments.map((p, i) => (
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
                                checked={SalesForm.data.trime || false}
                                onChange={(e) =>
                                    SalesForm.setData("trime", e.target.checked)
                                }
                                className="checkbox checkbox-sm"
                            />
                            Trim extra amount
                        </label>

                        <button
                            onClick={handleSalesForm}
                            className="btn bg-[#1e4d2b] text-white w-full mt-4"
                        >
                            Sales Done
                        </button>
                    </div>
                </div>
            </dialog>

            {/* invoce model */}
            <Invoice
                open={invoiceModel}
                setOpen={setInvoiceModel}
                data={salesdata ?? []}
            />
        </div>
    );
}
