import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import Storefront from '../components/Storefront';
import { api } from '../lib/api';
import type { CatalogData } from '../types';

export default function BakeryApp() {
    const [catalog, setCatalog] = useState<CatalogData | null>(null);
    const [error, setError] = useState('');
    const loadCatalog = useCallback(async () => {
        try { setError(''); setCatalog(await api<CatalogData>('/api/catalog')); }
        catch (reason) { setError(reason instanceof Error ? reason.message : 'The catalogue could not be loaded.'); }
    }, []);
    useEffect(() => { void loadCatalog(); }, [loadCatalog]);

    if (!catalog) return <div className="app-loading"><span className="brand-mark">SB</span><LoaderCircle className="spin" size={23} /><p>{error || 'Preparing today’s collection…'}</p>{error && <button onClick={() => void loadCatalog()}>Try again</button>}</div>;

    return <Storefront catalog={catalog} />;
}
