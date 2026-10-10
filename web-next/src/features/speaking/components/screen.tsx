import { notFound } from "next/navigation";
import Image from "next/image";
import { getT } from "@/i18n/server";
import { FeatureHero } from "@/components/feature-hero";
import { listQuery, questionListSchema } from "../schema";
import { getQuestion, listQuestions, SpeakingError } from "../service";
import { Practice } from "./practice";
import { QuestionList } from "./question-list";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Luyện giao tiếp theo design: màn rộng (2xl, ≥1536px) chia 2 cột — danh sách câu hỏi bên trái, luyện tập câu đang chọn bên phải.
 * `/speaking`: danh sách (+ luyện câu đầu trang ở cột phải trên màn rộng). `/speaking/[id]`: luyện câu `id`
 * (+ danh sách bên trái trên màn rộng; điện thoại chỉ thấy phần luyện). Câu của người khác / không có → 404.
 */
export async function SpeakingScreen({ userId, sp, id }: { userId: string; sp: SP; id?: string }) {
  const t = await getT();
  const params = questionListSchema.parse(Object.fromEntries(Object.keys(sp).map((k) => [k, one(sp[k])])));
  const data = await listQuestions(userId, params);
  const selId = id ?? data.items[0]?.id;
  const q = selId
    ? await getQuestion(userId, selId).catch((e) => {
        if (e instanceof SpeakingError) notFound();
        throw e;
      })
    : null;
  const knownTags = data.tags.map((x) => x.name);
  return (
    <>
      {/* Bìa chung như các chức năng khác; trang luyện một câu trên điện thoại thì ẩn bìa để vào thẳng phần luyện. */}
      <FeatureHero
        iconImg="/brand/ui/nav-speaking.png?v=2"
        id="sp-hero-title"
        title={t("speaking.title")}
        description={t("speaking.subtitle")}
        className={id ? "hidden 2xl:block" : undefined}
      />
      <div className="flex flex-col gap-4 2xl:grid 2xl:grid-cols-[minmax(0,9fr)_minmax(0,11fr)] 2xl:items-start">
        {id ? <h1 className="sr-only 2xl:hidden">{t("speaking.title")}</h1> : null}
        <div className={id ? "hidden 2xl:block" : undefined}>
          <QuestionList key={JSON.stringify({ ...params, q: "" })} data={data} params={params} currentId={selId} />
        </div>
        {q ? (
          <div className={id ? undefined : "hidden 2xl:block"}>
            <Practice key={q.id} q={q} knownTags={knownTags} qs={listQuery(params)} />
          </div>
        ) : (
          <div className="hidden min-h-[360px] flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-border bg-white/70 p-8 text-center 2xl:flex">
            <Image
              unoptimized
              src="/brand/hero/mascot-reading.webp"
              alt=""
              aria-hidden="true"
              width={560}
              height={493}
              className="h-[120px] w-auto"
            />
            <p className="text-[15px] text-text-2">{t("speaking.pickQuestion")}</p>
          </div>
        )}
      </div>
    </>
  );
}
