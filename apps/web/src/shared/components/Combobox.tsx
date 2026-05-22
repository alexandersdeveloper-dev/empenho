import { useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';

type Option = {
  label: string;
  value: string;
  meta?: Record<string, unknown>;
};

type Props = {
  value: string;
  onChange: (value: string, option?: Option) => void;
  onSearch: (q: string) => Promise<Option[]>;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
  minChars?: number;
};

export function Combobox({
  value,
  onChange,
  onSearch,
  placeholder = '',
  debounceMs = 250,
  className,
  disabled,
  minChars = 2,
}: Props) {
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(q: string) {
    onChange(q);
    if (timer.current) clearTimeout(timer.current);
    if (q.length < minChars) { setOptions([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      const results = await onSearch(q);
      setOptions(results);
      setOpen(results.length > 0);
    }, debounceMs);
  }

  function select(opt: Option) {
    onChange(opt.label, opt);
    setOpen(false);
    setOptions([]);
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none disabled:bg-gray-50',
          className,
        )}
      />
      {open && options.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-52 overflow-y-auto text-sm">
          {options.map((opt, i) => (
            <li
              key={i}
              onMouseDown={(e) => { e.preventDefault(); select(opt); }}
              className="cursor-pointer px-3 py-2 hover:bg-brand-50 hover:text-brand-700"
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
