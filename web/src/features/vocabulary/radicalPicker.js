// Ô chọn bộ thủ cho từ vựng: gõ tiếng Việt (thủy, nước, người...) → chọn trong danh sách gợi ý.
// Hỗ trợ bàn phím: ↑/↓ di chuyển, Enter chọn, Esc đóng, Backspace (ô trống) bỏ bộ cuối.
import * as radicalApi from "../../services/api/radicalApi.js";
import { icon } from "../../components/ui/icons.js";
import { esc } from "../../lib/dom.js";

const MAX = 10;

const glyph = (r) => {
  const v = r.variants.find((x) => !x.includes("("));
  return v ? `${r.char} ${v}` : r.char;
};

/**
 * @param container phần tử chứa
 * @param options { initial: number[], onChange(nums) }
 * @returns { get(): number[], suggest(chars: {char, radical}[]) }
 */
export function radicalPicker(container, { initial = [], onChange } = {}) {
  // Giữ đúng thứ tự người dùng đã chọn; bỏ số không hợp lệ.
  const valid = new Set(radicalApi.list().items.map((r) => r.num));
  let selected = [...new Set(initial.map(Number))].filter((n) => valid.has(n));
  let matches = [];
  let active = -1;

  container.innerHTML = `
    <div class="rpick" id="rpick">
      <div class="rpick__box">
        <div class="rpick__chips" role="list" aria-label="Bộ thủ đã chọn"></div>
        <input class="rpick__input" id="radical-input" role="combobox" aria-autocomplete="list" aria-expanded="false"
          aria-controls="radical-list" aria-describedby="radical-hint" autocomplete="off" spellcheck="false"
          placeholder="Gõ tên hoặc nghĩa tiếng Việt: thủy, nước, người..." />
      </div>
      <ul class="rpick__list" id="radical-list" role="listbox" aria-label="Bộ thủ phù hợp" hidden></ul>
    </div>
    <div class="rpick__suggest" id="radical-suggest" hidden></div>`;
  const $ = (s) => container.querySelector(s);
  const input = $("#radical-input"), listEl = $("#radical-list"), chips = $(".rpick__chips"), sugg = $("#radical-suggest");
  let suggestions = [];

  const byNum = (n) => radicalApi.get(n);
  const changed = () => { renderChips(); renderSuggest(); onChange?.(selected.slice()); };

  function renderChips() {
    chips.innerHTML = selected.map((n) => {
      const r = byNum(n);
      return `<span class="rpick__chip" role="listitem"><span class="hanzi" lang="zh">${esc(glyph(r))}</span>${esc(radicalApi.label(r))}
        <button type="button" class="tag-x" data-rm="${n}" aria-label="Bỏ bộ ${esc(r.name)}">${icon("x")}</button></span>`;
    }).join("");
    input.placeholder = selected.length ? "Thêm bộ thủ khác..." : "Gõ tên hoặc nghĩa tiếng Việt: thủy, nước, người...";
  }

  function add(n) {
    if (selected.includes(n) || selected.length >= MAX) return;
    selected.push(n);
    input.value = "";
    close();
    changed();
  }

  function open(q) {
    matches = q ? radicalApi.list({ q }).items.filter((r) => !selected.includes(r.num)).slice(0, 8) : [];
    active = matches.length ? 0 : -1;
    renderList(q);
  }
  function close() { matches = []; active = -1; listEl.hidden = true; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); }

  function renderList(q) {
    if (!q) return close();
    listEl.hidden = false;
    input.setAttribute("aria-expanded", "true");
    listEl.innerHTML = matches.length
      ? matches.map((r, i) => `<li role="option" id="rp-opt-${r.num}" class="rpick__opt ${i === active ? "is-active" : ""}" aria-selected="${i === active}" data-num="${r.num}">
          <span class="rpick__char hanzi" lang="zh">${esc(glyph(r))}</span>
          <span class="rpick__text"><strong>${esc(r.name)}</strong> <span>${esc(r.meaning)}</span></span>
          <span class="rpick__meta">#${r.num} · ${r.strokes} nét</span></li>`).join("")
      : `<li class="rpick__empty">Không tìm thấy bộ thủ “${esc(q)}”. Thử tên Hán Việt (Thủy) hoặc nghĩa (nước).</li>`;
    if (active >= 0) input.setAttribute("aria-activedescendant", `rp-opt-${matches[active].num}`);
  }

  /** Gợi ý bộ thủ nhận ra từ chữ Hán đang nhập (bấm để thêm). */
  function renderSuggest() {
    const list = suggestions.filter((x) => x.radical && !selected.includes(x.radical.num));
    const unknown = suggestions.filter((x) => !x.radical);
    const seen = new Set();
    const uniq = list.filter((x) => (seen.has(x.radical.num) ? false : seen.add(x.radical.num)));
    sugg.hidden = !uniq.length && !unknown.length;
    sugg.innerHTML = (uniq.length ? `<span class="rpick__suggest-label">Gợi ý từ chữ Hán:</span>` + uniq.map(({ char, radical: r }) =>
      `<button type="button" class="rpick__sug" data-add="${r.num}" title="Thêm bộ ${esc(r.name)}"><span class="hanzi" lang="zh">${esc(char)}</span>→<span class="hanzi rpick__sug-rad" lang="zh">${esc(glyph(r))}</span>${esc(radicalApi.label(r))}${icon("plus")}</button>`).join("") : "")
      + (unknown.length ? `<span class="rpick__suggest-unknown">${unknown.map((x) => esc(x.char)).join(" ")}: chưa có dữ liệu bộ thủ, bạn có thể tự chọn.</span>` : "");
  }

  input.addEventListener("input", () => open(input.value.trim()));
  input.addEventListener("focus", () => { if (input.value.trim()) open(input.value.trim()); });
  input.addEventListener("keydown", (e) => {
    if (e.isComposing) return;
    if (e.key === "ArrowDown" && matches.length) { e.preventDefault(); active = (active + 1) % matches.length; renderList(input.value.trim()); }
    else if (e.key === "ArrowUp" && matches.length) { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; renderList(input.value.trim()); }
    else if (e.key === "Enter") { e.preventDefault(); if (active >= 0) add(matches[active].num); }
    else if (e.key === "Escape" && !listEl.hidden) { e.stopPropagation(); close(); }
    else if (e.key === "Backspace" && !input.value && selected.length) { selected.pop(); changed(); }
  });
  listEl.addEventListener("mousedown", (e) => {
    const li = e.target.closest("[data-num]");
    if (!li) return;
    e.preventDefault(); // giữ focus ở ô nhập
    add(Number(li.dataset.num));
    input.focus();
  });
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("[data-rm]");
    if (!b) return;
    selected = selected.filter((n) => n !== Number(b.dataset.rm));
    changed(); input.focus();
  });
  sugg.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (b) add(Number(b.dataset.add));
  });
  input.addEventListener("blur", () => setTimeout(close, 120));
  $(".rpick__box").addEventListener("click", (e) => { if (e.target === e.currentTarget || e.target === chips) input.focus(); });

  renderChips();
  return {
    get: () => selected.slice(),
    suggest(list) { suggestions = list; renderSuggest(); },
  };
}
