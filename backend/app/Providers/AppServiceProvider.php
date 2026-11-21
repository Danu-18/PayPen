<?php

namespace App\Providers;

use App\Services\Gateways\PaymentGatewayInterface;
use App\Services\Gateways\SandboxGatewayAdapter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(PaymentGatewayInterface::class, SandboxGatewayAdapter::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
