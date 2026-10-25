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
})();
