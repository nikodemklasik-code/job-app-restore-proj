import * as React from 'react';
import { clsx } from 'clsx';

// Props that RadioGroup injects into each RadioGroupItem child via cloneElement.
interface RadioGroupInjectedProps {
  selectedValue?: string;
  onSelect?: (value: string) => void;
}

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const RadioGroup = ({ value, onValueChange, className, children, ...props }: RadioGroupProps) => (
  <div className={clsx('grid gap-2', className)} {...props}>
    {React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child as React.ReactElement<RadioGroupInjectedProps>, {
            selectedValue: value,
            onSelect: onValueChange,
          })
        : child
    )}
  </div>
);

// Own props declared explicitly; extends only the subset of input attributes that
// make sense for a radio item (omitting onChange to avoid conflict with onSelect).
interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'onSelect'> {
  value: string;
  id?: string;
  // Injected by RadioGroup via cloneElement — must be in the interface so TypeScript
  // accepts the cloneElement call and so the component can read them.
  selectedValue?: string;
  onSelect?: (value: string) => void;
}

export const RadioGroupItem = ({ value, id, selectedValue, onSelect, className, ...props }: RadioGroupItemProps) => (
  <input
    type="radio"
    id={id}
    value={value}
    checked={selectedValue === value}
    onChange={() => onSelect?.(value)}
    className={clsx('h-4 w-4 accent-indigo-600', className)}
    {...props}
  />
);
