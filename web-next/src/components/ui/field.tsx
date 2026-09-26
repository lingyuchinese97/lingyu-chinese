"use client";
import * as React from "react";
import { useT } from "@/i18n/client";
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
          <span className="ml-0.5 text-red" aria-hidden="true">
            *
          </span>
        ) : null}
        {optional ? <span className="font-medium text-text-2"> {optional}</span> : null}
      </Label>
      {children}
      {hint ? (
        <span id={`${id}-hint`} className="text-[13.5px] text-text-3">
          {hint}
        </span>
      ) : null}
      <FieldError id={`${id}-err`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  const t = useT();
  if (!message) return null;
  return (
    <span id={id} role="alert" className="text-[13.5px] text-red">
      {t.maybe(message)}
    </span>
  );
}
