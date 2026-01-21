import React from 'react';

export default function TextInput({ 
    type = 'text', 
    className = '', 
    ...props 
}) {
    return (
        <input
            type={type}
            className={`border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm ${className}`}
            {...props}
        />
    );
}