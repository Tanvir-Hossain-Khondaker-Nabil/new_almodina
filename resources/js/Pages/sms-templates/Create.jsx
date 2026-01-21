import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Eye, EyeOff, TestTube, Send } from 'lucide-react';

export default function Create({ defaults }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        api_key: '',
        api_secret: '',
        api_url: defaults.api_url || 'https://api.example.com/sms/send',
        sender_id: '',
        is_active: defaults.is_active || true,
        balance: '',
        notes: '',
    });

    const [showApiKey, setShowApiKey] = useState(false);
    const [showApiSecret, setShowApiSecret] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('sms-templates.store'));
    };

    // Common SMS providers for reference
    const smsProviders = [
        { name: 'Twilio', url: 'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json' },
        { name: 'Vonage (Nexmo)', url: 'https://rest.nexmo.com/sms/json' },
        { name: 'ClickSend', url: 'https://rest.clicksend.com/v3/sms/send' },
        { name: 'MessageBird', url: 'https://rest.messagebird.com/messages' },
        { name: 'Custom', url: '' },
    ];

    const handleProviderSelect = (provider) => {
        setData('api_url', provider.url);
    };

    return (
        <>
            <Head title="Create SMS Gateway" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link
                            href={route('sms-templates.index')}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Gateways
                        </Link>
                        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Add SMS Gateway</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Configure a new SMS gateway provider
                        </p>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-6">
                                {/* Basic Information */}
                                <div className="border-b pb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Gateway Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                                                placeholder="e.g., Twilio Production"
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Sender ID *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.sender_id}
                                                onChange={(e) => setData('sender_id', e.target.value)}
                                                className={`input input-bordered w-full ${errors.sender_id ? 'input-error' : ''}`}
                                                placeholder="e.g., COMPANY, +1234567890"
                                            />
                                            {errors.sender_id && (
                                                <p className="mt-1 text-sm text-red-600">{errors.sender_id}</p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-500">
                                                Usually your company name or phone number
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* API Configuration */}
                                <div className="border-b pb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">API Configuration</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {smsProviders.map((provider) => (
                                                <button
                                                    key={provider.name}
                                                    type="button"
                                                    onClick={() => handleProviderSelect(provider)}
                                                    className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                >
                                                    {provider.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                API URL *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.api_url}
                                                onChange={(e) => setData('api_url', e.target.value)}
                                                className={`input input-bordered w-full ${errors.api_url ? 'input-error' : ''}`}
                                                placeholder="https://api.example.com/sms/send"
                                            />
                                            {errors.api_url && (
                                                <p className="mt-1 text-sm text-red-600">{errors.api_url}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        API Key
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowApiKey(!showApiKey)}
                                                        className="text-sm text-gray-500 hover:text-gray-700"
                                                    >
                                                        {showApiKey ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                <input
                                                    type={showApiKey ? "text" : "password"}
                                                    value={data.api_key}
                                                    onChange={(e) => setData('api_key', e.target.value)}
                                                    className="input input-bordered w-full"
                                                    placeholder="••••••••••••••••"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        API Secret
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowApiSecret(!showApiSecret)}
                                                        className="text-sm text-gray-500 hover:text-gray-700"
                                                    >
                                                        {showApiSecret ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                <input
                                                    type={showApiSecret ? "text" : "password"}
                                                    value={data.api_secret}
                                                    onChange={(e) => setData('api_secret', e.target.value)}
                                                    className="input input-bordered w-full"
                                                    placeholder="••••••••••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div className="border-b pb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Current Balance
                                            </label>
                                            <input
                                                type="text"
                                                value={data.balance}
                                                onChange={(e) => setData('balance', e.target.value)}
                                                className="input input-bordered w-full"
                                                placeholder="e.g., 100 credits, $50.00"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Manually enter initial balance or leave blank
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Status
                                            </label>
                                            <div className="mt-2">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.is_active}
                                                        onChange={(e) => setData('is_active', e.target.checked)}
                                                        className="toggle toggle-success"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-700">
                                                        {data.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes
                                        </label>
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows="3"
                                            className="textarea textarea-bordered w-full"
                                            placeholder="Add any notes about this gateway configuration..."
                                        />
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Configuration Preview</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Name:</span>
                                            <p className="font-medium">{data.name || 'Not set'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Sender ID:</span>
                                            <p className="font-medium">{data.sender_id || 'Not set'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500">API URL:</span>
                                            <p className="font-medium truncate">{data.api_url || 'Not set'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Status:</span>
                                            <p className={`font-medium ${data.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                                {data.is_active ? 'Active' : 'Inactive'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Balance:</span>
                                            <p className="font-medium">{data.balance || 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end space-x-3 pt-6 border-t">
                                    <Link
                                        href={route('sms-templates.index')}
                                        className="btn btn-outline"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="btn bg-[#1e4d2b] text-white hover:bg-[#163820] disabled:opacity-50"
                                    >
                                        {processing ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm mr-2"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Create Gateway
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}