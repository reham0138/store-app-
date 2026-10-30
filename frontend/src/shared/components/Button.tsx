import React from "react";
import "./Button.css";

type Variants = "primary" | "secondary" | "tertiary";

export interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  type?: "button" | "submit" | "reset";
  variant?: Variants;
  disabled?: boolean;
  className?: string;
}

function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`button button--${variant} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;