import { usePage } from "@inertiajs/react";
import React, { useEffect } from "react";
import { Bounce, toast, ToastContainer } from "react-toastify";

export default function GuestLayout({ children }) {
    const { flash } = usePage().props;

    // make flash message
    useEffect(() => {
        if (flash.error) {
            toast.error(flash.error);
        }
        if (flash.success) {
            toast.success(flash.success);
        }
    }, [flash]);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-cover bg-no-repeat bg-center bg-[url('/media/static/loginbg.svg')]">
            <div className="bg-white rounded-box shadow-md w-full sm:max-w-md p-10">
                <div className="text-center mb-5">
                    <h1 className="text-lg font-bold text-gray-900">
                        Welcome back
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Please login to your account
                    </p>
                </div>
                {children}
            </div>

            <ToastContainer
                position="bottom-right"
                autoClose={1000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
                transition={Bounce}
            />
        </div>
    );
}
