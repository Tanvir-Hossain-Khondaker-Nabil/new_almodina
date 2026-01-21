import React from 'react';
import Invoice from './Invoice';

export default function Print({ sale }) {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);

        const afterPrint = () => {
            setTimeout(() => {
                if (window.opener) {
                    window.close();
                }
            }, 1000);
        };

        window.addEventListener('afterprint', afterPrint);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('afterprint', afterPrint);
        };
    }, []);

    return (
        <div className="print-container text-center">
            <Invoice sale={sale} />
        </div>
    );
}