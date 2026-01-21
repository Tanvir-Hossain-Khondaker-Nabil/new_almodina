<?php

namespace App\Services;

use App\Models\SmsTemplate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class SmsService
{
    protected $gateway;
    protected $config;

    public function __construct($gatewayId = null)
    {
        // Use provided gateway ID or get the primary gateway for authenticated user
        if ($gatewayId) {
            $this->gateway = SmsTemplate::find($gatewayId);
        } else {
            $this->gateway = $this->getUserPrimaryGateway();
        }

        if (!$this->gateway || !$this->gateway->is_configured) {
            throw new \Exception('No configured SMS gateway found');
        }
    }

    protected function getUserPrimaryGateway()
    {
        // Get the primary gateway for current user
        $user = Auth::user();

        if (!$user) {
            return SmsTemplate::active()->configured()->first();
        }

        // You can implement user-specific gateway selection here
        // For example, if each user can have their own gateway preference

        return SmsTemplate::active()->configured()->first();
    }

    public function sendSms($to, $message, $template = null, $variables = [])
    {
        if (!$this->gateway) {
            return [
                'success' => false,
                'message' => 'No SMS gateway configured',
            ];
        }

        if ($template && $templateConfig = $this->getTemplate($template)) {
            $message = $this->parseTemplate($templateConfig, $variables);
        }

        $to = preg_replace('/[^0-9]/', '', $to);

        // Log for debugging (can be disabled in production)
        Log::info('SMS Request:', [
            'gateway_id' => $this->gateway->id,
            'gateway_name' => $this->gateway->name,
            'to' => $to,
            'message' => $message,
            'sender_id' => $this->config['sender_id'],
        ]);

        try {
            $response = $this->sendViaApi($to, $message);

            // Update gateway balance if returned in response
            if (isset($response['balance'])) {
                $this->gateway->update(['balance' => $response['balance']]);
            }

            return $response;
        } catch (\Exception $e) {
            Log::error('SMS sending failed: ' . $e->getMessage(), [
                'gateway_id' => $this->gateway->id,
                'gateway_name' => $this->gateway->name,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'gateway' => $this->gateway->name,
            ];
        }
    }

    protected function sendViaApi($to, $message)
    {
        $url = $this->config['api_url'];

        // Determine which API to use based on URL pattern
        $provider = $this->detectProvider($url);

        switch ($provider) {
            case 'mimsms':
                return $this->sendViaMimsms($to, $message);
            case 'twilio':
                return $this->sendViaTwilio($to, $message);
            case 'nexmo':
                return $this->sendViaNexmo($to, $message);
            case 'clicksend':
                return $this->sendViaClickSend($to, $message);
            default:
                return $this->sendViaGenericApi($to, $message);
        }
    }

    protected function sendViaMimsms($to, $message)
    {
        $response = Http::post($this->config['api_url'], [
            'api_key' => $this->config['api_key'],
            'sender_id' => $this->config['sender_id'],
            'mobile_number' => $to,
            'message' => $message,
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if ($data['status'] === 'success') {
                return [
                    'success' => true,
                    'message_id' => $data['message_id'] ?? null,
                    'message' => 'SMS sent successfully via MIMSMS',
                    'gateway' => $this->gateway->name,
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $data['message'] ?? 'Failed to send SMS',
                    'gateway' => $this->gateway->name,
                ];
            }
        }

        return [
            'success' => false,
            'message' => 'HTTP request failed',
            'gateway' => $this->gateway->name,
            'status' => $response->status(),
        ];
    }

    protected function sendViaTwilio($to, $message)
    {
        $response = Http::withBasicAuth(
            $this->config['api_key'],
            $this->config['api_secret']
        )->post($this->config['api_url'], [
                    'To' => $to,
                    'From' => $this->config['sender_id'],
                    'Body' => $message,
                ]);

        if ($response->successful()) {
            return [
                'success' => true,
                'message_id' => $response['sid'] ?? null,
                'message' => 'SMS sent successfully via Twilio',
                'gateway' => $this->gateway->name,
            ];
        }

        return [
            'success' => false,
            'message' => 'Failed to send via Twilio',
            'gateway' => $this->gateway->name,
            'error' => $response->body(),
        ];
    }

    protected function sendViaNexmo($to, $message)
    {
        $response = Http::post($this->config['api_url'], [
            'api_key' => $this->config['api_key'],
            'api_secret' => $this->config['api_secret'],
            'to' => $to,
            'from' => $this->config['sender_id'],
            'text' => $message,
        ]);

        if ($response->successful()) {
            $data = $response->json();

            if ($data['messages'][0]['status'] == '0') {
                return [
                    'success' => true,
                    'message_id' => $data['messages'][0]['message-id'] ?? null,
                    'message' => 'SMS sent successfully via Vonage/Nexmo',
                    'gateway' => $this->gateway->name,
                ];
            }
        }

        return [
            'success' => false,
            'message' => 'Failed to send via Vonage/Nexmo',
            'gateway' => $this->gateway->name,
        ];
    }

    protected function sendViaClickSend($to, $message)
    {
        $response = Http::withBasicAuth(
            $this->config['api_key'],
            ''
        )->post($this->config['api_url'], [
                    'messages' => [
                        [
                            'source' => 'php',
                            'from' => $this->config['sender_id'],
                            'to' => $to,
                            'body' => $message,
                        ]
                    ]
                ]);

        if ($response->successful()) {
            $data = $response->json();

            if ($data['response_code'] == 'SUCCESS') {
                return [
                    'success' => true,
                    'message_id' => $data['data']['messages'][0]['message_id'] ?? null,
                    'message' => 'SMS sent successfully via ClickSend',
                    'gateway' => $this->gateway->name,
                ];
            }
        }

        return [
            'success' => false,
            'message' => 'Failed to send via ClickSend',
            'gateway' => $this->gateway->name,
        ];
    }

    protected function sendViaGenericApi($to, $message)
    {
        // Generic API call for custom providers
        $response = Http::post($this->config['api_url'], [
            'to' => $to,
            'message' => $message,
            'sender' => $this->config['sender_id'],
            'api_key' => $this->config['api_key'],
        ]);

        if ($response->successful()) {
            return [
                'success' => true,
                'message' => 'SMS sent successfully via custom gateway',
                'gateway' => $this->gateway->name,
            ];
        }

        return [
            'success' => false,
            'message' => 'Failed to send via custom gateway',
            'gateway' => $this->gateway->name,
        ];
    }

    protected function detectProvider($url)
    {
        $url = strtolower($url);

        if (strpos($url, 'twilio') !== false)
            return 'twilio';
        if (strpos($url, 'nexmo') !== false)
            return 'nexmo';
        if (strpos($url, 'vonage') !== false)
            return 'nexmo';
        if (strpos($url, 'clicksend') !== false)
            return 'clicksend';
        if (strpos($url, 'mimsms') !== false)
            return 'mimsms';

        return 'generic';
    }

    protected function getTemplate($templateName)
    {
        // You can store templates in database or config
        // For now, using config, but you can modify to use database
        $templates = config('sms.templates', []);

        return $templates[$templateName] ?? null;
    }

    protected function parseTemplate($template, $variables)
    {
        foreach ($variables as $key => $value) {
            $template = str_replace('{' . $key . '}', $value, $template);
        }
        return $template;
    }

    public function testConnection($gatewayId = null)
    {
        try {
            if ($gatewayId) {
                $gateway = SmsTemplate::find($gatewayId);
                if (!$gateway || !$gateway->is_configured) {
                    return [
                        'success' => false,
                        'message' => 'Gateway not found or not configured',
                    ];
                }
                $this->gateway = $gateway;
                $this->config = [
                    'api_key' => $gateway->api_key,
                    'api_secret' => $gateway->api_secret,
                    'sender_id' => $gateway->sender_id,
                    'api_url' => $gateway->api_url,
                ];
            }

            // Try to get balance as connection test
            $balance = $this->getBalance();

            return [
                'success' => true,
                'message' => 'Connection successful',
                'balance' => $balance,
                'gateway' => $this->gateway->name,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
                'gateway' => $this->gateway->name ?? 'Unknown',
            ];
        }
    }

    public function getBalance()
    {
        $provider = $this->detectProvider($this->config['api_url']);

        switch ($provider) {
            case 'mimsms':
                return $this->getMimsmsBalance();
            case 'twilio':
                return $this->getTwilioBalance();
            default:
                return 'Balance check not available for this provider';
        }
    }

    protected function getMimsmsBalance()
    {
        try {
            $response = Http::post('https://api.mimsms.com/api/v1/balance', [
                'api_key' => $this->config['api_key'],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['balance'] ?? 'Unknown';
            }
        } catch (\Exception $e) {
            Log::error('Failed to get MIMSMS balance: ' . $e->getMessage());
        }

        return 'Unable to fetch balance';
    }

    protected function getTwilioBalance()
    {
        try {
            $response = Http::withBasicAuth(
                $this->config['api_key'],
                $this->config['api_secret']
            )->get("https://api.twilio.com/2010-04-01/Accounts/{$this->config['api_key']}/Balance.json");

            if ($response->successful()) {
                $data = $response->json();
                return $data['balance'] . ' ' . $data['currency'] ?? 'Unknown';
            }
        } catch (\Exception $e) {
            Log::error('Failed to get Twilio balance: ' . $e->getMessage());
        }

        return 'Unable to fetch balance';
    }

    public function sendSupplierWelcome($supplier, $loginUrl = null)
    {
        $variables = [
            'contact_person' => $supplier->contact_person,
            'company_name' => $supplier->company ?: config('app.name'),
            'email' => $supplier->email,
            'phone' => $supplier->phone,
            'supplier_id' => $supplier->id,
            'advance_amount' => number_format($supplier->advance_amount, 2),
        ];

        $template = $supplier->advance_amount > 0
            ? 'supplier_welcome_with_advance'
            : 'supplier_welcome';

        return $this->sendSms($supplier->phone, '', $template, $variables);
    }

    public function sendSupplierAdvanceNotification($supplier, $payment)
    {
        $variables = [
            'contact_person' => $supplier->contact_person,
            'amount' => number_format($payment->amount, 2),
            'txn_ref' => $payment->txn_ref,
            'advance_balance' => number_format($supplier->advance_amount + $payment->amount, 2),
        ];

        return $this->sendSms($supplier->phone, '', 'supplier_advance_payment', $variables);
    }

    public function sendBulk($recipients, $message, $template = null, $variables = [])
    {
        $results = [];

        foreach ($recipients as $recipient) {
            $result = $this->sendSms($recipient['phone'], $message, $template, $variables);
            $results[] = [
                'phone' => $recipient['phone'],
                'success' => $result['success'],
                'message' => $result['message'],
            ];
        }

        return $results;
    }
}