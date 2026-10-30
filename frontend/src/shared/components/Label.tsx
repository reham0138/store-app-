import { useId, cloneElement } from "react";
import type { ReactElement } from "react";

type LabelProps = {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactElement<{
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }>;
};

export function Label({ label, error, hint, required, children }: LabelProps) {
  const generatedId = useId();
  const id = children.props.id || `input-${generatedId}`;
  const describedBy = [
    error ? `${id}-error` : "",
    hint ? `${id}-hint` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="field__required" aria-label="required">
            *
          </span>
        )}
      </label>
      {cloneElement(children, {
        id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {error && (
        <p id={`${id}-error`} className="error" role="alert">
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      )}
    </div>
  );
}
