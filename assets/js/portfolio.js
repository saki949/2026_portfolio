/* 作品集頁渲染：與履歷頁共用 hero、數字帶、卡片語彙（細線、藍橘配色、窄體數字）。 */
(function () {
  "use strict";
  const { t, ctrl, add, esc } = Site.h;

  let activeCategory = "all";
  const selected = {};      // 每個作品目前選到的圖片索引（重繪後仍保留）
  let lightbox = null;      // { itemId, index }

  const templates = {
    portfolioItem: {
      id: "p-new",
      category: "brand",
      isFeatured: false,
      title: "專案名稱",
      tag: "分類標籤",
      desc: "專案描述與成果說明。",
      img: "assets/images/work/coffee_taste.webp",
      metrics: "成果指標"
    }
  };

  const gallery = (item) => (item.gallery && item.gallery.length ? item.gallery : [item.img]);
  const pad2 = (n) => String(n).padStart(2, "0");

  function render(d) {
    const app = document.getElementById("app");
    const m = d.meta;
    const p = d.portfolio;
    const items = p.items;
    const cats = p.categories;
    const imageCount = items.reduce((s, it) => s + gallery(it).length, 0);

    const cards = items.map((item) => {
      const idx = items.indexOf(item);
      const g = gallery(item);
      const cur = Math.min(selected[item.id] || 0, g.length - 1);
      const catName = (cats.find((c) => c.id === item.category) || {}).name || "";
      const thumbs = g.length > 1 ? `
        <div class="thumbs" role="group" aria-label="切換作品圖片">
          ${g.map((src, gi) => `<button type="button" class="thumb" data-swap="${esc(item.id)}" data-i="${gi}" aria-label="放大第 ${gi + 1} 張" aria-pressed="${gi === cur}"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join("")}
        </div>` : "";
      return `
      <article class="p-card" data-id="${esc(item.id)}">
        <button type="button" class="stage" data-open="${esc(item.id)}" aria-label="放大檢視：${esc(item.title)}">
          <img src="${esc(g[cur])}" alt="${esc(item.title)}" loading="lazy">
          ${item.isGif ? '<span class="stage-badge">動態</span>' : ""}
          ${g.length > 1 ? `<span class="stage-count">${cur + 1} / ${g.length}</span>` : ""}
        </button>
        ${thumbs}
        <div class="p-body">
          <div class="p-top">
            <span class="idx" aria-hidden="true">${pad2(items.indexOf(item) + 1)}</span>
            <span class="chip">${esc(catName)}</span>
          </div>
          ${t("p", `portfolio.items.${idx}.tag`, item.tag, "p-tag")}
          ${t("h3", `portfolio.items.${idx}.title`, item.title, "p-title")}
          ${t("p", `portfolio.items.${idx}.desc`, item.desc, "p-desc")}
          ${item.metrics ? t("p", `portfolio.items.${idx}.metrics`, item.metrics, "p-metrics") : ""}
        </div>
        ${ctrl("portfolio.items", idx)}
      </article>`;
    }).join("");

    app.innerHTML = `
      <nav class="topnav" aria-label="頁面切換">
        <a href="index.html">履歷</a>
        <a href="portfolio.html" aria-current="page">作品集</a>
        <a href="print.html" class="nav-print-tag" title="A4直式實體冊列印預覽">📄 列印實體冊 (A4)</a>
        <button type="button" class="nav-edit-btn" id="navEditBtn" data-eb="toggle" aria-pressed="false" title="點擊直接修改頁面文字">✏️ 編輯內容</button>
      </nav>

      <header class="hero">
        <span class="vert" aria-hidden="true">SELECTED WORKS</span>
        <div class="hero-top">
          <figure class="hero-photo">
            <img src="${esc(m.photo)}" alt="${esc(m.photoAlt || m.name)}">
          </figure>
          <div class="hero-main">
            <p class="eyebrow">${esc(m.role)}</p>
            ${t("h1", "portfolio.title", p.title, "name latin")}
            ${t("p", "portfolio.summary", p.summary, "tagline")}
          </div>
        </div>
      </header>

      <section class="stats" aria-label="作品集概況">
        <ul>
          <li><span class="num"><b>${items.length}</b><i>組</i></span><span class="lbl">作品專案</span></li>
          <li><span class="num"><b>${imageCount}</b><i>張</i></span><span class="lbl">作品圖片</span></li>
          <li><span class="num"><b>${cats.length - 2}</b><i>類</i></span><span class="lbl">作品分類</span></li>
          <li><span class="num"><b>20</b><i>+</i></span><span class="lbl">包裝款式</span></li>
        </ul>
      </section>

      <section class="p-wrap">
        <h2><span>SELECTED WORKS</span>專案作品</h2>
        <div class="p-grid">${cards}</div>
        ${add("portfolio.items", "portfolioItem", "新增作品項目")}
      </section>

      <footer class="foot">
        <p>${esc(m.role)}　·　<a href="index.html">返回履歷</a></p>
      </footer>

      <dialog class="lb" aria-label="作品放大檢視">
        <button type="button" class="lb-close" data-lb="close" aria-label="關閉">✕</button>
        <button type="button" class="lb-nav lb-prev" data-lb="prev" aria-label="上一張">‹</button>
        <figure>
          <div class="lb-view">
            <img alt="">
          </div>
          <figcaption></figcaption>
        </figure>
        <button type="button" class="lb-nav lb-next" data-lb="next" aria-label="下一張">›</button>
      </dialog>`;

    if (lightbox) paintLightbox(true);
  }

  /* ---------- 燈箱 ---------- */
  function currentItem() {
    return Site.data.portfolio.items.find((i) => i.id === lightbox.itemId);
  }
  function paintLightbox(reopen) {
    const dlg = document.querySelector("dialog.lb");
    const item = currentItem();
    if (!dlg || !item) return;
    const g = gallery(item);
    lightbox.index = (lightbox.index + g.length) % g.length;
    const img = dlg.querySelector("img");
    img.src = g[lightbox.index];
    img.alt = item.title;
    dlg.querySelector("figcaption").textContent = `${item.title}　${lightbox.index + 1} / ${g.length}`;
    dlg.classList.toggle("single", g.length < 2);
    if (reopen && !dlg.open) dlg.showModal();
  }
  function openLightbox(id, index) {
    const item = Site.data.portfolio.items.find((i) => i.id === id);
    if (!item) return;
    const g = gallery(item);
    const targetIdx = typeof index === "number" ? Math.max(0, Math.min(index, g.length - 1)) : Math.min(selected[id] || 0, g.length - 1);
    selected[id] = targetIdx;
    lightbox = { itemId: id, index: targetIdx };
    paintLightbox(true);
  }
  function closeLightbox() {
    const dlg = document.querySelector("dialog.lb");
    if (lightbox) selected[lightbox.itemId] = lightbox.index;
    lightbox = null;
    if (dlg && dlg.open) dlg.close();
    Site.render();
  }

  document.addEventListener("click", (e) => {
    if (Site.editing) return;

    /* 點下方縮圖直接放大開燈箱 */
    const swap = e.target.closest("[data-swap]");
    if (swap) {
      openLightbox(swap.dataset.swap, Number(swap.dataset.i));
      return;
    }
    const open = e.target.closest("[data-open]");
    if (open) { openLightbox(open.dataset.open); return; }

    const lb = e.target.closest("[data-lb]");
    if (lb && lightbox) {
      const a = lb.dataset.lb;
      if (a === "close") closeLightbox();
      if (a === "prev") { lightbox.index--; paintLightbox(); }
      if (a === "next") { lightbox.index++; paintLightbox(); }
      return;
    }
    /* 點到燈箱外圍（backdrop）也關閉 */
    if (e.target.matches && e.target.matches("dialog.lb")) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox) return;
    if (e.key === "ArrowLeft") { lightbox.index--; paintLightbox(); }
    if (e.key === "ArrowRight") { lightbox.index++; paintLightbox(); }
  });
  document.addEventListener("close", (e) => {
    if (e.target.matches && e.target.matches("dialog.lb") && lightbox) closeLightbox();
  }, true);

  /* iPad 左右滑動換圖 */
  let sx = null;
  document.addEventListener("pointerdown", (e) => { if (lightbox && e.target.closest("dialog.lb figure")) sx = e.clientX; });
  document.addEventListener("pointerup", (e) => {
    if (sx == null || !lightbox) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) { lightbox.index += dx < 0 ? 1 : -1; paintLightbox(); }
  });

  Site.init({ defaults: window.SITE_DEFAULT, render, templates });
})();
