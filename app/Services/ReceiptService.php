<?php

namespace App\Services;

use Dashed\ReceiptPrinter\ReceiptPrinter;

class ReceiptService
{
    public function printRequest(float $amount, $sale): void
    {
        $transactionId  = $sale->invoice_no ?? '122334444';
        $mid            = '123123456';

        $business = $sale->creator->business ?? null;

        $store_name     = $business->name    ?? 'YOURMART';
        $store_address  = $business->address ?? 'Mart Address';
        $store_phone    = $business->phone   ?? '1234567890';
        $store_email    = $business->email   ?? 'yourmart@email.com';
        $store_website  = $business->website ?? 'yourmart.com';

        $currency = 'BDT';

        $type = config('receiptprinter.connector_type');
        $desc = config('receiptprinter.connector_descriptor');
        $port = config('receiptprinter.connector_port'); 

        $printer = new ReceiptPrinter();

        try {
            $printer->init($type, $desc, $port);
        } catch (\ArgumentCountError $e) {
            $printer->init($type, $desc);
        }

        $printer->setStore($mid, $store_name, $store_address, $store_phone, $store_email, $store_website);
        $printer->setCurrency($currency);
        $printer->setRequestAmount($amount);
        $printer->setTransactionID($transactionId);

        $logo = public_path('logo.png');
        if (is_string($logo) && file_exists($logo)) {
            $printer->setLogo($logo);
        }

        $printer->setQRcode([
            'tid'    => $transactionId,
            'amount' => $amount,
        ]);

        $printer->printRequest();
    }
}

