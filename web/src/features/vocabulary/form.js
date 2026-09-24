import * as vocabApi from "../../services/api/vocabApi.js";
import { icon, leafDecor } from "../../components/ui/icons.js";
import { breadcrumb } from "../../components/layout/appShell.js";
import { esc, setBusy, tagStyle } from "../../lib/dom.js";
import { toast } from "../../components/ui/feedback.js";
import { navigate } from "../../routes/router.js";

const ACCEPT = ["image/jpeg", "image/png"];

/** Thu nhỏ ảnh (tối đa 720px) để lưu gọn. Giữ định dạng JPG/PNG. */
function processImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được tệp ảnh."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Tệp ảnh bị lỗi hoặc không đúng định dạng."));
      img.onload = () => {
        const max = 720;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        if (scale === 1 && file.size < 400 * 1024) return resolve(reader.result);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.86));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function renderVocabularyForm(page, ctx) {
  const editId = ctx.params.id || null;
  const title = editId ? "Sửa từ vựng" : "Thêm từ vựng mới";
  page.innerHTML = `${breadcrumb({ backHref: "#/vocabulary", section: "Từ vựng", sectionHref: "#/vocabulary", current: title })}
    <div id="vf-root"><div class="page-card" aria-busy="true" style="min-height:420px;display:grid;gap:18px">
      <span class="skel" style="height:40px;width:40%"></span><span class="skel" style="height:50px"></span><span class="skel" style="height:50px"></span><span class="skel" style="height:120px"></span>
    </div></div>`;
  const root = page.querySelector("#vf-root");

  let word = null;
  let allTags = [];
  try {
    [word, allTags] = await Promise.all([editId ? vocabApi.get(editId) : null, vocabApi.listTags()]);
  } catch (ex) {
    if (!ctx.isCurrent()) return;
    root.innerHTML = `<div class="page-card"><div class="state"><div class="state__icon state__icon--error">${icon("alert")}</div>
      <h3>${ex.code === "not-found" ? "Không tìm thấy từ vựng" : "Không tải được dữ liệu"}</h3><p>${esc(ex.message)}</p>
      <div class="state__actions"><a class="btn btn--secondary" href="#/vocabulary">${icon("arrowLeft")}Về danh sách</a>
      ${ex.code === "not-found" ? "" : `<button type="button" class="btn btn--solid" id="retry">${icon("refresh")}Thử lại</button>`}</div></div></div>`;
    root.querySelector("#retry")?.addEventListener("click", () => renderVocabularyForm(page, ctx));
    return;
  }
  if (!ctx.isCurrent()) return;

  const model = {
    hanzi: word?.hanzi || "", pinyin: word?.pinyin || "", meaningVi: word?.meaningVi || "",
    note: word?.note || "", tags: [...(word?.tags || [])], imageUrl: word?.imageUrl || null,
  };
  let tagNames = allTags.map((t) => t.name);

  root.innerHTML = `
  <form class="page-card vf-card" id="vf-form" novalidate>
    <span class="decor" style="right:-10px;bottom:-14px;width:70px;opacity:.35;transform:rotate(-30deg)">${leafDecor}</span>
    <div class="vf-main">
      <a class="vf-back" href="#/vocabulary">${icon("arrowLeft")}Quay lại</a>
      <div>
        <h1 class="page-title" style="color:var(--navy)">${title}<span class="leaf" aria-hidden="true">${leafDecor}</span></h1>
        <p class="page-sub">${editId ? "Cập nhật thông tin cho từ vựng của bạn." : "Điền thông tin để thêm từ vựng vào danh sách của bạn."}</p>
      </div>
      <div id="vf-alert" hidden></div>
      <div class="vf-row">
        ${field("hanzi", "Hán tự", true, `<input class="input hanzi-input" id="hanzi" placeholder="Nhập chữ Hán" value="${esc(model.hanzi)}" lang="zh" style="font-family:var(--font-cn)" />`, "Ví dụ: 你")}
        ${field("pinyin", "Pinyin", true, `<input class="input" id="pinyin" placeholder="Nhập pinyin (có thanh điệu)" value="${esc(model.pinyin)}" autocomplete="off" />`, "Ví dụ: nǐ")}
      </div>
      ${field("meaningVi", "Nghĩa tiếng Việt", true, `<input class="input" id="meaningVi" placeholder="Nhập nghĩa tiếng Việt" value="${esc(model.meaningVi)}" autocomplete="off" />`, "Ví dụ: bạn, cậu — nhiều nghĩa cách nhau bằng dấu phẩy")}
      <div class="field">
        <label class="field__label" for="note">Note <span class="opt">(ghi chú, cách dùng, ví dụ...)</span></label>
        <textarea class="textarea" id="note" maxlength="${vocabApi.MAX_NOTE}" placeholder="Nhập ghi chú, cách dùng, ví dụ..." aria-describedby="note-count">${esc(model.note)}</textarea>
        <div class="field__foot"><span class="field__error" id="note-err" hidden></span><span class="field__hint tabnum" id="note-count" style="margin-left:auto">${model.note.length}/${vocabApi.MAX_NOTE}</span></div>
      </div>
      <div class="field">
        <span class="field__label" id="tag-label">Tag</span>
        <div class="tagpick" id="tagpick">
          <button type="button" class="tagpick__btn" id="tag-btn" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="tag-label tag-btn"></button>
          <div class="tagpick__panel" id="tag-panel" hidden></div>
        </div>
      </div>
    </div>
    <div class="vf-side">
      <div class="vf-image">
        <div class="field__label">Hình ảnh <span class="opt">(không bắt buộc)</span></div>
        <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-label="Tải ảnh lên (JPG, PNG tối đa 5MB)"></div>
        <div class="field__error" id="img-err" role="alert" hidden></div>
        <div class="divider" style="font-size:15px">hoặc</div>
        <div class="img-actions">
          <label class="btn btn--secondary" for="img-camera">${icon("camera")}Chụp từ máy tính</label>
          <label class="btn btn--secondary" for="img-file">${icon("image")}Chọn ảnh có sẵn</label>
        </div>
        <input type="file" id="img-camera" accept="image/jpeg,image/png" capture="environment" class="sr-only" tabindex="-1" />
        <input type="file" id="img-file" accept="image/jpeg,image/png" class="sr-only" tabindex="-1" />
        <div class="tip"><span class="tip__icon">${icon("info")}</span><div><strong>Mẹo nhỏ:</strong>Hình ảnh sẽ giúp bạn ghi nhớ từ vựng nhanh và lâu hơn.</div></div>
      </div>
      <div class="vf-actions">
        <a class="btn btn--secondary" href="#/vocabulary">Hủy</a>
        <button type="submit" class="btn btn--primary" id="vf-save">${icon("save")}Lưu từ vựng</button>
      </div>
    </div>
  </form>`;

  const $ = (s) => root.querySelector(s);
  const form = $("#vf-form");

  // ----- Validation -----
  function setErr(id, msg) {
    const input = $("#" + id);
    const err = $(`#${id}-err`);
    input.classList.toggle("is-invalid", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    err.textContent = msg || "";
    err.hidden = !msg;
  }
  ["hanzi", "pinyin", "meaningVi"].forEach((id) => $("#" + id).addEventListener("input", (e) => { model[id] = e.target.value; setErr(id, ""); }));
  $("#note").addEventListener("input", (e) => {
    model.note = e.target.value;
    $("#note-count").textContent = `${model.note.length}/${vocabApi.MAX_NOTE}`;
  });

  // ----- Tag picker -----
  const tagBtn = $("#tag-btn"), panel = $("#tag-panel");
  function renderTagBtn() {
    tagBtn.innerHTML = (model.tags.length
      ? model.tags.map((t) => `<span class="tag" style="${tagStyle(t)}">${esc(t)}<span class="tag-x" role="button" tabindex="-1" data-rm="${esc(t)}" aria-label="Bỏ tag ${esc(t)}">${icon("x")}</span></span>`).join("")
      : `<span class="tagpick__ph">Chọn tag</span>`) + icon("chevronDown");
  }
  function renderPanel() {
    panel.innerHTML = `
      <div role="listbox" aria-multiselectable="true" aria-label="Danh sách tag">
        ${tagNames.length ? tagNames.map((t, i) => `<label class="tagpick__opt"><input type="checkbox" class="checkbox" data-tag="${esc(t)}" id="tg-${i}" ${model.tags.some((x) => x.toLowerCase() === t.toLowerCase()) ? "checked" : ""} />${`<span class="tag" style="${tagStyle(t)}">${esc(t)}</span>`}</label>`).join("")
        : `<p class="field__hint" style="padding:8px">Chưa có tag nào. Tạo tag mới bên dưới.</p>`}
      </div>
      <div class="tagpick__new">
        <label class="sr-only" for="new-tag">Tên tag mới</label>
        <input class="input" id="new-tag" maxlength="24" placeholder="Tạo tag mới (vd: Bài 3)" />
        <button type="button" class="btn btn--sm btn--ghost" id="add-tag">${icon("plus")}Thêm</button>
      </div>`;
    panel.querySelectorAll("[data-tag]").forEach((c) => c.addEventListener("change", () => {
      const t = c.dataset.tag;
      model.tags = c.checked ? [...model.tags, t] : model.tags.filter((x) => x.toLowerCase() !== t.toLowerCase());
      renderTagBtn();
    }));
    const add = () => {
      const inp = panel.querySelector("#new-tag");
      const t = inp.value.trim();
      if (!t) { inp.focus(); return; }
      if (!tagNames.some((x) => x.toLowerCase() === t.toLowerCase())) tagNames = [...tagNames, t];
      if (!model.tags.some((x) => x.toLowerCase() === t.toLowerCase())) model.tags.push(t);
      renderTagBtn(); renderPanel();
      panel.querySelector("#new-tag").focus();
    };
    panel.querySelector("#add-tag").addEventListener("click", add);
    panel.querySelector("#new-tag").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } });
  }
  const closePanel = () => { panel.hidden = true; tagBtn.setAttribute("aria-expanded", "false"); };
  tagBtn.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-rm]");
    if (rm) {
      model.tags = model.tags.filter((t) => t !== rm.dataset.rm);
      renderTagBtn(); if (!panel.hidden) renderPanel();
      return;
    }
    if (panel.hidden) { renderPanel(); panel.hidden = false; tagBtn.setAttribute("aria-expanded", "true"); panel.querySelector("input")?.focus(); }
    else closePanel();
  });
  const onDoc = (e) => { if (!$("#tagpick")?.contains(e.target)) closePanel(); };
  const onKey = (e) => { if (e.key === "Escape" && !panel.hidden) { closePanel(); tagBtn.focus(); } };
  document.addEventListener("mousedown", onDoc);
  document.addEventListener("keydown", onKey);
  renderTagBtn();

  // ----- Image -----
  const dz = $("#dropzone"), imgErr = $("#img-err");
  function renderImage() {
    if (model.imageUrl) {
      dz.classList.add("has-image");
      dz.removeAttribute("role"); dz.removeAttribute("tabindex");
      dz.innerHTML = `<img src="${esc(model.imageUrl)}" alt="Ảnh minh họa cho từ vựng" id="dz-img" />
        <button type="button" class="btn btn--sm btn--secondary" id="img-remove" style="position:absolute;right:10px;top:10px">${icon("trash")}Xóa ảnh</button>`;
      $("#dz-img").addEventListener("error", () => { imgErr.textContent = "Không hiển thị được ảnh này. Hãy chọn ảnh khác."; imgErr.hidden = false; });
      $("#img-remove").addEventListener("click", (e) => { e.stopPropagation(); model.imageUrl = null; renderImage(); });
    } else {
      dz.classList.remove("has-image");
      dz.setAttribute("role", "button"); dz.setAttribute("tabindex", "0");
      dz.innerHTML = `${icon("imagePlus")}<strong>Nhấp để tải ảnh lên</strong><span>Hỗ trợ JPG, PNG (tối đa 5MB)</span>`;
    }
  }
  async function takeFile(file) {
    imgErr.hidden = true;
    if (!file) return;
    if (!ACCEPT.includes(file.type)) { imgErr.textContent = "Chỉ hỗ trợ ảnh JPG hoặc PNG."; imgErr.hidden = false; return; }
    if (file.size > vocabApi.MAX_IMAGE_BYTES) { imgErr.textContent = "Ảnh vượt quá 5MB. Hãy chọn ảnh nhỏ hơn."; imgErr.hidden = false; return; }
    dz.innerHTML = `<span class="spinner" style="color:var(--blue)"></span><span>Đang xử lý ảnh...</span>`;
    try { model.imageUrl = await processImage(file); }
    catch (ex) { imgErr.textContent = ex.message; imgErr.hidden = false; }
    renderImage();
  }
  dz.addEventListener("click", () => { if (!model.imageUrl) $("#img-file").click(); });
  dz.addEventListener("keydown", (e) => { if (!model.imageUrl && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); $("#img-file").click(); } });
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("is-over"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("is-over"));
  dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("is-over"); takeFile(e.dataTransfer.files[0]); });
  ["#img-file", "#img-camera"].forEach((s) => $(s).addEventListener("change", (e) => { takeFile(e.target.files[0]); e.target.value = ""; }));
  renderImage();

  // ----- Submit -----
  const saveBtn = $("#vf-save");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (saveBtn.dataset.busy === "1") return;
    const alertBox = $("#vf-alert");
    alertBox.hidden = true;
    let ok = true;
    const req = { hanzi: "Vui lòng nhập chữ Hán.", pinyin: "Vui lòng nhập pinyin.", meaningVi: "Vui lòng nhập nghĩa tiếng Việt." };
    for (const id of Object.keys(req)) {
      if (!model[id].trim()) { setErr(id, req[id]); ok = false; }
    }
    if (model.hanzi.trim() && !/[㐀-鿿豈-﫿]/.test(model.hanzi)) { setErr("hanzi", "Hán tự phải chứa ít nhất một chữ Hán."); ok = false; }
    if (!ok) { root.querySelector('[aria-invalid="true"]')?.focus(); return; }

    setBusy(saveBtn, true, "Đang lưu...");
    try {
      const payload = { ...model, hanzi: model.hanzi.trim(), pinyin: model.pinyin.trim(), meaningVi: model.meaningVi.trim(), note: model.note.trim() };
      if (editId) await vocabApi.update(editId, payload);
      else await vocabApi.create(payload);
      toast(editId ? `Đã cập nhật “${payload.hanzi}”.` : `Đã thêm “${payload.hanzi}” vào danh sách.`, "success");
      navigate("/vocabulary");
    } catch (ex) {
      setBusy(saveBtn, false);
      if (ex.errors) Object.entries(ex.errors).forEach(([k, m]) => $("#" + k) && setErr(k, m));
      alertBox.className = "alert alert--error";
      alertBox.innerHTML = `${icon("alert")}<span><strong>Chưa lưu được.</strong> ${esc(ex.message || "Đã có lỗi xảy ra.")} Dữ liệu bạn nhập vẫn được giữ — hãy bấm “Lưu từ vựng” để thử lại.</span>`;
      alertBox.hidden = false;
      alertBox.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
  $("#hanzi").focus();

  return () => {
    document.removeEventListener("mousedown", onDoc);
    document.removeEventListener("keydown", onKey);
  };
}

function field(id, label, required, control, hint) {
  const withId = control.replace("<input ", `<input aria-describedby="${id}-hint ${id}-err" ${required ? 'aria-required="true"' : ""} `);
  return `<div class="field">
    <label class="field__label" for="${id}">${label}${required ? '<span class="req" aria-hidden="true">*</span>' : ""}</label>
    ${withId}
    <span class="field__hint" id="${id}-hint">${hint}</span>
    <span class="field__error" id="${id}-err" role="alert" hidden></span>
  </div>`;
}
