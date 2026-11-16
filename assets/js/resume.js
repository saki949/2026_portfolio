/* 履歷頁渲染。內容來自 window.SITE_DEFAULT（assets/js/content.js）。 */
(function () {
  "use strict";
  const { t, ctrl, add, esc } = Site.h;

  const templates = {
    job: { company: "公司名稱", role: "職稱", period: "YYYY/MM – YYYY/MM", bullets: ["重點成果"] },
    bullet: "新的一點",
    strength: { title: "強項標題", text: "一句話說明。" },
    stat: { num: "0", unit: "", label: "說明" },
    kase: { title: "案例標題", text: "說明這個作法與結果。" },
    skillGroup: { group: "技能類別", items: ["技能"] },
    skillItem: "新技能",
    edu: { title: "學校　科系", period: "YYYY/MM – YYYY/MM" },
    cert: "新證照"
  };

  function qrSvg(url) {
    try {
      const qr = qrcode(0, "M");
      qr.addData(url);
      qr.make();
      return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch (e) {
      return "";
    }
  }

  function render(d) {
    const m = d.meta;
    const app = document.getElementById("app");

    const strengths = d.intro.strengths.map((s, i) => `
      <li class="strength">
        <span class="idx" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <div>
          ${t("h3", `intro.strengths.${i}.title`, s.title)}
          ${t("p", `intro.strengths.${i}.text`, s.text)}
        </div>
        ${ctrl("intro.strengths", i)}
      </li>`).join("");

    const stats = d.stats.map((s, i) => `
      <li>
        <span class="num"><b data-path="stats.${i}.num">${esc(s.num)}</b><i data-path="stats.${i}.unit">${esc(s.unit)}</i></span>
        ${t("span", `stats.${i}.label`, s.label, "lbl")}
        ${ctrl("stats", i, { move: false })}
      </li>`).join("");

    const f = d.featured;
    const cases = f.cases.map((c, i) => `
      <li>
        <span class="idx" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <div>${t("h4", `featured.cases.${i}.title`, c.title)}${t("p", `featured.cases.${i}.text`, c.text)}</div>
        ${ctrl("featured.cases", i)}
      </li>`).join("");

    const jobs = d.jobs.map((j, ji) => `
      <article class="job">
        <header>
          ${t("p", `jobs.${ji}.period`, j.period, "period")}
          <div>
            ${t("h3", `jobs.${ji}.company`, j.company)}
            ${t("p", `jobs.${ji}.role`, j.role, "role")}
          </div>
        </header>
        <div class="job-body">
          <ul>${j.bullets.map((b, bi) => `<li>${t("span", `jobs.${ji}.bullets.${bi}`, b)}${ctrl(`jobs.${ji}.bullets`, bi, { move: false })}</li>`).join("")}</ul>
          ${add(`jobs.${ji}.bullets`, "bullet", "新增一點")}
        </div>
        ${ctrl("jobs", ji)}
      </article>`).join("");

    const skills = d.skills.map((g, gi) => `
      <div class="skill-group">
        ${t("h4", `skills.${gi}.group`, g.group)}
        <ul class="chips">${g.items.map((s, si) => `<li>${t("span", `skills.${gi}.items.${si}`, s)}${ctrl(`skills.${gi}.items`, si, { move: false })}</li>`).join("")}</ul>
        ${add(`skills.${gi}.items`, "skillItem", "新增技能")}
        ${ctrl("skills", gi)}
      </div>`).join("");

    const edu = d.education.map((e, i) => `
      <li>
        ${t("p", `education.${i}.title`, e.title, "strong")}
        ${e.desc ? t("p", `education.${i}.desc`, e.desc, "edu-desc") : ""}
        ${t("p", `education.${i}.period`, e.period, "muted")}
        ${ctrl("education", i)}
      </li>`).join("");

    const certs = d.certs.map((c, i) => `<li>${t("span", `certs.${i}`, c)}${ctrl("certs", i, { move: false })}</li>`).join("");

    app.innerHTML = `
      <nav class="topnav" aria-label="頁面切換">
        <a href="index.html" aria-current="page">履歷</a>
        <a href="portfolio.html">作品集</a>
        <a href="print.html" class="nav-print-tag" title="A4直式實體冊列印預覽">📄 列印實體冊 (A4)</a>
        <button type="button" class="nav-edit-btn" id="navEditBtn" data-eb="toggle" aria-pressed="false" title="點擊直接修改頁面文字">✏️ 編輯內容</button>
      </nav>

      <header class="hero">
        <span class="vert" aria-hidden="true">RÉSUMÉ 2026</span>
        <div class="hero-top">
          <figure class="hero-photo">
            <img src="${esc(m.photo || 'assets/images/photo01.webp')}" alt="${esc(m.photoAlt || m.name)}" class="photo-img">
            <button type="button" class="photo-switch-btn" data-photo-toggle title="切換工作照 / 休閒照">切換照片</button>
          </figure>
          <div class="hero-main">
            <p class="eyebrow">${t("span", "meta.role", m.role)}</p>
            ${t("h1", "meta.name", m.name, "name")}
            ${t("p", "meta.tagline", m.tagline, "tagline")}
          </div>
        </div>
        <div class="hero-contact">
          <dl>
            ${m.phone ? `<div><dt>電話</dt><dd><a href="tel:${esc(m.phone)}" data-path="meta.phone">${esc(m.phone)}</a></dd></div>` : ""}
            <div><dt>Email</dt><dd><a href="mailto:${esc(m.email)}" data-path="meta.email">${esc(m.email)}</a></dd></div>
            ${m.onlineUrl ? `<div><dt>作品集</dt><dd><a href="${esc(m.onlineUrl)}" target="_blank" rel="noopener">線上連結</a></dd></div>` : ""}
          </dl>
        </div>
      </header>

      <section class="stats" aria-label="關鍵數字">
        <ul>${stats}</ul>
        ${add("stats", "stat", "新增數字")}
      </section>

      <section class="intro">
        <h2><span>ABOUT</span>簡介</h2>
        <div class="intro-body">
          ${t("p", "intro.summary", d.intro.summary, "lead")}
          <ul class="strengths">${strengths}</ul>
          ${add("intro.strengths", "strength", "新增強項")}
        </div>
      </section>

      <section class="exp">
        <h2><span>EXPERIENCE</span>工作經歷</h2>

        <article class="featured">
          ${t("span", "featured.badge", f.badge, "badge")}
          <div class="feat-head">
            <div>
              ${t("h3", "featured.company", f.company)}
              ${t("p", "featured.role", f.role, "role")}
            </div>
            ${t("p", "featured.period", f.period, "period")}
          </div>
          ${t("p", "featured.result", f.result, "result")}
          <ol class="cases">${cases}</ol>
          ${add("featured.cases", "kase", "新增案例")}
          <a class="feat-link" href="${esc(f.portfolioLink)}">${t("span", "featured.portfolioLinkLabel", f.portfolioLinkLabel)} →</a>
        </article>

        <div class="jobs">${jobs}${add("jobs", "job", "新增經歷")}</div>
      </section>

      <section class="bottom">
        <div class="skills">
          <h2><span>SKILLS</span>核心技能</h2>
          ${skills}
          ${add("skills", "skillGroup", "新增技能類別")}
        </div>
        <div class="side">
          <h2><span>EDUCATION</span>學歷</h2>
          <ul class="edu">${edu}</ul>
          ${add("education", "edu", "新增學歷")}
          <h2 class="sub"><span>CERTIFICATES</span>證照與語言</h2>
          <ul class="certs">${certs}</ul>
          ${add("certs", "cert", "新增證照")}
        </div>
      </section>

      <footer class="foot">
        <p>${esc(m.name)}　·　${esc(m.role)}　·　${esc(m.email)}</p>
      </footer>`;
  }

  Site.init({ defaults: window.SITE_DEFAULT, render, templates });
})();
