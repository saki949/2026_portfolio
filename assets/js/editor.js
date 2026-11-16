/* 共用編輯引擎：履歷頁與作品集頁都使用。
 * 啟用方式：網址加上 ?edit。一般瀏覽（面試展示）完全不載入任何編輯介面。 */
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  // 右上角隨時提供「編輯內容」按鈕，讓本人或瀏覽者可直接點擊進入編輯模式
  const EDIT_AVAILABLE = true;
  const KEY = "resume-site-draft-v2";

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const getPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
  const setPath = (obj, path, val) => {
    const keys = path.split(".");
    const last = keys.pop();
    const parent = keys.reduce((o, k) => o[k], obj);
    parent[last] = val;
  };

  const Site = {
    data: null,
    editing: false,
    available: EDIT_AVAILABLE,
    templates: {},
    _render: null,
    _past: [],
    _future: [],
    _timer: null,
    _last: "",

    init({ defaults, render, templates }) {
      this._render = render;
      this.templates = templates || {};
      let data = clone(defaults);
      if (EDIT_AVAILABLE) {
        try {
          const saved = localStorage.getItem(KEY);
          if (saved) data = JSON.parse(saved);
        } catch (e) { /* 草稿損毀就忽略 */ }
      }
      this.data = data;
      this._last = JSON.stringify(data);
      this.applyTheme();
      this.render();
      if (EDIT_AVAILABLE) this.buildToolbar();
    },

    render() {
      this._render(this.data);
      this.applyTheme();
      document.body.classList.toggle("editing", this.editing);
      this.decorate();
    },

    /* 讓有 data-path 的元素變成可編輯文字 */
    decorate() {
      document.querySelectorAll("[data-path]").forEach((el) => {
        if (this.editing) {
          el.setAttribute("contenteditable", "plaintext-only");
          el.setAttribute("spellcheck", "false");
          el.setAttribute("enterkeyhint", "done");
        } else {
          el.removeAttribute("contenteditable");
        }
      });
    },

    applyTheme() {
      const t = (this.data && this.data.theme) || {};
      const root = document.documentElement;
      if (t.accent) root.style.setProperty("--accent", t.accent);
      if (t.accent2) root.style.setProperty("--accent-2", t.accent2);
      root.dataset.mode = t.mode || "light";
    },

    /* ---------- 歷史紀錄 ---------- */
    commit() {
      clearTimeout(this._timer);
      const now = JSON.stringify(this.data);
      if (now === this._last) return;
      this._past.push(this._last);
      if (this._past.length > 100) this._past.shift();
      this._future = [];
      this._last = now;
      try { localStorage.setItem(KEY, now); } catch (e) { /* 空間不足 */ }
      this.updateButtons();
    },
    scheduleCommit() {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => this.commit(), 500);
    },
    undo() {
      this.commit();
      if (!this._past.length) return;
      this._future.push(this._last);
      this._last = this._past.pop();
      this.restore();
    },
    redo() {
      if (!this._future.length) return;
      this._past.push(this._last);
      this._last = this._future.pop();
      this.restore();
    },
    restore() {
      this.data = JSON.parse(this._last);
      try { localStorage.setItem(KEY, this._last); } catch (e) { /* noop */ }
      this.render();
      this.updateButtons();
    },

    /* ---------- 結構操作 ---------- */
    mutate(fn) {
      this.commit();
      fn(this.data);
      this.render();
      this.commit();
    },

    /* ---------- 工具列 ---------- */
    buildToolbar() {
      const bar = document.createElement("div");
      bar.className = "edit-bar";
      bar.setAttribute("role", "toolbar");
      bar.setAttribute("aria-label", "編輯工具");
      bar.innerHTML = `
        <button type="button" class="eb-main" data-eb="toggle" aria-pressed="false">✏️ 編輯內容</button>
        <div class="eb-tools" hidden>
          <button type="button" data-eb="undo" aria-label="復原">↶ 復原</button>
          <button type="button" data-eb="redo" aria-label="重做">↷ 重做</button>
          <label class="eb-color">主色<input type="color" data-eb="accent"></label>
          <label class="eb-color">輔色<input type="color" data-eb="accent2"></label>
          <button type="button" data-eb="mode">切換深淺</button>
          <button type="button" data-eb="export">💾 匯出 content.js</button>
          <button type="button" data-eb="print">🖨️ 列印</button>
          <button type="button" data-eb="reset">重設草稿</button>
        </div>
        <p class="eb-note" hidden>草稿會自動存在您的這台瀏覽器。修改完成後點擊「匯出 content.js」覆蓋檔案即可永久生效。</p>`;
      document.body.appendChild(bar);
      this.bar = bar;

      document.addEventListener("click", (e) => {
        const b = e.target.closest("[data-eb]");
        if (!b) return;
        const act = b.dataset.eb;
        if (act === "toggle") {
          e.preventDefault();
          this.setEditing(!this.editing);
          return;
        }
        if (act === "undo") this.undo();
        if (act === "redo") this.redo();
        if (act === "mode") this.mutate((d) => { d.theme.mode = d.theme.mode === "dark" ? "light" : "dark"; });
        if (act === "export") this.exportContent();
        if (act === "print") window.print();
        if (act === "reset" && confirm("確定清除草稿並回到預設內容？")) {
          localStorage.removeItem(KEY);
          location.reload();
        }
      });
      document.addEventListener("input", (e) => {
        const b = e.target.closest("[data-eb]");
        if (!b) return;
        if (b.dataset.eb === "accent" || b.dataset.eb === "accent2") {
          this.data.theme[b.dataset.eb === "accent" ? "accent" : "accent2"] = b.value;
          this.applyTheme();
          this.scheduleCommit();
        }
      });

      /* 文字輸入與結構按鈕：事件代理，頁面重繪後仍有效 */
      document.addEventListener("input", (e) => {
        const el = e.target.closest && e.target.closest("[data-path]");
        if (!el || !this.editing) return;
        setPath(this.data, el.dataset.path, el.textContent);
        this.scheduleCommit();
      });
      document.addEventListener("keydown", (e) => {
        const el = e.target.closest && e.target.closest("[data-path]");
        if (!el || !this.editing) return;
        if (e.key === "Enter") {
          e.preventDefault();
          /* 中文輸入法選字時的 Enter 不能當作「完成」，Safari 需額外檢查 keyCode 229 */
          if (e.isComposing || e.keyCode === 229) return;
          el.blur();
        }
      });
      document.addEventListener("blur", (e) => {
        if (e.target.closest && e.target.closest("[data-path]") && this.editing) this.commit();
      }, true);
      document.addEventListener("click", (e) => {
        if (!this.editing) return;
        const b = e.target.closest("[data-act]");
        if (!b) return;
        e.preventDefault();
        const { act, path, tpl } = b.dataset;
        this.mutate((d) => {
          const arr = getPath(d, path);
          const idx = Number(b.dataset.index);
          if (act === "add") arr.push(clone(this.templates[tpl]));
          if (act === "del") arr.splice(idx, 1);
          if (act === "up" && idx > 0) [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
          if (act === "down" && idx < arr.length - 1) [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
        });
      });
      /* 編輯模式下不要誤觸連結跳頁 */
      document.addEventListener("click", (e) => {
        if (this.editing && e.target.closest("a[href]") && !e.target.closest(".edit-bar")) e.preventDefault();
      }, true);

      /* 切換照片事件 */
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-photo-toggle]");
        if (!btn || !this.editing) return;
        this.mutate((d) => {
          const current = d.meta.photo || "";
          if (current.includes("photo01")) {
            d.meta.photo = "assets/images/photo02.webp";
          } else {
            d.meta.photo = "assets/images/photo01.webp";
          }
        });
      });

      this.updateButtons();
    },

    setEditing(on) {
      this.editing = on;
      if (this.bar) {
        this.bar.querySelector(".eb-tools").hidden = !on;
        this.bar.querySelector(".eb-note").hidden = !on;
      }
      document.querySelectorAll('[data-eb="toggle"]').forEach((btn) => {
        btn.textContent = on ? "✓ 完成編輯" : "✏️ 編輯內容";
        btn.setAttribute("aria-pressed", String(on));
        btn.classList.toggle("is-active", on);
      });
      this.render();
      if (this.bar) this.syncColorInputs();
    },

    syncColorInputs() {
      const t = this.data.theme;
      this.bar.querySelector('[data-eb="accent"]').value = t.accent;
      this.bar.querySelector('[data-eb="accent2"]').value = t.accent2;
    },

    updateButtons() {
      if (!this.bar) return;
      this.bar.querySelector('[data-eb="undo"]').disabled = !this._past.length;
      this.bar.querySelector('[data-eb="redo"]').disabled = !this._future.length;
    },

    exportContent() {
      this.commit();
      const body = "/* 由編輯模式匯出。取代 assets/js/content.js 後再 push 即可公開。 */\nwindow.SITE_DEFAULT = " +
        JSON.stringify(this.data, null, 2) + ";\n";
      const blob = new Blob([body], { type: "text/javascript" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "content.js";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
  };

  /* 渲染模組共用的小工具 */
  Site.h = {
    esc: (s) => String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/&lt;br\s*\/?&gt;/gi, "<br>"),
    /* 可編輯文字節點 */
    t(tag, path, value, cls) {
      return `<${tag}${cls ? ` class="${cls}"` : ""} data-path="${path}">${Site.h.esc(value)}</${tag}>`;
    },
    /* 編輯模式才會出現的陣列操作按鈕 */
    ctrl(path, index, opts = {}) {
      return `<span class="ctl" aria-hidden="false">` +
        (opts.move === false ? "" : `<button type="button" data-act="up" data-path="${path}" data-index="${index}" aria-label="上移">↑</button><button type="button" data-act="down" data-path="${path}" data-index="${index}" aria-label="下移">↓</button>`) +
        `<button type="button" class="danger" data-act="del" data-path="${path}" data-index="${index}" aria-label="刪除">✕</button></span>`;
    },
    add(path, tpl, label) {
      return `<button type="button" class="add-btn" data-act="add" data-path="${path}" data-tpl="${tpl}">＋ ${Site.h.esc(label)}</button>`;
    }
  };

  window.Site = Site;
})();
