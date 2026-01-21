import React, { useEffect, useRef, useState } from "react";
import BarcodeSticker from "../components/BarcodeSticker";
import { Printer, X } from "lucide-react";
import { router, useForm } from "@inertiajs/react";
import { useTranslation } from "../hooks/useTranslation";

export default function Barcode({ code: severCode, product: allProduct }) {
    const { t, locale } = useTranslation();
    const [price, setPrice] = useState(allProduct?.gross_price || 0);
    const [product, setProduct] = useState(allProduct?.sizes || null);
    const [selectedSize, setSelectedSize] = useState("");
    const [availableColors, setAvailableColors] = useState([]);
    const [barcode, setBarcode] = useState(null);

    const handleSizeChange = (e) => {
        const sizeName = e.target.value;

        // Find selected size object
        const selectedSizeObj = product.find((item) => item.name === sizeName);

        // If found, set its colors
        if (selectedSizeObj) {
            setAvailableColors(selectedSizeObj.colors || []);
        } else {
            setAvailableColors([]);
        }

        setSelectedSize(sizeName);
    };

    // form
    const [code, setCode] = useState(severCode || "");
    const findProduct = () => {
        router.get(
            route("barcode.print", {
                code: code,
            })
        );
    };

    return (
        <div className={`p-4 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <div className="print:hidden flex items-center gap-2">
                <input
                    type="search"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={t('barcode.enter_product_code', 'Enter product code')}
                    className="input"
                />
                {code && code !== "" && (
                    <button onClick={findProduct} className="btn bg-[#1e4d2b] text-white">
                        {t('barcode.find_product', 'Find Product')}
                    </button>
                )}
                {product !== null && (
                    <button onClick={()=>router.visit(route('barcode.print'))} className="btn btn-error">
                       <X size={13}/>
                    </button>
                )}
            </div>

            {product !== null && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 print:hidden">
                    {/* Size Select */}
                    <select
                        className="select"
                        value={selectedSize}
                        onChange={handleSizeChange}
                    >
                        <option value="" disabled>
                            {t('barcode.select_size', '--Size--')}
                        </option>
                        {product.map((val) => (
                            <option key={val.id} value={val.name}>
                                {val.name}
                            </option>
                        ))}
                    </select>

                    {/* Color Select */}
                    <select
                        className="select"
                        onChange={(e) => setBarcode(e.target.value)}
                    >
                        <option value="" disabled selected>
                            {t('barcode.select_color', '--Color--')}
                        </option>
                        {availableColors.length > 0 ? (
                            availableColors.map((color) => (
                                <option
                                    key={color.id}
                                    value={JSON.stringify({
                                        size: selectedSize,
                                        color: color?.name,
                                        price: price,
                                        barcode: code + "," + color?.id,
                                    })}
                                >
                                    {color.name}
                                    {" - "}
                                    {color.stock}
                                </option>
                            ))
                        ) : (
                            <option disabled>{t('barcode.no_colors_available', 'No colors available')}</option>
                        )}
                    </select>
                </div>
            )}

            {barcode && (
                <div className="mt-4 print:ml-[144px] print:mt-0 flex items-center justify-center">
                    <BarcodeSticker product={JSON.parse(barcode)} />
                </div>
            )}

            <button
                onClick={() => window.print()}
                disabled={!selectedSize || !barcode}
                className="mt-4 btn bg-[#1e4d2b] text-white print:hidden"
            >
                <Printer size={13} /> {t('barcode.print_sticker', 'Print Sticker')}
            </button>
        </div>
    );
}