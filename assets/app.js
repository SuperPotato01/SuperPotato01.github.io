/* ============================================================
   app.js —— 全站共享行为（无依赖）
   各模块都有存在性判断，页面缺对应元素时自动跳过
   ============================================================ */
"use strict";

(function () {
  var root = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 主题切换（记忆到 localStorage） ---------- */
  (function theme() {
    var saved = null;
    try { saved = localStorage.getItem("theme"); } catch (e) { /* 隐私模式忽略 */ }
    if (!saved && matchMedia("(prefers-color-scheme: dark)").matches) saved = "dark";
    if (saved) root.setAttribute("data-theme", saved);

    // 浏览器 UI 配色跟随主题（手机状态栏 / 地址栏）
    var meta = document.querySelector('meta[name="theme-color"]');
    function syncUI() {
      var isDark = root.getAttribute("data-theme") === "dark";
      if (meta) meta.setAttribute("content", isDark ? "#0a101e" : "#0c1526");
      // 光标光晕在暗色下偏紫
      var glow = $(".cursor-glow");
      if (glow) {
        glow.style.background = isDark
          ? "radial-gradient(circle, rgba(123,92,230,0.10), transparent 65%)"
          : "radial-gradient(circle, rgba(59,111,212,0.07), transparent 65%)";
      }
    }
    syncUI();

    var btn = $("#themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      syncUI();
      try { localStorage.setItem("theme", next); } catch (e) { /* 忽略 */ }
    });
  })();

  /* ---------- 2. 入场动画 ---------- */
  (function reveal() {
    var els = $$(".reveal");
    if (!els.length) return;
    if (!("IntersectionObserver" in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 3. 数字滚动计数 ---------- */
  (function counters() {
    var els = $$("[data-count]");
    if (!els.length) return;

    function run(el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || "";
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var steps = 45, i = 0;
      var timer = setInterval(function () {
        i++;
        var v = Math.round(target * (i / steps));
        el.textContent = v + suffix;
        if (i >= steps) { clearInterval(timer); el.textContent = target + suffix; }
      }, 28);
    }

    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 4. 首屏轮播词 ---------- */
  (function rotator() {
    var el = $("#heroRotator");
    if (!el || reduceMotion) return;
    var words = (el.dataset.words || "").split("|").filter(Boolean);
    if (words.length < 2) return;
    var i = 0;
    setInterval(function () {
      el.classList.add("switching");
      setTimeout(function () {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.remove("switching");
      }, 300);
    }, 2600);
  })();

  /* ---------- 5. 滚动监听：返回顶部 + 导航高亮 ---------- */
  (function scrolls() {
    var toTop = $("#toTop");
    var links = $$('.nav-links a[href^="#"]');
    var map = {};
    links.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute("href"));
      if (sec) map[a.getAttribute("href").slice(1)] = a;
    });

    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    var spy = null;
    if (sections.length && "IntersectionObserver" in window) {
      spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var link = map[e.target.id];
          if (!link) return;
          if (e.isIntersecting) {
            links.forEach(function (a) { a.classList.remove("active"); });
            link.classList.add("active");
          }
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      sections.forEach(function (s) { spy.observe(s); });
    }

    var ticking = false;
    addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        if (toTop) toTop.classList.toggle("show", scrollY > 600);
        ticking = false;
      });
    }, { passive: true });

    if (toTop) {
      toTop.addEventListener("click", function () {
        scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }
  })();

  /* ---------- 6. 作品卡 3D 倾斜（仅支持 hover 的设备） ---------- */
  (function tilt() {
    if (reduceMotion || !matchMedia("(hover: hover)").matches) return;
    $$(".work-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(800px) rotateY(" + (px * 7).toFixed(2) + "deg) rotateX(" +
          (-py * 7).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  })();

  /* ---------- 7. 光标光晕 ---------- */
  (function glow() {
    var el = $(".cursor-glow");
    if (!el || reduceMotion || !matchMedia("(hover: hover)").matches) return;
    var tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty;
    addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      el.classList.add("on");
    }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.left = cx + "px";
      el.style.top = cy + "px";
      requestAnimationFrame(loop);
    })();
  })();

  /* ---------- 8. 代码块一键复制 ---------- */
  (function codeCopy() {
    if (!navigator.clipboard) return;
    $$(".post-body pre").forEach(function (pre) {
      var btn = document.createElement("button");
      btn.className = "code-copy";
      btn.type = "button";
      btn.textContent = "复制";
      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(pre.querySelector("code") ?
          pre.querySelector("code").innerText : pre.innerText).then(function () {
          btn.textContent = "已复制";
          btn.classList.add("done");
          setTimeout(function () {
            btn.textContent = "复制";
            btn.classList.remove("done");
          }, 1600);
        });
      });
      pre.appendChild(btn);
    });
  })();

  /* ---------- 9. 文章阅读进度条 ---------- */
  (function progress() {
    var bar = $("#readProgress");
    if (!bar) return;
    addEventListener("scroll", function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0).toFixed(1) + "%";
    }, { passive: true });
  })();

  /* ---------- 10. 博客文章搜索 + 标签过滤 ---------- */
  (function blogFilter() {
    var input = $("#postSearch");
    var items = $$(".post-item");
    if (!input || !items.length) return;
    var chips = $$(".tag-chip");
    var empty = $("#resEmpty");
    var activeCat = "*";

    function apply() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (it) {
        var text = it.textContent.toLowerCase();
        var tags = it.getAttribute("data-tags") || "";
        var okCat = activeCat === "*" || tags.split(",").indexOf(activeCat) >= 0;
        var ok = okCat && (!q || text.indexOf(q) >= 0);
        it.classList.toggle("hidden", !ok);
        if (ok) shown++;
      });
      if (empty) empty.classList.toggle("show", shown === 0);
    }

    input.addEventListener("input", apply);
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        activeCat = chip.dataset.cat;
        apply();
      });
    });
  })();

  /* ---------- 11. 资源库过滤（按分类 + 搜索） ---------- */
  (function resFilter() {
    var input = $("#resSearch");
    var groups = $$(".res-group");
    if (!input || !groups.length) return;
    var chips = $$(".tag-chip");
    var empty = $("#resEmpty");
    var cat = "*";

    function apply() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      groups.forEach(function (g) {
        var myCat = g.getAttribute("data-cat") || (g.querySelector("h2") || {}).textContent || "";
        var cards = Array.prototype.slice.call(g.querySelectorAll(".res-card"));
        var visible = 0;
        cards.forEach(function (c) {
          var okCat = cat === "*" || myCat.indexOf(cat) === 0;
          var ok = okCat && (!q || c.textContent.toLowerCase().indexOf(q) >= 0);
          c.style.display = ok ? "" : "none";
          if (ok) visible++;
        });
        g.style.display = visible ? "" : "none";
        shown += visible;
      });
      if (empty) empty.classList.toggle("show", shown === 0);
    }

    input.addEventListener("input", apply);
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        cat = chip.dataset.cat;
        apply();
      });
    });
  })();

  /* ---------- 12. 复制邮箱 ---------- */
  (function copyMail() {
    var btn = $("#copyMail");
    if (!btn || !navigator.clipboard) return;
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(btn.dataset.mail || "").then(function () {
        var old = btn.textContent;
        btn.textContent = "已复制 ✓";
        setTimeout(function () { btn.textContent = old; }, 1600);
      });
    });
  })();

  /* ---------- 13. 导航自动隐藏（下滑隐藏 / 上滑显示） ---------- */
  (function navAutoHide() {
    var nav = $(".nav");
    if (!nav) return;
    var last = scrollY, ticking = false;
    addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = scrollY;
        var hide = y > 220 && y > last;
        nav.style.transform = hide ? "translateY(-100%)" : "";
        last = y;
        ticking = false;
      });
    }, { passive: true });
  })();

  /* ---------- 14. 键盘快捷键（D 切主题 / / 聚焦搜索 / T 回顶部） ---------- */
  (function shortcuts() {
    addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      var k = e.key.toLowerCase();
      if (k === "d") {
        var btn = $("#themeToggle");
        if (btn) btn.click();
      } else if (k === "/") {
        var box = $("#postSearch") || $("#resSearch");
        if (box) { e.preventDefault(); box.focus(); }
      } else if (k === "t") {
        scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      }
    });
  })();

  /* ---------- 15. 外链自动新窗口打开 ---------- */
  (function externalLinks() {
    $$("a[href^='http']").forEach(function (a) {
      if (a.hostname && a.hostname !== location.hostname && !a.target) {
        a.target = "_blank";
        a.rel = "noopener";
      }
    });
  })();

  /* ---------- 16. 文章预计阅读时长 ---------- */
  (function readingTime() {
    var body = $(".post-body");
    var meta = $(".post-header .p-meta");
    if (!body || !meta) return;
    var text = body.innerText || "";
    var cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    var en = (text.replace(/[\u4e00-\u9fa5]/g, " ").match(/[a-zA-Z]+/g) || []).length;
    var mins = Math.max(1, Math.round(cn / 400 + en / 220));
    if (meta.textContent.indexOf("阅读") < 0) {
      meta.textContent = meta.textContent.replace(/\s*$/, "") + " · 阅读约 " + mins + " 分钟";
    }
  })();

  /* ---------- 17. 文章自动目录（桌面侧边悬浮） ---------- */
  (function toc() {
    var body = $(".post-body");
    if (!body) return;
    var heads = Array.prototype.slice.call(body.querySelectorAll("h2"));
    if (heads.length < 3 || !matchMedia("(min-width: 1180px)").matches) return;

    heads.forEach(function (h, i) {
      if (!h.id) h.id = "sec-" + i;
    });

    var box = document.createElement("aside");
    box.className = "toc";
    box.innerHTML = '<div class="toc-title">本页目录</div>';
    var ul = document.createElement("ul");
    heads.forEach(function (h, i) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + (h.id || "sec-" + i);
      a.textContent = h.textContent;
      li.appendChild(a);
      ul.appendChild(li);
    });
    box.appendChild(ul);
    document.body.appendChild(box);

    var links = Array.prototype.slice.call(ul.querySelectorAll("a"));
    addEventListener("scroll", function () {
      var idx = 0;
      heads.forEach(function (h, i) {
        if (h.getBoundingClientRect().top < 160) idx = i;
      });
      links.forEach(function (a, i) { a.classList.toggle("on", i === idx); });
    }, { passive: true });
  })();

  /* ---------- 18. 页面载入淡入 ---------- */
  (function fadeIn() {
    if (reduceMotion) { document.body.classList.add("loaded"); return; }
    requestAnimationFrame(function () { document.body.classList.add("loaded"); });
  })();

  /* ---------- 20. 移动端省流量：视频降级 + 首屏动画降频 ---------- */
  (function mobileSaver() {
    var v = $(".hero-video");
    if (!v) return;
    if (matchMedia("(max-width: 560px)").matches ||
        (navigator.connection && /2g|slow/.test(navigator.connection.effectiveType || ""))) {
      v.setAttribute("preload", "metadata");
      // 弱网/手机：暂停播放，只保留海报帧
      if (navigator.connection && /2g|slow/.test(navigator.connection.effectiveType || "")) {
        v.removeAttribute("autoplay");
        v.pause();
      }
    }
  })();

  /* ---------- 21. 首屏视频加载失败时回退到渐变 ---------- */
  (function videoFallback() {
    var v = $(".hero-video");
    if (!v) return;
    v.addEventListener("error", function () {
      v.style.display = "none";
      var hero = $(".hero");
      if (hero) hero.classList.add("no-video");
    });
  })();

  /* ---------- 22. 文章底部「上一篇 / 下一篇」快速切换 ---------- */
  (function prevNext() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".post-nav a[data-nav]"));
    if (!links.length) return;
    links.forEach(function (a) {
      var cur = (location.pathname.split("/").pop() || "").toLowerCase();
      if ((a.getAttribute("href") || "").toLowerCase().indexOf(cur) === 0) {
        a.classList.add("current");
      }
    });
  })();

  /* ---------- 23. 视频离开视口时暂停（省电省 CPU） ---------- */
  (function videoPause() {
    var v = $(".hero-video");
    if (!v || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var p = v.play();
          if (p && p.catch) p.catch(function () { /* 自动播放被拦截时忽略 */ });
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.05 });
    io.observe(v);
  })();

  /* ---------- 24. 文章小标题锚点链接 ---------- */
  (function headingAnchors() {
    var heads = $$(".post-body h2[id], .post-body h3");
    heads.forEach(function (h) {
      if (!h.id) {
        h.id = (h.textContent || "").trim().replace(/\s+/g, "-").slice(0, 24);
      }
      var a = document.createElement("a");
      a.className = "h-anchor";
      a.href = "#" + h.id;
      a.textContent = "#";
      a.setAttribute("aria-label", "跳转到该章节");
      h.appendChild(a);
    });
  })();

  /* ---------- 25. 导航当前项无障碍标记 ---------- */
  (function ariaCurrent() {
    var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    $$(".nav-links a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").toLowerCase();
      if (href === here || (here === "" && href === "index.html")) {
        a.setAttribute("aria-current", "page");
      }
    });
  })();

  /* ---------- 19. 页脚时钟 ---------- */
  (function clock() {
    var el = $("#clock");
    if (!el) return;
    function tick() {
      var d = new Date();
      var p = function (n) { return String(n).padStart(2, "0"); };
      el.textContent = "本地时间 " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ============================================================
     v8 新增层：命令面板 / 代码高亮 / 滚动增强 / PWA
     ============================================================ */

  /* 通用 Toast —— 函数声明提升，供以下模块共用 */
  var toastTimer = null;
  function toast(msg) {
    var el = $("#siteToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "siteToast";
      el.className = "site-toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }
  window.__siteToast = toast; // 供外部内联调用

  /* ---------- 26. Ctrl/⌘ + K 命令面板 ---------- */
  (function commandPalette() {
    var BASE = location.pathname.indexOf("/posts/") >= 0 ? "../" : "";
    function copyText(t) {
      if (navigator.clipboard) return navigator.clipboard.writeText(t);
      return Promise.resolve();
    }
    var CMDS = [
      { t: "首页", d: "回到主页", ic: "⌂", run: function () { location.href = BASE + "index.html"; } },
      { t: "关于我", d: "技能栈与经历", ic: "◑", run: function () { location.href = BASE + "index.html#about"; } },
      { t: "作品与项目", d: "4 个嵌入式项目", ic: "▦", run: function () { location.href = BASE + "index.html#work"; } },
      { t: "博客", d: "文章列表 · 可搜索", ic: "✎", run: function () { location.href = BASE + "blog.html"; } },
      { t: "资源库", d: "收藏的技术站点", ic: "❖", run: function () { location.href = BASE + "resources.html"; } },
      { t: "联系我", d: "邮箱 / GitHub", ic: "✉", run: function () { location.href = BASE + "index.html#contact"; } },
      { t: "赛博朋克 Demo", d: "SYSTEM ONLINE", ic: "◈", run: function () { location.href = BASE + "cyberpunk-panel.html"; } },
      { t: "文章 · 从零搭一个个人网站", d: "2026-10-25", ic: "›", run: function () { location.href = BASE + "posts/hello-world.html"; } },
      { t: "文章 · FreeRTOS 任务优先级踩坑", d: "2026-08-14", ic: "›", run: function () { location.href = BASE + "posts/freertos-tasks.html"; } },
      { t: "文章 · 串口调试 printf 背后", d: "2026-05-30", ic: "›", run: function () { location.href = BASE + "posts/serial-debug.html"; } },
      { t: "切换深色 / 浅色主题", d: "明暗切换", ic: "◐", run: function () { var b = $("#themeToggle"); if (b) b.click(); } },
      { t: "复制本页链接", d: location.host || "分享", ic: "⧉", run: function () { copyText(location.href).then(function () { toast("链接已复制 ✓"); }); } },
      { t: "回到顶部", d: "scroll to top", ic: "↑", run: function () { scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); } }
    ];

    var overlay = document.createElement("div");
    overlay.className = "cmdk-overlay";
    overlay.innerHTML =
      '<div class="cmdk-panel" role="dialog" aria-modal="true" aria-label="命令面板">' +
        '<div class="cmdk-input-wrap"><span class="cmdk-caret">›</span>' +
          '<input class="cmdk-input" type="text" placeholder="搜索页面或输入命令…" autocomplete="off" spellcheck="false">' +
          '<kbd class="cmdk-esc">ESC</kbd></div>' +
        '<ul class="cmdk-list"></ul>' +
        '<div class="cmdk-foot">↑ ↓ 选择　↵ 执行　<b>Ctrl / ⌘ + K</b> 打开</div>' +
      '</div>';
    document.body.appendChild(overlay);
    var input = overlay.querySelector(".cmdk-input");
    var list = overlay.querySelector(".cmdk-list");
    var active = 0, shown = [];

    function paintActive() {
      var items = list.querySelectorAll(".cmdk-item");
      items.forEach(function (el, i) { el.classList.toggle("on", i === active); });
      if (items[active]) items[active].scrollIntoView({ block: "nearest" });
    }
    function render(q) {
      q = (q || "").trim().toLowerCase();
      shown = CMDS.filter(function (c) {
        return !q || (c.t + " " + c.d).toLowerCase().indexOf(q) >= 0;
      });
      list.innerHTML = "";
      if (!shown.length) {
        var em = document.createElement("li");
        em.className = "cmdk-empty";
        em.textContent = "没有匹配的命令";
        list.appendChild(em);
        return;
      }
      shown.forEach(function (c, i) {
        var li = document.createElement("li");
        li.className = "cmdk-item" + (i === active ? " on" : "");
        li.innerHTML = '<span class="ci-ic"></span><span class="ci-main"><b></b><small></small></span><span class="ci-enter">↵</span>';
        li.querySelector(".ci-ic").textContent = c.ic;
        li.querySelector("b").textContent = c.t;
        li.querySelector("small").textContent = c.d;
        li.addEventListener("mouseenter", function () { active = i; paintActive(); });
        li.addEventListener("click", function () { exec(i); });
        list.appendChild(li);
      });
      active = Math.min(active, shown.length - 1);
      paintActive();
    }
    function exec(i) {
      var c = shown[i];
      if (!c) return;
      close();
      setTimeout(c.run, 80); // 让关闭动画先走，动作类命令体验更顺
    }
    function open() { overlay.classList.add("open"); input.value = ""; active = 0; render(""); setTimeout(function () { input.focus(); }, 30); }
    function close() { overlay.classList.remove("open"); input.blur(); }
    function toggle() { overlay.classList.contains("open") ? close() : open(); }

    input.addEventListener("input", function () { active = 0; render(input.value); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); paintActive(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); paintActive(); }
      else if (e.key === "Enter") { e.preventDefault(); exec(active); }
      else if (e.key === "Escape") { close(); }
    });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); toggle(); }
      else if (e.key === "Escape" && overlay.classList.contains("open")) { close(); }
    });

    // 导航右侧统一加入口按钮（各页面一致，无需改 HTML）
    var navInner = $(".nav-inner");
    if (navInner) {
      var trig = document.createElement("button");
      trig.className = "cmdk-trigger";
      trig.type = "button";
      trig.setAttribute("aria-label", "打开命令面板 (Ctrl+K)");
      trig.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span>⌘K</span>';
      trig.addEventListener("click", toggle);
      navInner.insertBefore(trig, $("#themeToggle"));
    }
  })();

  /* ---------- 27. 代码块语法高亮（轻量正则，亮暗自适应） ---------- */
  (function highlight() {
    var codes = $$(".post-body pre code");
    if (!codes.length) return;
    var KW = "void|int|char|short|long|float|double|unsigned|signed|const|static|volatile|struct|enum|union|typedef|sizeof|return|if|else|for|while|do|switch|case|default|break|continue|goto|extern|register|inline|restrict|_Bool|bool|true|false|NULL|class|public|private|protected|new|delete|this|import|from|def|lambda|pass|with|as|try|except|finally|raise|yield|global|nonlocal|None|True|False|and|or|not|in|is";
    // 顺序：预处理 > 注释 > 字符串 > 数字 > 关键字 > 全大写宏 > 函数名
    var RE = new RegExp(
      "(^[ \\t]*#[a-z]+)" +
      "|(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)" +
      "|(\"(?:\\\\.|[^\"\\\\])*\"|'(?:\\\\.|[^'\\\\])*')" +
      "|(\\b0x[0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?\\b)" +
      "|(\\b(?:" + KW + ")\\b)" +
      "|(\\b[A-Z][A-Z0-9_]{2,}\\b)" +
      "|(\\b[A-Za-z_]\\w*(?=\\s*\\())",
      "gm"
    );
    function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    codes.forEach(function (code) {
      var src = code.textContent;
      var out = "", last = 0, m;
      RE.lastIndex = 0;
      while ((m = RE.exec(src)) !== null) {
        out += esc(src.slice(last, m.index));
        var cls = m[1] ? "meta" : m[2] ? "com" : m[3] ? "str" : m[4] ? "num" : m[5] ? "kw" : m[6] ? "macro" : "fn";
        out += '<span class="tk-' + cls + '">' + esc(m[0]) + '</span>';
        last = m.index + m[0].length;
      }
      out += esc(src.slice(last));
      code.innerHTML = out;
    });
  })();

  /* ---------- 28. 点击涟漪（按钮 / 标签 / 返回顶部） ---------- */
  (function ripple() {
    if (reduceMotion || !document.addEventListener) return;
    document.addEventListener("click", function (e) {
      var t = e.target;
      var el = t && t.closest ? t.closest(".btn, .tag-chip, .to-top, .cmdk-trigger, .copy-link-btn") : null;
      if (!el) return;
      var r = document.createElement("span");
      r.className = "ripple";
      var rect = el.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      r.style.width = r.style.height = size + "px";
      r.style.left = (e.clientX - rect.left - size / 2) + "px";
      r.style.top = (e.clientY - rect.top - size / 2) + "px";
      el.appendChild(r);
      setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 620);
    });
  })();

  /* ---------- 29. 全站顶部进度条 + 环形返回顶部 ---------- */
  (function scrollEnhance() {
    var hasReadBar = !!$("#readProgress"); // 文章页已有阅读进度条，避免重复
    var bar = null;
    if (!hasReadBar) {
      bar = document.createElement("div");
      bar.className = "scroll-progress-top";
      bar.setAttribute("aria-hidden", "true");
      document.body.appendChild(bar);
    }
    var toTop = $("#toTop");
    var fg = null, C = 0;
    if (toTop) {
      toTop.classList.add("ring");
      toTop.innerHTML = '<svg class="ring-svg" viewBox="0 0 44 44" aria-hidden="true">' +
        '<circle class="ring-bg" cx="22" cy="22" r="19"></circle>' +
        '<circle class="ring-fg" cx="22" cy="22" r="19"></circle></svg>' +
        '<span class="ring-arrow">↑</span>';
      fg = toTop.querySelector(".ring-fg");
      C = 2 * Math.PI * 19;
      fg.style.strokeDasharray = C;
      fg.style.strokeDashoffset = C;
    }
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? Math.min(1, scrollY / max) : 0;
      if (bar) bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      if (fg) fg.style.strokeDashoffset = (C * (1 - p)).toFixed(2);
      ticking = false;
    }
    if (bar || fg) {
      addEventListener("scroll", function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      update();
    }
  })();

  /* ---------- 30. 文章字数统计 + 复制本文链接 ---------- */
  (function postExtras() {
    var meta = $(".post-header .p-meta");
    var body = $(".post-body");
    if (meta && body) {
      var text = body.textContent || "";
      var cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      if (meta.textContent.indexOf("字") < 0) {
        meta.textContent = meta.textContent.replace(/\s*$/, "") + " · 约 " + cn + " 字";
      }
    }
    var nav = $(".post-nav");
    if (nav && navigator.clipboard) {
      var btn = document.createElement("button");
      btn.className = "copy-link-btn";
      btn.type = "button";
      btn.textContent = "⧉ 复制本文链接";
      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(location.href).then(function () { toast("链接已复制 ✓"); });
      });
      if (nav.parentNode) nav.parentNode.insertBefore(btn, nav.nextSibling);
    }
  })();

  /* ---------- 31. PWA：注册 Service Worker + 安装入口 ---------- */
  (function pwa() {
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("/sw.js").catch(function () { /* 静默失败，不影响站点 */ });
    }
    var deferred = null, btn = null;
    addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferred = e;
      if (!btn) {
        btn = document.createElement("button");
        btn.className = "pwa-install";
        btn.type = "button";
        btn.innerHTML = "⬇ 安装到桌面";
        btn.addEventListener("click", function () {
          if (!deferred) return;
          deferred.prompt();
          deferred.userChoice.then(function () { deferred = null; btn.classList.remove("show"); });
        });
        document.body.appendChild(btn);
      }
      btn.classList.add("show");
    });
    addEventListener("appinstalled", function () {
      if (btn) btn.classList.remove("show");
      toast("安装成功 ✓");
    });
  })();
})();
