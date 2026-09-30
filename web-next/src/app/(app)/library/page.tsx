import { redirect } from "next/navigation";

/** Thư viện LingYu: hiện có mục Từ vựng. */
export default function LibraryPage() {
  redirect("/library/vocabulary");
}
