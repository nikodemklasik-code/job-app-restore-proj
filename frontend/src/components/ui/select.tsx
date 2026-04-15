import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

// ─── Context ────────────────────────────────────────────────────────────────

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  displayLabel: string;
  setDisplayLabel: (label: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

const useSelectContext = () => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error('Select sub-components must be used inside <Select>');
  return ctx;
};

// ─── Select (root) ──────────────────────────────────────────────────────────

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const Select = ({ value: controlledValue, defaultValue = '', onValueChange, children }: SelectProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const [displayLabel, setDisplayLabel] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) setInternalValue(newValue);
    onValueChange?.(newValue);
    setOpen(false);
  };

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen, displayLabel, setDisplayLabel }}>
      <div ref={containerRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// ─── SelectTrigger ──────────────────────────────────────────────────────────

interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const SelectTrigger = ({ className, children, ...props }: SelectTriggerProps) => {
  const { open, setOpen } = useSelectContext();
  return (
    <button
      type="button"
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={clsx(
        'flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className={clsx('ml-2 h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
    </button>
  );
};

// ─── SelectValue ────────────────────────────────────────────────────────────

interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue = ({ placeholder }: SelectValueProps) => {
  const { displayLabel, value } = useSelectContext();
  const hasValue = value !== '' && value !== undefined;
  return (
    <span className={clsx('truncate', !hasValue && 'text-slate-400')}>
      {hasValue && displayLabel ? displayLabel : (hasValue ? value : placeholder)}
    </span>
  );
};

// ─── SelectContent ──────────────────────────────────────────────────────────

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent = ({ children, className }: SelectContentProps) => {
  const { open } = useSelectContext();
  if (!open) return null;
  return (
    <div
      role="listbox"
      className={clsx(
        'absolute left-0 top-full z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900',
        className
      )}
    >
      <div className="py-1">
        {children}
      </div>
    </div>
  );
};

// ─── SelectItem ─────────────────────────────────────────────────────────────

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const SelectItem = ({ value, children, className, disabled }: SelectItemProps) => {
  const { value: selectedValue, onValueChange, setDisplayLabel } = useSelectContext();
  const isSelected = selectedValue === value;

  const handleClick = () => {
    if (disabled) return;
    setDisplayLabel(typeof children === 'string' ? children : value);
    onValueChange(value);
  };

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        'flex w-full cursor-pointer items-center px-3 py-2 text-sm transition-colors',
        isSelected
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
};
