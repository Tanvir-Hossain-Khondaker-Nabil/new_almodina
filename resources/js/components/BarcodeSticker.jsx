import React from "react";

const BarcodeSticker = ({ product }) => {
    const { size, color, price, barcode } = product;

    return (
        <div className="w-auto border border-dashed border-neutral p-2 print:p-0 print:border-0 text-[12px] flex flex-col justify-between print:m-0">
            {/* Product Info */}
            <span className="font-bold text-center">৳{price}</span>

            {/* Barcode */}
            <div className="text-center">
                <img
                    className="w-full min-w-[100px] h-[25px] mx-auto"
                    src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${barcode}&scale=1`}
                />
            </div>

            {/*  */}
            <span className="text-center font-bold text-xs">{barcode.split(',')[0]}</span>
            <span className="font-semibold text-center text-[11px]">
                {size}/{color}
            </span>
        </div>
    );
};

export default BarcodeSticker;
