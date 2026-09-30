import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { listTags } from "@/features/vocabulary/service";
import { VocabForm } from "@/features/vocabulary/components/vocab-form";
import { ADD_MODES, AddVocabTabs, type AddMode } from "@/features/vocabulary/components/add-vocab-tabs";
import { ImageImport } from "@/features/vocabulary/components/image-import";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("vocab.add") };
}

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function NewVocabPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const raw = (await searchParams).mode;
  const mode: AddMode = ADD_MODES.find((m) => m === raw) ?? "manual";
  const tags = await listTags(user.id);
  const t = await getT();
  const allTags = tags.map((x) => x.name);
  return (
    <>
      <Breadcrumb back="/vocabulary" section={t("vocab.title")} current={t("vocab.addNew")} />
      <AddVocabTabs
        mode={mode}
        label={t("vocab.img.tabsLabel")}
        labels={{
          camera: t("vocab.img.tabCamera"),
          upload: t("vocab.img.tabUpload"),
          paste: t("vocab.img.tabPaste"),
          manual: t("vocab.img.tabManual"),
        }}
      />
      {mode === "manual" ? (
        <VocabForm word={null} allTags={allTags} />
      ) : (
        <ImageImport key={mode} source={mode} allTags={allTags} />
      )}
    </>
  );
}
