import React, { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Globe, ChevronDown, Check, Settings } from 'lucide-react';

const LanguageSwitcher = ({ className = '' }) => {
    const { props } = usePage();
    const { locale, availableLocales } = props;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const switchLanguage = (newLocale) => {
        router.post('/switch-locale', { locale: newLocale }, {
            preserveState: true,
            preserveScroll: true,
        });
        setIsOpen(false);
    };

    // Get current language info
    const currentLanguage = availableLocales[locale] || { native: 'English', code: 'en' };

    return (
        <div className={`relative inline-block ${className}`} ref={dropdownRef}>
            {/* Main Button - Modern Compact Design */}
            <button
                type="button"
                className="group relative inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-20 shadow-sm"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Change language"
            >
                {/* Globe Icon */}
                <div className="relative">
                    <Globe 
                        size={20} 
                        className="text-gray-600 group-hover:text-red-600 transition-colors" 
                    />
                    {/* Active indicator */}
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </div>
                
                {/* Language Code */}
                <span className={`ml-2 text-sm font-bold uppercase tracking-wider text-gray-700 group-hover:text-red-600 transition-colors ${locale === 'bn' ? 'bangla-font' : ''}`}>
                    {locale}
                </span>
                
                {/* Chevron Icon with animation */}
                <ChevronDown 
                    size={16} 
                    className={`ml-1 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
                
                {/* Hover effect ring */}
                <div className="absolute inset-0 rounded-xl ring-1 ring-transparent group-hover:ring-red-200 transition-all"></div>
            </button>

            {/* Dropdown Menu - Modern Design */}
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-2xl bg-white border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    {/* Dropdown Header */}
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <Settings size={16} className="text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-800">Language Settings</h3>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Select your preferred language</p>
                    </div>

                    {/* Language Options */}
                    <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar">
                        {Object.entries(availableLocales).map(([code, lang]) => {
                            const isActive = locale === code;
                            
                            return (
                                <button
                                    key={code}
                                    onClick={() => switchLanguage(code)}
                                    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 group ${
                                        isActive 
                                            ? 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200' 
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Flag/Icon */}
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center border border-gray-200 group-hover:border-red-200 transition-colors">
                                            <span className="text-lg">
                                                {code === 'en' ? '🇺🇸' : code === 'bn' ? '🇧🇩' : '🌐'}
                                            </span>
                                        </div>
                                        
                                        {/* Language Info */}
                                        <div className="text-left">
                                            <span className={`text-sm font-semibold block text-gray-800 group-hover:text-red-600 transition-colors ${code === 'bn' ? 'bangla-font' : ''}`}>
                                                {lang.native}
                                            </span>
                                            <span className="text-xs text-gray-500 block capitalize">
                                                {code === 'en' ? 'English' : code === 'bn' ? 'Bengali' : code}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                                                <Check size={12} className="text-white" />
                                            </div>
                                            <span className="text-xs font-bold text-red-600 ml-2 uppercase tracking-wider">
                                                Active
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Inactive Indicator */}
                                    {!isActive && (
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronDown size={16} className="text-gray-400 rotate-270" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Dropdown Footer */}
                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                <span className="font-bold">Current:</span> {currentLanguage.native}
                            </span>
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold uppercase tracking-wider">
                                {locale}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom scrollbar styles */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #9ca3af;
                }
                .rotate-270 {
                    transform: rotate(-90deg);
                }
            `}</style>
        </div>
    );
};

export default LanguageSwitcher;