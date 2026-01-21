import { Head, usePage } from "@inertiajs/react";
import React from "react";

export default function PageHeader({ title, subtitle = "", children }) {
    const { appName } = usePage().props;
    return (
        <div className="border-b border-gray-100 pb-5 mb-5 flex items-center justify-between gap-3">
            <div>
                <Head title={`${title} - ${appName}`} />
                <h1 className="text-base text-gray-900 font-medium">{title}</h1>
                <p className="text-sm font-normal text-gray-500">{subtitle}</p>
            </div>

            {children}
        </div>
    );
}
