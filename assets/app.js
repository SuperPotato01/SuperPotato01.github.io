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

    var btn = $("#themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
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

  /* ---------- 13. 页脚时钟 ---------- */
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
