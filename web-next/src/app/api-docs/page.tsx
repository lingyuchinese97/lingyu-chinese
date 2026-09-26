import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/i18n/server";
import { SwaggerView } from "@/components/swagger-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("api.docsTitle"), robots: { index: false, follow: false } };
}

/** Swagger UI cho REST API (đọc /api/openapi.json). Công khai: chỉ là tài liệu, gọi thử vẫn cần đăng nhập. */
export default async function ApiDocsPage() {
  const t = await getT();
  return (
    <main className="mx-auto min-h-dvh max-w-6xl bg-white px-4 py-6">
      <h1 className="text-2xl font-extrabold text-navy">
        <Link href="/" className="hover:underline">
          LingYu
        </Link>{" "}
        · {t("api.docsTitle")}
      </h1>
      <p className="mt-2 text-[15px] text-text-2">{t("api.docsIntro")}</p>
      <SwaggerView url="/api/openapi.json" />
    </main>
  );
}
