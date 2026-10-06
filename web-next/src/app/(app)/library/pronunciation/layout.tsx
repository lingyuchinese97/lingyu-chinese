import { getT } from "@/i18n/server";
import { Crumbs } from "@/features/library/components/hub/parts";
import { PronunciationHeader } from "@/features/pronunciation/components/pron-header";

/** Phát âm & Biến điệu — một mục của Thư viện LingYu (nội dung LingYu biên soạn; ghi chú là của riêng mỗi người). */
export default async function PronunciationLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <div className="flex flex-col gap-4">
      <Crumbs
        label={t("shell.breadcrumb")}
        home={t("shell.nav.home")}
        items={[{ href: "/library", text: t("libhub.breadcrumb") }, { text: t("libhub.cats.pron") }]}
      />
      <PronunciationHeader />
      {children}
    </div>
  );
}
