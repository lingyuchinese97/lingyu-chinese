"use client";
import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogActions, DialogClose, DialogContent } from "./dialog";

type Options = {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  icon?: React.ReactNode;
};

/** Hộp xác nhận dùng dạng hook: `const [confirm, node] = useConfirm(); if (await confirm({...}))`. */
export function useConfirm(): [(o: Options) => Promise<boolean>, React.ReactNode] {
  const [state, setState] = React.useState<(Options & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = React.useCallback((o: Options) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), []);
  const done = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  const node = (
    <Dialog open={!!state} onOpenChange={(o) => !o && done(false)}>
      {state ? (
        <DialogContent
          title={state.title}
          description={state.message}
          icon={state.icon ?? (state.danger ? <AlertTriangle className="text-red" /> : undefined)}
        >
          <DialogActions>
            <DialogClose asChild>
              <Button variant="secondary">Hủy</Button>
            </DialogClose>
            <Button variant={state.danger ? "danger" : "solid"} onClick={() => done(true)} autoFocus>
              {state.confirmLabel ?? "Đồng ý"}
            </Button>
          </DialogActions>
        </DialogContent>
      ) : null}
    </Dialog>
  );
  return [confirm, node];
}
