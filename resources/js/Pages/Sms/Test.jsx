import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/Layout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import { Smartphone, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

export default function SmsTest({ auth }) {
    const [formData, setFormData] = useState({
        phone: '+8801XXXXXXXXX',
        message: 'Test SMS from ' + auth.user.name + ' - ' + new Date().toLocaleString(),
    });
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const response = await axios.post(route('sms.test'), formData);
            setResult(response.data);
        } catch (error) {
            setResult({
                success: false,
                message: 'Error: ' + error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">SMS Testing Panel</h2>}
        >
            <Head title="SMS Testing" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    MIMSMS Sandbox Testing
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Test your SMS configuration. In sandbox mode, SMS will be logged instead of actually sent.
                                </p>
                                
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700">
                                                <strong>টেস্ট করার পদ্ধতি:</strong>
                                                <ol className="list-decimal pl-5 mt-2 space-y-1">
                                                    <li>নতুন Supplier যোগ করুন</li>
                                                    <li>"Send Welcome SMS" চেকবক্স টিক দিন</li>
                                                    <li>Supplier সেভ করুন</li>
                                                    <li>Laravel Log চেক করুন: <code>tail -f storage/logs/laravel.log</code></li>
                                                    <li>Log এ SMS ডিটেইলস দেখতে পাবেন</li>
                                                </ol>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <InputLabel htmlFor="phone" value="Phone Number *" />
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Smartphone className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <TextInput
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            className="pl-10 block w-full"
                                            placeholder="+8801XXXXXXXXX"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Bangladeshi format: +8801XXXXXXXXX
                                    </p>
                                </div>

                                <div>
                                    <InputLabel htmlFor="message" value="Message *" />
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MessageSquare className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <textarea
                                            id="message"
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                            className="pl-10 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                            rows="4"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Character count: {formData.message.length} (SMS count: {Math.ceil(formData.message.length / 160)})
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            Current Mode: <span className="font-semibold text-green-600">Sandbox</span>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Check logs at: <code>storage/logs/laravel.log</code>
                                        </p>
                                    </div>
                                    <PrimaryButton disabled={loading}>
                                        {loading ? 'Sending...' : 'Send Test SMS'}
                                    </PrimaryButton>
                                </div>
                            </form>

                            {/* Result Display */}
                            {result && (
                                <div className={`mt-8 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <div className="flex items-start">
                                        {result.success ? (
                                            <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-red-500 mr-3" />
                                        )}
                                        <div>
                                            <h4 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                                {result.success ? 'SMS Sent Successfully!' : 'SMS Failed!'}
                                            </h4>
                                            <p className={`mt-1 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                                {result.message}
                                            </p>
                                            {result.sandbox && (
                                                <div className="mt-2 p-2 bg-yellow-100 rounded">
                                                    <p className="text-sm text-yellow-800">
                                                        <strong>Sandbox Mode:</strong> SMS was logged instead of actually sent.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Laravel Log Example */}
                            <div className="mt-10">
                                <h4 className="font-medium text-gray-900 mb-3">Expected Log Output:</h4>
                                <div className="bg-[#1e4d2b] text-white text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                    <div className="text-green-400">[2024-01-01 12:00:00] local.INFO: SMS Sandbox Mode:</div>
                                    <div className="ml-4">
                                        <div className="text-blue-400">"to": "+8801XXXXXXXXX",</div>
                                        <div className="text-blue-400">"message": "Dear John Doe, Welcome to ABC Company!...",</div>
                                        <div className="text-blue-400">"provider": "mimsms",</div>
                                        <div className="text-yellow-400">"config": {"{"}</div>
                                        <div className="ml-4 text-blue-400">"api_key": "sandbox_key",</div>
                                        <div className="ml-4 text-blue-400">"sender_id": "NEXORYN",</div>
                                        <div className="ml-4 text-green-400">"sandbox": true</div>
                                        <div className="text-yellow-400">{"}"}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}