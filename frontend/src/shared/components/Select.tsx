import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, className = "", ...rest }, ref) => {
    return (
      <select
        ref={ref}
        className={`select ${className}`.trim()}
        defaultValue=""
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    );
  },
);
Select.displayName = "Select";
