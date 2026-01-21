import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Create({ leave_balance, leave_types }) {
    const [processing, setProcessing] = useState(false);
    const [totalDays, setTotalDays] = useState(0);
    const [leaveDays, setLeaveDays] = useState(0);
    const [selectedType, setSelectedType] = useState('');
    const [availableBalance, setAvailableBalance] = useState(0);

    const { data, setData, post, errors } = useForm({
        type: '',
        start_date: '',
        end_date: '',
        reason: '',
        is_half_day: false,
        half_day_type: '',
        attachment: null,
    });

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        
        post(route('leave.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
            },
            onError: () => {
                setProcessing(false);
            }
        });
    };

    const handleTypeChange = (type) => {
        setSelectedType(type);
        setData('type', type);
        
        // Set available balance for the selected type
        if (type && leave_balance[type] !== undefined) {
            setAvailableBalance(leave_balance[type]);
        } else {
            setAvailableBalance(0);
        }
        
        // Reset half day if type changes
        if (type) {
            setData('is_half_day', false);
            setData('half_day_type', '');
        }
    };

    const calculateLeaveDays = () => {
        if (!data.start_date || !data.end_date) {
            setTotalDays(0);
            setLeaveDays(0);
            return;
        }

        const start = new Date(data.start_date);
        const end = new Date(data.end_date);
        
        if (start > end) {
            setTotalDays(0);
            setLeaveDays(0);
            return;
        }

        let days = 0;
        let leaveDaysCount = 0;
        
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            // Skip Fridays (5 = Friday)
            if (date.getDay() !== 5) {
                days++;
                leaveDaysCount++;
            }
        }

        // Adjust for half day
        let adjustedDays = days;
        if (data.is_half_day) {
            adjustedDays = days - 0.5;
        }

        setTotalDays(days);
        setLeaveDays(adjustedDays);
    };

    // Calculate days when dates or half day changes
    useEffect(() => {
        calculateLeaveDays();
    }, [data.start_date, data.end_date, data.is_half_day]);

    // Check if requested days exceed balance
    useEffect(() => {
        if (selectedType && leave_balance[selectedType] !== undefined && leaveDays > availableBalance) {
            alert(`Warning: You are requesting ${leaveDays} days but only ${availableBalance} days available.`);
        }
    }, [leaveDays, selectedType, availableBalance]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('File size should be less than 2MB');
                e.target.value = '';
                return;
            }
            
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                alert('Only PDF, JPG, and PNG files are allowed');
                e.target.value = '';
                return;
            }
            
            setData('attachment', file);
        }
    };

    const getLeaveTypeLabel = (type) => {
        const typeObj = leave_types.find(t => t.value === type);
        return typeObj ? typeObj.label : type;
    };

    return (
        <>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Apply for Leave</h1>
                <p className="text-gray-600">Submit your leave application for approval</p>
            </div>

            {/* Leave Balance Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Leave Balance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Object.entries(leave_balance).map(([type, balance]) => (
                        <div key={type} className={`border rounded-lg p-4 ${selectedType === type ? 'ring-2 ring-blue-500' : ''}`}>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                                {getLeaveTypeLabel(type)}
                            </div>
                            <div className={`text-2xl font-bold ${selectedType === type ? 'text-blue-600' : 'text-gray-900'}`}>
                                {balance} days
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                Available balance
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Leave Application Form */}
            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={submit} className="space-y-6">
                    {/* Leave Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Leave Type *
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {leave_types.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleTypeChange(type.value)}
                                    className={`p-4 border rounded-lg text-center transition-colors ${
                                        selectedType === type.value
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="font-medium">{type.label}</div>
                                    {leave_balance[type.value] !== undefined && (
                                        <div className="text-sm text-gray-500 mt-1">
                                            Available: {leave_balance[type.value]} days
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        {errors.type && (
                            <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                        )}
                    </div>

                    {/* Dates Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                value={data.start_date}
                                onChange={e => setData('start_date', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            {errors.start_date && (
                                <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date *
                            </label>
                            <input
                                type="date"
                                value={data.end_date}
                                onChange={e => setData('end_date', e.target.value)}
                                min={data.start_date || new Date().toISOString().split('T')[0]}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            {errors.end_date && (
                                <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
                            )}
                        </div>
                    </div>

                    {/* Half Day Option */}
                    {selectedType && (
                        <div>
                            <div className="flex items-center mb-4">
                                <input
                                    type="checkbox"
                                    id="is_half_day"
                                    checked={data.is_half_day}
                                    onChange={e => setData('is_half_day', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_half_day" className="ml-2 block text-sm font-medium text-gray-700">
                                    This is a half day leave
                                </label>
                            </div>
                            
                            {data.is_half_day && (
                                <div className="ml-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Half Day Type *
                                    </label>
                                    <div className="flex space-x-4">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                value="first_half"
                                                checked={data.half_day_type === 'first_half'}
                                                onChange={e => setData('half_day_type', e.target.value)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                required={data.is_half_day}
                                            />
                                            <span className="ml-2 text-sm text-gray-700">First Half (9 AM - 1 PM)</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                value="second_half"
                                                checked={data.half_day_type === 'second_half'}
                                                onChange={e => setData('half_day_type', e.target.value)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                                required={data.is_half_day}
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Second Half (1 PM - 5 PM)</span>
                                        </label>
                                    </div>
                                    {errors.half_day_type && (
                                        <p className="mt-1 text-sm text-red-600">{errors.half_day_type}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Days Calculation Summary */}
                    {(data.start_date && data.end_date) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-blue-800 mb-2">Leave Days Calculation</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <div className="text-sm text-blue-600">Total Calendar Days</div>
                                    <div className="text-lg font-bold text-blue-800">{totalDays} days</div>
                                </div>
                                <div>
                                    <div className="text-sm text-blue-600">Excluding Fridays</div>
                                    <div className="text-lg font-bold text-blue-800">
                                        {totalDays} days (Fridays already excluded)
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-blue-600">Leave Days Required</div>
                                    <div className="text-lg font-bold text-blue-800">{leaveDays} days</div>
                                </div>
                            </div>
                            
                            {selectedType && leave_balance[selectedType] !== undefined && (
                                <div className="mt-3">
                                    <div className={`text-sm font-medium ${
                                        leaveDays > availableBalance ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                        Available {selectedType} leave balance: {availableBalance} days
                                    </div>
                                    {leaveDays > availableBalance && (
                                        <div className="text-sm text-red-600 mt-1">
                                            ⚠️ Warning: You are requesting more days than available
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Reason for Leave */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Leave *
                        </label>
                        <textarea
                            value={data.reason}
                            onChange={e => setData('reason', e.target.value)}
                            rows={4}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Please provide detailed reason for your leave..."
                            required
                            minLength={10}
                            maxLength={500}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                            {data.reason?.length || 0}/500 characters
                        </div>
                        {errors.reason && (
                            <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                        )}
                    </div>

                    {/* Attachment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Attachment (Optional)
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {data.attachment ? (
                                        <>
                                            <div className="text-green-600 mb-2">
                                                ✓ File selected
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {data.attachment.name || 'File attached'}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => setData('attachment', null)}
                                                className="text-sm text-red-600 hover:text-red-800 mt-2"
                                            >
                                                Remove file
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                            </svg>
                                            <p className="text-sm text-gray-500">
                                                <span className="font-semibold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                PDF, JPG, PNG up to 2MB
                                            </p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                            </label>
                        </div>
                        {errors.attachment && (
                            <p className="mt-1 text-sm text-red-600">{errors.attachment}</p>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => router.visit(route('leave.index'))}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                            disabled={processing}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !selectedType}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                        >
                            {processing ? (
                                <>
                                    <span className="animate-spin mr-2">⟳</span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Leave Application'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}