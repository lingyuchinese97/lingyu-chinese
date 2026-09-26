"use client";
import * as React from "react";
import "swagger-ui-dist/swagger-ui.css";
import { useT } from "@/i18n/client";

/** Hiển thị Swagger UI (tải thư viện khi vào trang, không ảnh hưởng các trang khác). */
export function SwaggerView({ url }: { url: string }) {
  const t = useT();
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<"loading" | "ready" | "failed">("loading");
  React.useEffect(() => {
    let cancelled = false;
    import("swagger-ui-dist/swagger-ui-bundle.js")
      .then((m) => {
        if (cancelled || !ref.current) return;
        const SwaggerUIBundle = (m.default ?? m) as SwaggerUIBundleFn;
        SwaggerUIBundle({
          url,
          domNode: ref.current,
          deepLinking: true,
          docExpansion: "list",
          defaultModelsExpandDepth: 0,
          tryItOutEnabled: false,
          // Gửi kèm cookie phiên (cùng domain).
          requestInterceptor: (req: { credentials?: string }) => ({ ...req, credentials: "same-origin" }),
        });
        setState("ready");
      })
      .catch(() => !cancelled && setState("failed"));
    return () => {
      cancelled = true;
    };
  }, [url]);
  return (
    <>
      {state === "loading" ? <p className="mt-6 text-text-2">{t("api.docsLoading")}</p> : null}
      {state === "failed" ? (
        <p role="alert" className="mt-6 text-red-700">
          {t("api.docsLoadFailed")}
        </p>
      ) : null}
      <div ref={ref} className="swagger-host mt-4" />
    </>
  );
}

type SwaggerUIBundleFn = (opts: Record<string, unknown>) => unknown;
