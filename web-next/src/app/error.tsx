"use client";

import { useEffect } from "react";
import { useT } from "@/i18n/client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold text-red">{t("pages.error500")}</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">{t("pages.errorTitle")}</h1>
        <p className="mt-2 text-text-2">{t("pages.errorDesc")}</p>
        {error.digest ? (
          <p className="mt-2 text-xs text-text-3">{t("pages.errorCode", { code: error.digest })}</p>
        ) : null}
        <button
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center rounded-md bg-blue px-5 font-semibold text-white shadow-cta hover:bg-blue-600"
        >
          {t("pages.retry")}
        </button>
      </div>
    </main>
  );
}
