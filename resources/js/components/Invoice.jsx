import { router } from "@inertiajs/react";
import { Printer, X } from "lucide-react";
import { toWords } from "number-to-words";
import { useEffect, useMemo, useState } from "react";

export default function InvoiceComponent({
    open,
    setOpen,
    data = null,
    redirect = null,
}) {
    function formatCreatedDate(dateInput) {
        const date = new Date(dateInput);

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, "0");

        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        const formattedHours = String(hours).padStart(2, "0");

        return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
    }

    const [items, setItems] = useState([]);
    const [exitems, setExItems] = useState([]);
    const [exNitems, setExNItems] = useState([]);
    const [payment, setPayment] = useState({});
    const [totalPriceAmount, seTotalPriceAmount] = useState(0);

    useEffect(() => {
        if (data !== null) {
            // product
            let alltotalPrice = 0;
            if (data?.products) {
                const products = JSON.parse(data.products);
                const newItems = products.map((val, i) => ({
                    sl: i + 1,
                    name: val.name + " - " + val?.size + " - " + val?.color,
                    qty: val.qty,
                    price: val.price,
                }));
                setItems(newItems);

                // echnage
                if (data?.status == "exhance") {
                    const echnageProducts = JSON.parse(data?.exproducts);

                    const oldproduct = echnageProducts?.old?.map((val, i) => ({
                        sl: i + 1,
                        name: val.name + " - " + val?.size + " - " + val?.color,
                        qty: val.qty,
                        price: val.price,
                    }));
                    setExItems(oldproduct);

                    const newProduct = echnageProducts?.new?.map((val, i) => ({
                        sl: i + 1,
                        name: val.name + " - " + val?.size + " - " + val?.color,
                        qty: val.qty,
                        price: val.price,
                    }));
                    setExNItems(newProduct);
                }

                //
                products.map((val, i) => {
                    alltotalPrice += val.price * val.qty;
                });
            }

            // payamnet
            const payamntSystem = data?.pay ? JSON.parse(data?.pay) : [];
            const paydata = {
                paymentList: payamntSystem,
                totalamount: data?.grandtotal || 0,
                totalapay: data?.paytotal || 0,
                totaladue: data?.nextdue || 0,
            };

            // make total discount
            if (data?.status == "exhance") {
                const echnageProducts = JSON.parse(data?.exproducts)?.old || [];
                const products = JSON.parse(data?.products) || [];

                const echnageProductsNew =
                    JSON.parse(data?.exproducts)?.new || [];
                const filteredProducts = products.filter(
                    (prod) =>
                        !echnageProducts.some(
                            (exProd) => exProd.variant_id === prod.variant_id
                        )
                );

                const productsWithTotal = filteredProducts.map((item) => {
                    const price = Number(item.price) || 0;
                    const discount = Number(item.discount) || 0;
                    const qty = Number(item.qty) || 1;

                    const discountedPrice = price - (price * discount) / 100;
                    const total = discountedPrice * qty;

                    return total.toFixed(2);
                });
                const echnageProductsNewtotal = echnageProductsNew.map(
                    (item) => {
                        const price = Number(item.price) || 0;
                        const discount = Number(item.discount) || 0;
                        const qty = Number(item.qty) || 1;

                        const discountedPrice =
                            price - (price * discount) / 100;
                        const total = discountedPrice * qty;

                        return total.toFixed(2);
                    }
                );
                seTotalPriceAmount(
                    Number(productsWithTotal[0]) +
                        Number(echnageProductsNewtotal[0])
                );
            } else {
                const products = data?.products
                    ? JSON.parse(data?.products)
                    : [];
                const echnageProductsNewtotal = products.map((item) => {
                    const price = Number(item.price) || 0;
                    const discount = Number(item.discount) || 0;
                    const qty = Number(item.qty) || 1;

                    const discountedPrice = price - (price * discount) / 100;
                    const total = discountedPrice * qty;

                    return total.toFixed(2);
                });
                seTotalPriceAmount(Number(echnageProductsNewtotal[0]));
            }

            setPayment(paydata);
        }
    }, [data]);

    const shop = {
        name: "AL NOOR",
        addressLine1: "Afmi Plaza Shop No. 116, 2nd Floor, Pravartak More",
        mobile: "01850224322",
        email: "shahajanmohammadnoor@gmail.com",
    };

    const invoice = {
        invNo: data.sales_id,
        date: formatCreatedDate(data.created_at),
        soldBy: data?.created_by?.name ?? "Solder name",
        customerName: data?.customer?.customer_name ?? "Wark in cas",
    };

    const [inWords, setInWords] = useState("");
    useMemo(() => {
        if (!data?.grandtotal) return "";

        const totalAmount = data?.grandtotal;

        const totalInteger = Math.floor(totalAmount);
        const totalDecimal = Math.round((totalAmount - totalInteger) * 100);

        setInWords(
            `${toWords(totalInteger).replace(/,/g, " ")}${
                totalDecimal > 0 ? ` and ${toWords(totalDecimal)} Poisha` : ""
            } Taka Only`
        );
    }, [data]);

    // print
    const handlePrint = () => {
        window.print();
    };
    return (
        <dialog
            className="modal print:items-start print:p-0 print:m-0"
            open={open}
        >
            <div className="modal-box w-[500px] print:w-[250px] print:max-h-fit print:p-0 print:m-0">
                <div className="w-full bg-white print:m-0 print:p-0">
                    {/* Header */}
                    <div className="text-center mb-4 pb-4 print:pb-2">
                        <h1 className="text-2xl font-extrabold tracking-widest print:text-lg">
                            {shop.name}
                        </h1>
                        <p className="text-sm print:text-xs">
                            {shop.addressLine1}
                        </p>
                        <p className="text-sm print:text-xs">
                            Mobile: {shop.mobile}
                        </p>
                    </div>

                    {/* Invoice Info */}
                    <div className="flex justify-between items-start text-xs mb-4 print:text-[12px]">
                        <div>
                            <p>
                                <span className="font-semibold">Inv. No:</span>{" "}
                                {invoice.invNo}
                            </p>
                            <p>
                                <span className="font-semibold">
                                    Customer Name:
                                </span>{" "}
                                {invoice.customerName}
                            </p>
                            <p>
                                <span className="font-semibold">Sold By:</span>{" "}
                                {invoice.soldBy}
                            </p>
                            <p>
                                <span className="font-semibold">Date:</span>{" "}
                                {invoice.date}
                            </p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mt-4 border-t border-dashed py-2 text-sm print:text-xs">
                        {items.map((it) => (
                            <div
                                key={it.sl}
                                className="flex items-center justify-between gap-2 flex-wrap py-2"
                            >
                                <p className="leading-2.5">
                                    {it.sl}. {it.name}
                                </p>
                                <p className="leading-2.5">
                                    {it.price} * {it.qty} ={" "}
                                    {(it.qty * it.price).toFixed(2)} Tk
                                </p>
                            </div>
                        ))}
                    </div>
                    {/* echnace */}
                    {data?.status == "exhance" && (
                        <div className="grid grid-cols-2 gap-4 border-t border-dashed pt-2 text-[12px] print:text-xs">
                            <div className="border-r border-dashed pr-2">
                                <small className="text-neutral text-[10px]">
                                    Old Product
                                </small>
                                {exitems.map((it) => (
                                    <div
                                        key={it.sl}
                                        className="flex items-center gap-2 flex-wrap py-2"
                                    >
                                        <p className="leading-2.5">
                                            {it.sl}. {it.name}
                                        </p>
                                        <p className="leading-2.5">
                                            {it.price} * {it.qty} ={" "}
                                            {(it.qty * it.price).toFixed(2)} Tk
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <small className="text-neutral text-[10px]">
                                    New Product
                                </small>
                                {exNitems.map((it) => (
                                    <div
                                        key={it.sl}
                                        className="flex items-center gap-2 flex-wrap py-2"
                                    >
                                        <p className="leading-2.5">
                                            {it.sl}. {it.name}
                                        </p>
                                        <p className="leading-2.5">
                                            {it.price} * {it.qty} ={" "}
                                            {(it.qty * it.price).toFixed(2)} Tk
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="mt-2 flex flex-col text-xs print:text-[12px]">
                        <div className="py-1.5 border-t border-dashed">
                            <span>Payment Method</span>{" "}
                            <div className="font-medium uppercase w-full mt-0.5">
                                {payment?.paymentList
                                    ?.filter((val) => Number(val?.amount) > 0)
                                    ?.map((val, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between"
                                        >
                                            <p>{val?.system}</p>
                                            <p>
                                                {(
                                                    Number(val?.amount) || 0
                                                ).toFixed(2)}{" "}
                                                Tk
                                            </p>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div className="flex justify-between py-1 border-t border-dashed">
                            <span>Grand Total</span>{" "}
                            <span className="font-medium">
                                {payment.totalamount}
                            </span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span>Net Discount</span>{" "}
                            <span className="font-medium">
                                (-
                                {(
                                    Number(totalPriceAmount) -
                                    Number(payment.totalamount)
                                ).toFixed(2)}
                                )
                            </span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span>Total</span>{" "}
                            <span className="font-medium">
                                {payment.totalapay}
                            </span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span>Due</span>{" "}
                            <span className="font-medium">
                                {payment.totaladue}
                            </span>
                        </div>
                        <div className="flex justify-between py-1 border-t border-dashed font-semibold">
                            <span>Paid</span> <span>{payment.totalapay}</span>
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-center print:text-[12px]">
                        <p className="font-semibold">
                            In Words:{" "}
                            <span className="font-normal capitalize">
                                {inWords}
                            </span>
                        </p>
                    </div>

                    <div className="mt-3 text-xs text-center space-y-1 print:text-[12px]">
                        <p>Vat included with price</p>
                        <p>No change on discount product</p>
                        <p>No money refund on any product</p>
                        <p>
                            Regular product changeable within 7 days with
                            invoice slip
                        </p>
                    </div>

                    <div className="mt-2 text-xs text-center print:text-[12px]">
                        <p>Thanks for shopping with us</p>
                        <p>Email: {shop.email}</p>
                        <p className="mt-1 text-xs print:text-[10px]">
                            Software powered by CTG IT Soft
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 justify-center print:hidden mt-3">
                    <button
                        onClick={handlePrint}
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                    >
                        <Printer size={13} /> Print Now
                    </button>
                    <button
                        onClick={() => {
                            setOpen(!open);
                            router.visit(redirect ?? route("sales.add"));
                        }}
                        className="btn btn-error btn-sm"
                    >
                        <X size={13} /> Not Yet
                    </button>
                </div>
            </div>
        </dialog>
    );
}
