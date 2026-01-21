<?php
// config/sms.php

return [
    'default_gateway_id' => env('DEFAULT_SMS_GATEWAY_ID', null),

    'templates' => [
        'supplier_welcome' => 'Dear {contact_person}, Welcome to {company_name}! Your supplier account has been created. Email: {email}, Phone: {phone}. Supplier ID: {supplier_id}.',

        'supplier_welcome_with_advance' => 'Dear {contact_person}, Welcome to {company_name}! Your supplier account has been created with an advance of {advance_amount}. Email: {email}, Phone: {phone}. Supplier ID: {supplier_id}.',

        'supplier_advance_payment' => 'Dear {contact_person}, Advance payment of {amount} received. Txn Ref: {txn_ref}. New advance balance: {advance_balance}.',
        
        'order_confirmation' => 'Dear {customer_name}, Your order #{order_id} has been confirmed. Total: {total_amount}. Thank you!',
        
        'payment_received' => 'Dear {customer_name}, Payment of {amount} received for invoice #{invoice_id}. Thank you!',
    ],
];