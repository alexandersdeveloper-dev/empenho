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
          'w-full rounded-lg border border-line px-3 py-2 text-sm focus:border-ink-900 focus:ring-1 focus:ring-ink-300 outline-none disabled:bg-bg-soft text-ink-900 placeholder:text-ink-400 transition',
          className,
        )}
      />
      {open && options.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-line bg-white shadow-lg max-h-52 overflow-y-auto text-sm">
          {options.map((opt, i) => (
            <li
              key={i}
              onMouseDown={(e) => { e.preventDefault(); select(opt); }}
              className="cursor-pointer px-3 py-2 hover:bg-bg-soft hover:text-ink-900 text-ink-700 transition"
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
