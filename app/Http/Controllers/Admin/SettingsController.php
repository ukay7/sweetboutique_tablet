<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    private const MENUS = ['overview', 'inquiries', 'products', 'categories', 'attributes', 'settings'];

    public function index(): JsonResponse
    {
        return response()->json([
            'users' => User::query()->with('role:id,name,slug,menu_items')->orderBy('name')->get(['id', 'role_id', 'name', 'email', 'is_admin', 'created_at']),
            'roles' => Role::query()->withCount('users')->orderBy('name')->get(),
            'available_menus' => self::MENUS,
        ]);
    }

    public function storeRole(Request $request): JsonResponse
    {
        $data = $this->validateRole($request);
        $role = Role::create([...$data, 'slug' => $this->uniqueRoleSlug($data['name'])]);

        return response()->json($role->loadCount('users'), 201);
    }

    public function updateRole(Request $request, Role $role): JsonResponse
    {
        $data = $this->validateRole($request);
        $role->update([...$data, 'slug' => $this->uniqueRoleSlug($data['name'], $role->id)]);

        return response()->json($role->fresh()->loadCount('users'));
    }

    public function destroyRole(Role $role): JsonResponse
    {
        if ($role->users()->exists()) {
            return response()->json(['message' => 'Reassign this role’s users before deleting it.'], 422);
        }
        $role->delete();

        return response()->json(['message' => 'Role removed.']);
    }

    public function storeUser(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
            'role_id' => ['required', 'exists:roles,id'],
        ]);
        $user = User::create([...$data, 'is_admin' => true]);

        return response()->json($user->load('role:id,name,slug,menu_items'), 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:160', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'max:100'],
            'role_id' => ['required', 'exists:roles,id'],
        ]);
        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }
        $user->update([...$data, 'is_admin' => true]);

        return response()->json($user->fresh()->load('role:id,name,slug,menu_items'));
    }

    public function destroyUser(Request $request, User $user): JsonResponse
    {
        if ($request->user()?->is($user)) {
            return response()->json(['message' => 'You cannot remove the account currently signed in.'], 422);
        }
        $user->delete();

        return response()->json(['message' => 'User removed.']);
    }

    private function validateRole(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'menu_items' => ['required', 'array', 'min:1'],
            'menu_items.*' => ['string', Rule::in(self::MENUS)],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:100'],
            'is_active' => ['required', 'boolean'],
        ]);
    }

    private function uniqueRoleSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 2;
        while (Role::query()->where('slug', $slug)->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}
