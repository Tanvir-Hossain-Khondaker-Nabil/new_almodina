<?php

namespace Database\Seeders;

use App\Models\Unit;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        RolesAndPermissionsSeeder::class;

        $units = [
            // Weight units
            ['name' => 'Ton', 'short_code' => 'ton', 'type' => 'weight', 'base_unit' => 'kg', 'conversion_factor' => 1000],
            ['name' => 'Kilogram', 'short_code' => 'kg', 'type' => 'weight', 'base_unit' => 'kg', 'conversion_factor' => 1],
            ['name' => 'Gram', 'short_code' => 'g', 'type' => 'weight', 'base_unit' => 'kg', 'conversion_factor' => 0.001],

            // Volume units
            ['name' => 'Liter', 'short_code' => 'L', 'type' => 'volume', 'base_unit' => 'liter', 'conversion_factor' => 1],
            ['name' => 'Milliliter', 'short_code' => 'ml', 'type' => 'volume', 'base_unit' => 'liter', 'conversion_factor' => 0.001],

            // Piece units
            ['name' => 'Piece', 'short_code' => 'pc', 'type' => 'piece', 'base_unit' => 'piece', 'conversion_factor' => 1],
            ['name' => 'Dozen', 'short_code' => 'dz', 'type' => 'piece', 'base_unit' => 'piece', 'conversion_factor' => 12],
            ['name' => 'Box', 'short_code' => 'box', 'type' => 'piece', 'base_unit' => 'piece', 'conversion_factor' => 1],

            // Length units
            ['name' => 'Meter', 'short_code' => 'm', 'type' => 'length', 'base_unit' => 'meter', 'conversion_factor' => 1],
            ['name' => 'Centimeter', 'short_code' => 'cm', 'type' => 'length', 'base_unit' => 'meter', 'conversion_factor' => 0.01],
        ];

        foreach ($units as $unit) {
            Unit::create($unit);
        }
    }
}
