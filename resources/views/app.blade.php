<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="theme-color" content="#22130f">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="description" content="Explore artisan cakes, pastries and custom creations, then send your bakery inquiry in a few elegant steps.">
        @if (request()->is('staff-login'))
            <meta name="robots" content="noindex, nofollow, noarchive">
        @endif
        <meta property="og:title" content="Sweet Boutique · Pasticceria & Bakery">
        <meta property="og:description" content="A beautiful tablet-first bakery catalogue and inquiry experience.">
        <meta property="og:image" content="{{ url('/assets/bakery-collection.png') }}">
        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="icon" href="/icon.svg" type="image/svg+xml">
        <title inertia>Sweet Boutique · Pasticceria Catalogue</title>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>
