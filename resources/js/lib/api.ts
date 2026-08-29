export class ApiError extends Error {
    constructor(message: string, public status: number, public errors?: Record<string, string[]>) { super(message); }
}

export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    const isFormData = options.body instanceof FormData;
    const response = await fetch(url, {
        ...options,
        credentials: 'same-origin',
        headers: { Accept: 'application/json', ...(!isFormData ? { 'Content-Type': 'application/json' } : {}), ...(token ? { 'X-CSRF-TOKEN': token } : {}), ...options.headers },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const firstError = payload.errors ? Object.values(payload.errors).flat()[0] : null;
        throw new ApiError(firstError || payload.message || 'Something went wrong.', response.status, payload.errors);
    }
    return payload as T;
}
