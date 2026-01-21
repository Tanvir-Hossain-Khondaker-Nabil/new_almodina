<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    protected $availableLocales = ['en', 'bn'];

    public function handle(Request $request, Closure $next): Response
    {
        // Priority: Session > Cookie > Accept-Language header > Config
        $locale = $this->getPreferredLocale($request);

        if (in_array($locale, $this->availableLocales)) {
            App::setLocale($locale);
            Session::put('locale', $locale);
            
            // Also set cookie for persistence across sessions
            cookie()->queue('locale', $locale, 60 * 24 * 30); // 30 days
        }

        return $next($request);
    }

    protected function getPreferredLocale(Request $request): string
    {
        // 1. Check session first
        if (Session::has('locale')) {
            $sessionLocale = Session::get('locale');
            if (in_array($sessionLocale, $this->availableLocales)) {
                return $sessionLocale;
            }
        }

        // 2. Check cookie
        if ($request->hasCookie('locale')) {
            $cookieLocale = $request->cookie('locale');
            if (in_array($cookieLocale, $this->availableLocales)) {
                return $cookieLocale;
            }
        }

        // 3. Check Accept-Language header
        $browserLocale = $request->getPreferredLanguage($this->availableLocales);
        if ($browserLocale) {
            return $browserLocale;
        }

        // 4. Fallback to config
        return config('app.locale', 'en');
    }
}