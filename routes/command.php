<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;



    Route::get('/clear', function () {
        Artisan::call('cache:clear');
        Artisan::call('config:clear');
        Artisan::call('config:cache');
        Artisan::call('view:clear');
        return "Cache is cleared";
    });


    Route::get('/migrate', function () {
        Artisan::call('migrate:fresh --seed');
        return "Database migrated fresh with seeders";
    });


    Route::get('/module', function () {
        $modules = collect(Route::getRoutes())
            ->map(fn($route) => $route->getName())
            ->filter()
            ->map(fn($name) => explode('.', $name)[0])
            ->unique()
            ->values()
            ->toArray();

        return $modules;
    });


    Route::get('/actions', function () {

        $actionMap = [
            'index' => 'view',
            'show' => 'view',
            'create' => 'create',
            'store' => 'create',
            'edit' => 'edit',
            'update' => 'edit',
            'destroy' => 'delete',
            'delete' => 'delete'
        ];


        $allActions = collect(Route::getRoutes())
            ->map(fn($route) => $route->getName())
            ->filter()
            ->map(function ($name) use ($actionMap) {

                $parts = explode('.', $name);

                if (count($parts) < 2)
                    return null;

                $method = end($parts);

                return $actionMap[$method] ?? null;
            })
            ->filter()
            ->unique()
            ->values()
            ->toArray();

        return $allActions;

    });