// Form tạo / chỉnh sửa ngữ pháp: /grammar/new · /grammar/:id/edit
import * as grammarApi from "../../services/api/grammarApi.js";
import { icon, leafDecor } from "../../components/ui/icons.js";
import { breadcrumb } from "../../components/layout/appShell.js";
import { esc, setBusy } from "../../lib/dom.js";
import { toast, confirmDialog } from "../../components/ui/feedback.js";
import { navigate, setBeforeLeave } from "../../routes/router.js";
import { attachPinyinInput } from "../../lib/pinyin.js";
import { tagInput } from "./shared.js";

const L = grammarApi.LIMITS;

export async function renderGrammarForm(page, ctx) {
  const editId = ctx.params.id || null;
  const title = editId ? "Chỉnh sửa ngữ pháp" : "Thêm ngữ pháp mới";
  page.innerHTML = `${breadcrumb({ backHref: editId ? `#/grammar/${editId}` : "#/grammar", section: "Ngữ pháp", sectionHref: "#/grammar", current: title })}
    <div id="gf-root"><div class="page-card" aria-busy="true" style="display:grid;gap:16px">
      <span class="skel" style="height:40px;width:40%"></span><span class="skel" style="height:50px"></span><span class="skel" style="height:120px"></span></div></div>`;
  const root = page.querySelector("#gf-root");

  let g = null, tags = [];
  try {
    const [got, t] = await Promise.all([editId ? grammarApi.get(editId) : null, grammarApi.listTags()]);
    g = got?.grammar || null; tags = t;
    if (g && !g.isOwner) throw Object.assign(new Error("Bạn chỉ có thể sửa ngữ pháp do mình tạo."), { code: "forbidden" });
  } catch (ex) {
    if (!ctx.isCurrent()) return;
    root.innerHTML = `<div class="page-card"><div class="state"><div class="state__icon state__icon--error">${icon("alert")}</div>
      <h3>${ex.code === "not-found" ? "Không tìm thấy ngữ pháp" : "Không mở được ngữ pháp"}</h3><p>${esc(ex.message)}</p>
      <div class="state__actions"><a class="btn btn--solid" href="#/grammar">Về danh sách ngữ pháp</a></div></div></div>`;
    return;
  }
  if (!ctx.isCurrent()) return;

  const examples = (g?.examples || []).map((e) => ({ ...e }));
  if (!examples.length) examples.push({ chinese: "", pinyin: "", vietnamese: "" });

  root.innerHTML = `
  <form class="page-card gf-card" id="gf-form" novalidate>
    <span class="decor" style="right:-10px;bottom:-14px;width:70px;opacity:.35;transform:rotate(-30deg)">${leafDecor}</span>
    <div>
      <h1 class="page-title" style="color:var(--navy)">${title}<span class="leaf" aria-hidden="true">${leafDecor}</span></h1>
      <p class="page-sub">${editId ? "Cập nhật nội dung ngữ pháp của bạn." : "Ghi lại một điểm ngữ pháp kèm ví dụ để ôn lại sau."}</p>
    </div>
    <div id="gf-alert" hidden></div>

    <div class="field">
      <label class="field__label" for="gf-title">Tiêu đề<span class="req" aria-hidden="true">*</span></label>
      <input class="input" id="gf-title" maxlength="${L.title}" placeholder="vd: Câu hỏi với 吗" value="${esc(g?.title)}" aria-required="true" aria-describedby="gf-title-err" autocomplete="off" />
      <span class="field__error" id="gf-title-err" role="alert" hidden></span>
    </div>
    <div class="field">
      <label class="field__label" for="gf-meaning">Ý nghĩa</label>
      <textarea class="textarea" id="gf-meaning" rows="3" maxlength="${L.meaning}" placeholder="vd: 吗 được đặt cuối câu để tạo câu hỏi Yes/No.">${esc(g?.meaning)}</textarea>
    </div>
    <div class="field">
      <label class="field__label" for="gf-structure">Cấu trúc</label>
      <input class="input" id="gf-structure" maxlength="${L.structure}" placeholder="vd: Chủ ngữ + tính từ/động từ + 吗？" value="${esc(g?.structure)}" lang="zh" autocomplete="off" />
    </div>

    <fieldset class="gf-examples">
      <legend class="field__label">Ví dụ</legend>
      <ol class="gex-list" id="gex-list"></ol>
      <span class="field__error" id="gex-err" role="alert" hidden></span>
      <button type="button" class="btn btn--secondary btn--sm" id="gex-add">${icon("plus")}Thêm ví dụ</button>
    </fieldset>

    <div class="field">
      <label class="field__label" for="gf-notes">Lưu ý</label>
      <textarea class="textarea" id="gf-notes" rows="4" maxlength="${L.notes}" placeholder="Mỗi dòng một lưu ý, vd:&#10;吗 thường đứng cuối câu.&#10;Không dùng 吗 với câu đã có từ để hỏi.">${esc(g?.notes)}</textarea>
      <span class="field__hint">Mỗi dòng là một lưu ý.</span>
    </div>
    <div class="field">
      <label class="field__label" for="gf-personal">Ghi chú cá nhân <span class="opt">(chỉ mình bạn xem được)</span></label>
      <textarea class="textarea" id="gf-personal" rows="3" maxlength="${L.personalNote}" placeholder="Mẹo nhớ, lỗi thường gặp, ghi chú khi học...">${esc(g?.personalNote)}</textarea>
      <span class="field__hint">${icon("lock").replace("<svg", '<svg style="width:14px;height:14px;vertical-align:-2px"')} Không được gửi kèm khi bạn chia sẻ ngữ pháp này.</span>
    </div>
    <div class="field">
      <label class="field__label" for="gf-tags">Thẻ (Tags)</label>
      <div id="gf-tagbox"></div>
      <span class="field__hint">Gõ tên thẻ rồi nhấn Enter. Thẻ đã có sẽ được dùng lại, thẻ mới sẽ được tạo khi lưu.</span>
    </div>

    <div class="vf-actions gf-actions">
      <a class="btn btn--secondary" href="${editId ? `#/grammar/${editId}` : "#/grammar"}">Hủy</a>
      <button type="submit" class="btn btn--primary" id="gf-save">${icon("save")}${editId ? "Lưu thay đổi" : "Lưu ngữ pháp"}</button>
    </div>
  </form>`;

  const $ = (s) => root.querySelector(s);
  const tagBox = tagInput($("#gf-tagbox"), { initial: (g?.tags || []).map((t) => t.name), existing: tags.map((t) => t.name), inputId: "gf-tags" });
  let dirty = false;
  root.addEventListener("input", () => { dirty = true; });

  // ----- Examples: thêm / sửa / xóa / đổi thứ tự -----
  const list = $("#gex-list");
  function readExamples() {
    list.querySelectorAll(".gex").forEach((li, i) => {
      examples[i].chinese = li.querySelector("[data-f=chinese]").value;
      examples[i].pinyin = li.querySelector("[data-f=pinyin]").value;
      examples[i].vietnamese = li.querySelector("[data-f=vietnamese]").value;
    });
  }
  function renderExamples(focusIndex) {
    list.innerHTML = examples.map((e, i) => `
      <li class="gex" data-i="${i}">
        <div class="gex__head"><span class="gex__num">Ví dụ ${i + 1}</span>
          <div class="gex__tools">
            <button type="button" class="icon-btn" data-up="${i}" ${i === 0 ? "disabled" : ""} aria-label="Đưa ví dụ ${i + 1} lên">${icon("arrowUp")}</button>
            <button type="button" class="icon-btn" data-down="${i}" ${i === examples.length - 1 ? "disabled" : ""} aria-label="Đưa ví dụ ${i + 1} xuống">${icon("arrowDown")}</button>
            <button type="button" class="icon-btn icon-btn--danger" data-del="${i}" aria-label="Xóa ví dụ ${i + 1}">${icon("trash")}</button>
          </div></div>
        <div class="gex__fields">
          <label><span class="gex__label">Tiếng Trung</span><input class="input" data-f="chinese" lang="zh" style="font-family:var(--font-cn)" placeholder="你是学生吗？" value="${esc(e.chinese)}" autocomplete="off" /></label>
          <label><span class="gex__label">Pinyin</span><input class="input" data-f="pinyin" placeholder="Ni3 shi4 xue2sheng5 ma5?" value="${esc(e.pinyin)}" autocomplete="off" autocapitalize="off" spellcheck="false" /></label>
          <label><span class="gex__label">Tiếng Việt</span><input class="input" data-f="vietnamese" placeholder="Bạn có phải là học sinh không?" value="${esc(e.vietnamese)}" autocomplete="off" /></label>
        </div>
      </li>`).join("") || `<li class="field__hint">Chưa có ví dụ nào.</li>`;
    list.querySelectorAll("[data-f=pinyin]").forEach((inp) => attachPinyinInput(inp));
    if (focusIndex != null) list.querySelector(`.gex[data-i="${focusIndex}"] [data-f=chinese]`)?.focus();
  }
  list.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    readExamples();
    const swap = (a, c) => { [examples[a], examples[c]] = [examples[c], examples[a]]; };
    // Sau khi đổi chỗ, giữ focus trên nút cùng chiều của ví dụ vừa di chuyển (hoặc nút còn lại nếu đã ở đầu/cuối).
    const refocus = (j, first, second) => {
      const a = list.querySelector(`[data-${first}="${j}"]`);
      (a && !a.disabled ? a : list.querySelector(`[data-${second}="${j}"]`))?.focus();
    };
    if (b.dataset.up) { const i = Number(b.dataset.up); swap(i, i - 1); renderExamples(); refocus(i - 1, "up", "down"); }
    else if (b.dataset.down) { const i = Number(b.dataset.down); swap(i, i + 1); renderExamples(); refocus(i + 1, "down", "up"); }
    else if (b.dataset.del) { examples.splice(Number(b.dataset.del), 1); renderExamples(); $("#gex-add").focus(); }
    dirty = true;
    $("#gex-err").hidden = true;
  });
  $("#gex-add").addEventListener("click", () => {
    readExamples();
    if (examples.length >= L.examples) { const er = $("#gex-err"); er.textContent = `Tối đa ${L.examples} ví dụ.`; er.hidden = false; return; }
    examples.push({ chinese: "", pinyin: "", vietnamese: "" });
    renderExamples(examples.length - 1);
    dirty = true;
  });
  renderExamples();

  // ----- Validation + Save -----
  const titleEl = $("#gf-title"), titleErr = $("#gf-title-err");
  const setTitleErr = (m) => { titleErr.textContent = m || ""; titleErr.hidden = !m; titleEl.classList.toggle("is-invalid", !!m); titleEl.setAttribute("aria-invalid", m ? "true" : "false"); };
  titleEl.addEventListener("input", () => setTitleErr(""));
  titleEl.addEventListener("blur", () => { if (!titleEl.value.trim() && dirty) setTitleErr("Vui lòng nhập tiêu đề ngữ pháp."); });

  const btn = $("#gf-save");
  let saved = false;
  $("#gf-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn.dataset.busy === "1") return;
    readExamples();
    if (!titleEl.value.trim()) { setTitleErr("Vui lòng nhập tiêu đề ngữ pháp."); titleEl.focus(); return; }
    const payload = {
      title: titleEl.value, meaning: $("#gf-meaning").value, structure: $("#gf-structure").value,
      notes: $("#gf-notes").value, personalNote: $("#gf-personal").value,
      examples, tags: tagBox.get(),
    };
    setBusy(btn, true, "Đang lưu...");
    try {
      const res = editId ? await grammarApi.update(editId, payload) : await grammarApi.create(payload);
      saved = true;
      toast(editId ? "Đã lưu thay đổi." : "Đã thêm ngữ pháp mới.", "success");
      navigate(`/grammar/${res.id}`);
    } catch (ex) {
      setBusy(btn, false);
      const f = ex.fields || {};
      if (f.title) { setTitleErr(f.title); titleEl.focus(); return; }
      if (f.examples) { const er = $("#gex-err"); er.textContent = f.examples; er.hidden = false; list.querySelector(".gex [data-f=chinese]")?.focus(); return; }
      const box = $("#gf-alert");
      box.className = "alert alert--error"; box.innerHTML = `${icon("alert")}<span>${esc(ex.message || "Không lưu được. Vui lòng thử lại.")}</span>`; box.hidden = false;
    }
  });

  // Nhắc khi rời trang mà chưa lưu.
  setBeforeLeave(async () => {
    if (saved || !dirty) return true;
    return confirmDialog({ title: "Bỏ thay đổi?", message: "Nội dung bạn vừa nhập chưa được lưu.", confirmLabel: "Bỏ thay đổi", cancelLabel: "Ở lại", danger: true, iconName: "alert" });
  });
  titleEl.focus();
}
