<?php
// app/Http/Middleware/Permission.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Permission
{
    public function handle(Request $request, Closure $next, $permission): Response
    {
        // Check if user is authenticated
        if (!auth()->check()) {
            return redirect()->route('login');
        }

        $user = auth()->user();

        // Admin gets automatic access to everything
        if ($user->hasRole('Admin')) {
            return $next($request);
        }

        // Check permission for non-Admin users
        if (!$user->can($permission)) {
            abort(403, 'You do not have permission to access this page.');
        }

        return $next($request);
    }
}