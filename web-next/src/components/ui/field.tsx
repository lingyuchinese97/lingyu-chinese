import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/** Nhóm trường form: nhãn + control + gợi ý + lỗi (có aria-describedby). */
export function Field({
  id,
  label,
  required,
  optional,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  required?: boolean;
  optional?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-red ml-0.5" aria-hidden="true">
            *
          </span>
        ) : null}
        {optional ? <span className="text-text-2 font-medium"> {optional}</span> : null}
      </Label>
      {children}
      {hint ? (
        <span id={`${id}-hint`} className="text-text-3 text-[13.5px]">
          {hint}
        </span>
      ) : null}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} role="alert" className="text-red text-[13.5px]">
      {message}
    </span>
  );
}
