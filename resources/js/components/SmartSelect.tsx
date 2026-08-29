import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export type SmartSelectOption = { value: string | number; label: string; group?: string };

type Props = {
    value: string | number | null;
    options: SmartSelectOption[];
    onChange: (value: string | number | null) => void;
    placeholder: string;
    searchPlaceholder?: string;
    icon?: React.ReactNode;
    className?: string;
};

export default function SmartSelect({ value, options, onChange, placeholder, searchPlaceholder = 'Type to search…', icon, className = '' }: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const root = useRef<HTMLDivElement | null>(null);
    const selected = options.find((option) => String(option.value) === String(value));
    const filtered = useMemo(() => options.filter((option) => `${option.group || ''} ${option.label}`.toLowerCase().includes(query.trim().toLowerCase())), [options, query]);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return <div ref={root} className={`smart-select ${open ? 'open' : ''} ${className}`}>
        <button type="button" className="smart-select-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
            {icon}<span className={selected ? '' : 'placeholder'}>{selected?.label || placeholder}</span><ChevronDown size={16} />
        </button>
        {open && <div className="smart-select-popover">
            <label className="smart-select-search"><Search size={15} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} /></label>
            <div className="smart-select-options" role="listbox">
                <button type="button" className={value === null || value === '' ? 'selected' : ''} onClick={() => { onChange(null); setOpen(false); setQuery(''); }}>
                    <span>{placeholder}</span>{(value === null || value === '') && <Check size={15} />}
                </button>
                {filtered.map((option) => {
                    const isSelected = String(option.value) === String(value);
                    return <button type="button" role="option" aria-selected={isSelected} className={isSelected ? 'selected' : ''} key={`${option.group || ''}-${option.value}`} onClick={() => { onChange(option.value); setOpen(false); setQuery(''); }}>
                        <span>{option.group && <small>{option.group}</small>}{option.label}</span>{isSelected && <Check size={15} />}
                    </button>;
                })}
                {filtered.length === 0 && <p className="smart-select-empty">No matching option</p>}
            </div>
        </div>}
    </div>;
}
