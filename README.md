# Sweet Boutique

A tablet-first bakery catalogue, customer inquiry flow, and protected administration portal.

## Included

- Live category, subcategory, search, and product filtering without page reloads
- Product detail, variants, notes, favourites, and inquiry basket
- Guided cake finder and custom-cake brief
- MySQL-backed inquiry submission with reference numbers
- Admin authentication, dashboard, inquiry workflow, category/subcategory CRUD, and product CRUD
- Responsive tablet/mobile layout and installable PWA shell

## Local environment

- PHP 8.4+
- Laravel 13
- Node.js 20+
- MySQL or MariaDB

The configured local database is `mmc_utility` on `127.0.0.1:3306` with the XAMPP `root` user.

## Start

```powershell
& 'D:\laragon\bin\php\php-8.4.16-Win32-vs17-x64\php.exe' artisan serve --host=127.0.0.1 --port=8099
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:8099`.

## Administrator access

The administration portal is available at `/staff-login`. No administrator
credentials are committed to the repository. Create the initial administrator
directly on the server with a unique password during deployment.
