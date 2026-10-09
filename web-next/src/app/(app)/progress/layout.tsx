import { ProgressTabs } from "@/features/progress/components/progress-tabs";
import { getT } from "@/i18n/server";
import { FeatureHero } from "@/components/feature-hero";

export default async function ProgressLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <div className="flex flex-col gap-4">
      <FeatureHero
        iconImg="/brand/ui/nav-progress.png?v=2"
        id="pg-title"
        title={t("progress.title")}
        description={t("progress.subtitle")}
      />
      <ProgressTabs />
      {children}
    </div>
  );
}
