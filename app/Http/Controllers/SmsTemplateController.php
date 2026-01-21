<?php

namespace App\Http\Controllers;

use App\Models\SmsTemplate;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class SmsTemplateController extends Controller
{
    // Display list of SMS templates (only user's own)
    public function index(Request $request)
    {
        $templates = SmsTemplate::where('created_by', auth()->id())
            ->latest()
            ->filter($request->only('search', 'is_active'))
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('sms-templates/Index', [
            'filters' => $request->only('search', 'is_active'),
            'templates' => $templates,
            'totalTemplates' => SmsTemplate::where('created_by', auth()->id())->count(),
            'activeTemplates' => SmsTemplate::where('created_by', auth()->id())
                ->where('is_active', true)->count(),
        ]);
    }

    // Show create form
    public function create()
    {
        // Check if user already has a template (active or inactive)
        $existingTemplate = SmsTemplate::where('created_by', auth()->id())->first();
        
        if ($existingTemplate) {
            return redirect()->route('sms-templates.edit', $existingTemplate)
                ->with('info', 'আপনি ইতিমধ্যে একটি SMS Gateway তৈরি করেছেন। আপনি শুধুমাত্র এটি এডিট করতে পারবেন।');
        }

        return Inertia::render('sms-templates/Create', [
            'defaults' => [
                'api_url' => 'https://api.example.com/sms/send',
                'is_active' => true,
            ],
        ]);
    }

    // Store new template
    public function store(Request $request)
    {
        // Check if user already has a template (including soft deleted)
        $existing = SmsTemplate::withTrashed()->where('created_by', auth()->id())->exists();
        
        if ($existing) {
            throw ValidationException::withMessages([
                'general' => 'প্রতি ইউজার শুধুমাত্র একটি SMS Gateway তৈরি করতে পারবেন।'
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'api_key' => 'required|string|max:255',
            'api_secret' => 'required|string|max:255',
            'api_url' => 'required|url|max:500',
            'sender_id' => 'required|string|max:20',
            'is_active' => 'boolean',
            'balance' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        // Add created_by
        $validated['created_by'] = auth()->id();

        // Create template
        SmsTemplate::create($validated);

        return redirect()->route('sms-templates.index')
            ->with('success', 'SMS Gateway কনফিগারেশন সফলভাবে তৈরি হয়েছে!');
    }

    // Show edit form
    public function edit(SmsTemplate $smsTemplate)
    {
        // Authorization - only creator can edit
        if ($smsTemplate->created_by !== auth()->id()) {
            abort(403, 'আপনি এই Gateway এডিট করার অনুমতি পাননি।');
        }

        // Don't mask here - let the model handle it through accessors
        return Inertia::render('sms-templates/Edit', [
            'template' => $smsTemplate,
        ]);
    }

    // Update template
    public function update(Request $request, SmsTemplate $smsTemplate)
    {
        // Authorization - only creator can update
        if ($smsTemplate->created_by !== auth()->id()) {
            abort(403, 'আপনি এই Gateway আপডেট করার অনুমতি পাননি।');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'api_key' => 'nullable|string|max:255',
            'api_secret' => 'nullable|string|max:255',
            'api_url' => 'required|url|max:500',
            'sender_id' => 'required|string|max:20',
            'is_active' => 'boolean',
            'balance' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        // Handle API key update - if it's masked, keep original
        if (isset($validated['api_key'])) {
            if (strpos($validated['api_key'], '***') !== false || empty($validated['api_key'])) {
                // Masked or empty - don't update
                unset($validated['api_key']);
            }
        }

        // Handle API secret update
        if (isset($validated['api_secret'])) {
            if (strpos($validated['api_secret'], '***') !== false || empty($validated['api_secret'])) {
                // Masked or empty - don't update
                unset($validated['api_secret']);
            }
        }

        $smsTemplate->update($validated);

        return redirect()->route('sms-templates.index')
            ->with('success', 'SMS Gateway কনফিগারেশন সফলভাবে আপডেট হয়েছে!');
    }

    // Delete template
    public function destroy(SmsTemplate $smsTemplate)
    {
        // Authorization - only creator can delete
        if ($smsTemplate->created_by !== auth()->id()) {
            abort(403, 'আপনি এই Gateway ডিলিট করার অনুমতি পাননি।');
        }

        $smsTemplate->delete();

        return redirect()->route('sms-templates.index')
            ->with('success', 'SMS Gateway কনফিগারেশন সফলভাবে ডিলিট হয়েছে!');
    }

    // Toggle active status
    public function toggleStatus(SmsTemplate $smsTemplate)
    {
        // Authorization - only creator can toggle
        if ($smsTemplate->created_by !== auth()->id()) {
            abort(403, 'আপনি এই Gateway এর স্ট্যাটাস পরিবর্তন করার অনুমতি পাননি।');
        }

        $smsTemplate->update([
            'is_active' => !$smsTemplate->is_active,
        ]);

        return back()->with('success', 'স্ট্যাটাস সফলভাবে আপডেট হয়েছে!');
    }

    // Test SMS Gateway
    public function test(SmsTemplate $smsTemplate)
    {
        // Authorization - only creator can test
        if ($smsTemplate->created_by !== auth()->id()) {
            abort(403, 'আপনি এই Gateway টেস্ট করার অনুমতি পাননি।');
        }

        try {
            $smsService = new \App\Services\SmsService($smsTemplate->id);
            $testResult = $smsService->testConnection();

            if ($testResult['success']) {
                return back()->with('success', 'SMS Gateway টেস্ট সফল! ' . ($testResult['message'] ?? ''));
            } else {
                return back()->with('error', 'SMS Gateway টেস্ট ব্যর্থ: ' . ($testResult['message'] ?? ''));
            }
        } catch (\Exception $e) {
            return back()->with('error', 'SMS Gateway টেস্ট ব্যর্থ: ' . $e->getMessage());
        }
    }

    // Check balance
    public function checkBalance(SmsTemplate $smsTemplate)
    {
        // Authorization - only creator can check balance
        if ($smsTemplate->created_by !== auth()->id()) {
            abort(403, 'আপনি এই Gateway এর ব্যালেন্স চেক করার অনুমতি পাননি।');
        }

        try {
            $smsService = new \App\Services\SmsService($smsTemplate->id);
            $balance = $smsService->getBalance();

            $smsTemplate->update([
                'balance' => $balance,
                'last_balance_check' => now(),
            ]);

            return back()->with('success', 'ব্যালেন্স আপডেট হয়েছে: ' . $balance);
        } catch (\Exception $e) {
            return back()->with('error', 'ব্যালেন্স চেক ব্যর্থ: ' . $e->getMessage());
        }
    }

    // Show sending interface
    public function sendForm(SmsTemplate $smsTemplate)
    {
        // Authorization - only creator can send
        if ($smsTemplate->created_by !== auth()->id()) {
            abort(403, 'আপনি এই Gateway থেকে SMS পাঠানোর অনুমতি পাননি।');
        }

        return Inertia::render('sms-templates/Send', [
            'template' => $smsTemplate,
        ]);
    }

    // Send test SMS
    public function sendTest(Request $request, SmsTemplate $smsTemplate)
    {
        // Authorization - only creator can send test SMS
        if ($smsTemplate->created_by !== auth()->id()) {
            abort(403, 'আপনি এই Gateway থেকে টেস্ট SMS পাঠানোর অনুমতি পাননি।');
        }

        $validated = $request->validate([
            'phone_number' => 'required|string|max:20',
            'message' => 'required|string|max:160',
        ]);

        try {
            $smsService = new \App\Services\SmsService($smsTemplate->id);
            $result = $smsService->sendSms(
                $validated['phone_number'], 
                $validated['message']
            );

            if ($result['success']) {
                return back()->with('success', 'টেস্ট SMS সফলভাবে পাঠানো হয়েছে! ' . 
                    ($result['message_id'] ? 'Message ID: ' . $result['message_id'] : ''));
            } else {
                return back()->with('error', 'SMS পাঠানো ব্যর্থ: ' . ($result['message'] ?? ''));
            }
        } catch (\Exception $e) {
            return back()->with('error', 'SMS পাঠানো ব্যর্থ: ' . $e->getMessage());
        }
    }

    // Helper method to mask API key for display
    private function maskApiKey($apiKey)
    {
        if (strlen($apiKey) <= 8) {
            return $apiKey;
        }
        return substr($apiKey, 0, 4) . '***' . substr($apiKey, -4);
    }

    // Helper method to mask API secret for display
    private function maskApiSecret($apiSecret)
    {
        if (strlen($apiSecret) <= 8) {
            return $apiSecret;
        }
        return '********' . substr($apiSecret, -8);
    }
}