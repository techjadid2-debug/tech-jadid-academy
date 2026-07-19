"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function SubmitButton({ children, pendingLabel, className, disabled, style }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={disabled || pending} aria-disabled={disabled || pending} style={style}>
      {pending ? pendingLabel : children}
    </button>
  );
}
