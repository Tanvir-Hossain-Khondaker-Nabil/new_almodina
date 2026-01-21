<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Illuminate\Http\Request;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Set language locale
     */
    public function switchLocale(Request $request)
    {
        $locale = $request->input('locale');
        $availableLocales = ['en', 'bn'];

        if (in_array($locale, $availableLocales)) {
            // Store in session - the middleware will handle the rest
            Session::put('locale', $locale);
            
            return redirect()->back()->with('success', "Language changed to " . ($locale === 'en' ? 'English' : 'Bengali'));
        }

        return redirect()->back()->with('error', 'Invalid language selection');
    }
}