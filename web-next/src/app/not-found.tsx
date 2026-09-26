import Link from "next/link";
import Image from "next/image";
import { getT } from "@/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-md">
        <Image
          src="/brand/lingyu-mascot.png"
          alt=""
          width={220}
          height={147}
          className="mx-auto h-auto w-44"
          priority
        />
        <p className="mt-4 text-sm font-semibold text-blue-600">{t("pages.error404")}</p>
        <h1 className="mt-1 text-2xl font-bold text-navy">{t("pages.notFoundTitle")}</h1>
        <p className="mt-2 text-text-2">{t("pages.notFoundDesc")}</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-blue px-5 font-semibold text-white shadow-cta hover:bg-blue-600"
        >
          {t("pages.goHome")}
        </Link>
      </div>
    </main>
  );
}
