/* ==========================================================================
   岩屿石英砖 ROCKISLE — Interactions
   ========================================================================== */
(function () {
  "use strict";

  /* ---- Image URL helper (architectural photography, SDXL prompts) ---- */
  window.ROCK = window.ROCK || {};
  ROCK.img = function (prompt, size) {
    var sizeMap = {
      hero: "landscape_16_9",
      banner: "landscape_16_9",
      wide: "landscape_4_3",
      square: "square",
      portrait: "portrait_4_3",
      tall: "portrait_16_9"
    };
    var s = sizeMap[size] || size || "landscape_16_9";
    return (
      "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=" +
      encodeURIComponent(prompt) +
      "&image_size=" + s
    );
  };

  /* Apply data-bg / data-img attributes via the image API (or local file if provided) */
  function applyImages() {
    document.querySelectorAll("[data-bg]").forEach(function (el) {
      var local = el.getAttribute("data-bg-local");
      if (local) {
        el.style.backgroundImage = "url('" + local + "')";
        return;
      }
      var p = el.getAttribute("data-bg");
      var sz = el.getAttribute("data-bg-size") || "landscape_16_9";
      el.style.backgroundImage = "url('" + ROCK.img(p, sz) + "')";
    });
    document.querySelectorAll("[data-img]").forEach(function (el) {
      var local = el.getAttribute("data-img-local");
      if (local) { el.setAttribute("src", local); return; }
      var p = el.getAttribute("data-img");
      var sz = el.getAttribute("data-img-size") || "square";
      el.setAttribute("src", ROCK.img(p, sz));
    });
  }

  /* ---- Navigation state ---- */
  function initNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var transparent = nav.classList.contains("is-transparent");
    var onScroll = function () {
      if (window.scrollY > 40) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var burger = document.querySelector(".nav__burger");
    var menu = document.querySelector(".mobile-menu");
    var closeBtn = document.querySelector(".mobile-menu__close");
    if (burger && menu) {
      var toggle = function (open) {
        menu.classList.toggle("is-open", open);
        document.body.style.overflow = open ? "hidden" : "";
      };
      burger.addEventListener("click", function () {
        toggle(!menu.classList.contains("is-open"));
      });
      if (closeBtn) closeBtn.addEventListener("click", function () { toggle(false); });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { toggle(false); });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menu.classList.contains("is-open")) toggle(false);
      });
    }

    // active link by pathname
    var path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav__link, .mobile-menu__item").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href === path) link.classList.add("is-active");
    });
  }

  /* ---- Hero carousel ---- */
  function initHero() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero__slide"));
    var pags = Array.prototype.slice.call(hero.querySelectorAll(".hero__pag-item"));
    var idxEl = hero.querySelector(".hero__index");
    var current = 0;
    var timer = null;

    function go(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle("is-active", n === current); });
      pags.forEach(function (p, n) { p.classList.toggle("is-active", n === current); });
      if (idxEl) idxEl.textContent = "0" + (current + 1) + " / 0" + slides.length;
    }
    function next() { go(current + 1); }
    function start() { stop(); timer = setInterval(next, 6500); }
    function stop() { if (timer) clearInterval(timer); }

    pags.forEach(function (p, n) {
      p.addEventListener("click", function () { go(n); start(); });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    go(0);
    start();
  }

  /* ---- Scroll reveal ---- */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach(function (e) { e.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---- Series detail: scene switcher + tabs ---- */
  function initSeriesDetail() {
    var gallery = document.querySelector(".scene-gallery");
    var main = document.querySelector(".detail-main-scene");
    if (gallery && main) {
      var items = gallery.querySelectorAll(".scene-gallery__item");
      items.forEach(function (it) {
        it.addEventListener("click", function () {
          items.forEach(function (x) { x.classList.remove("is-active"); });
          it.classList.add("is-active");
          var bg = it.style.backgroundImage;
          if (bg) main.style.backgroundImage = bg;
        });
      });
    }
    var tabs = document.querySelectorAll(".detail-tab");
    var panels = document.querySelectorAll(".detail-panel");
    if (tabs.length) {
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          var target = tab.getAttribute("data-tab");
          tabs.forEach(function (t) { t.classList.remove("is-active"); });
          panels.forEach(function (p) { p.classList.toggle("is-hidden", p.getAttribute("data-panel") !== target); });
          tab.classList.add("is-active");
        });
      });
    }
  }

  /* ---- Series carousel (immersive bg morph + split layout) ---- */
  function initSeriesCarousel() {
    var track = document.getElementById("seriesTrack");
    var dotsWrap = document.getElementById("seriesDots");
    var bgWrap = document.getElementById("seriesBg");
    var prevBtn = document.getElementById("seriesPrev");
    var nextBtn = document.getElementById("seriesNext");
    var infoWrap = document.getElementById("seriesActiveInfo");
    var idxEl = document.getElementById("seriesActiveIndex");
    var nameEl = document.getElementById("seriesActiveName");
    var subEl = document.getElementById("seriesActiveSub");
    var descEl = document.getElementById("seriesActiveDesc");
    var btnEl = document.getElementById("seriesActiveBtn");
    if (!track || !dotsWrap) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll(".series-card"));
    var count = cards.length;
    if (!count) return;

    var bgLayers = bgWrap
      ? Array.prototype.slice.call(bgWrap.querySelectorAll(".series-bg__layer"))
      : [];

    // Build dots
    for (var i = 0; i < count; i++) {
      var d = document.createElement("button");
      d.className = "series-dot";
      d.setAttribute("aria-label", "跳至第 " + (i + 1) + " 个系列");
      d.setAttribute("data-index", i);
      (function (idx) {
        d.addEventListener("click", function () {
          pauseAuto();
          setActive(idx);
          resumeAutoSoon();
        });
      })(i);
      dotsWrap.appendChild(d);
    }
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll(".series-dot"));

    var currentIdx = 0;

    // --------- Update left info text (with brief fade-out / fade-in) ---------
    function updateInfo(idx) {
      var card = cards[idx];
      if (!card) return;
      var name = card.getAttribute("data-name") || "";
      var sub = card.getAttribute("data-sub") || "";
      var desc = card.getAttribute("data-desc") || "";
      var href = card.getAttribute("href") || "#";

      if (!infoWrap) return;
      infoWrap.classList.add("is-swapping");
      setTimeout(function () {
        if (idxEl) idxEl.textContent = String(idx + 1).padStart(2, "0");
        if (nameEl) nameEl.textContent = name;
        if (subEl) subEl.textContent = sub;
        if (descEl) descEl.textContent = desc;
        if (btnEl) btnEl.setAttribute("href", href);
        infoWrap.classList.remove("is-swapping");
      }, 320);
    }

    // --------- Apply active state to cards, dots, bg layers, info ---------
    function setActive(idx) {
      if (idx < 0) idx = 0;
      if (idx > count - 1) idx = count - 1;
      currentIdx = idx;
      cards.forEach(function (c, n) { c.classList.toggle("is-active", n === idx); });
      dots.forEach(function (d, n) { d.classList.toggle("is-active", n === idx); });
      bgLayers.forEach(function (l, n) { l.classList.toggle("is-active", n === idx); });
      updateInfo(idx);
      // bring active card into view in the strip
      var target = cards[idx];
      if (target) {
        var tr = track.getBoundingClientRect();
        var cr = target.getBoundingClientRect();
        var delta = cr.left - tr.left - (tr.width - cr.width) / 2;
        if (Math.abs(delta) > 8) {
          track.scrollBy({ left: delta, behavior: "smooth" });
        }
      }
    }

    function next() { setActive((currentIdx + 1) % count); }
    function prev() { setActive((currentIdx - 1 + count) % count); }

    // --------- Auto-play ---------
    var autoTimer = null;
    var autoDelay = 2200;
    var autoPaused = false;
    var resumeTimer = null;

    function startAuto() {
      stopAuto();
      if (autoPaused) return;
      autoTimer = setInterval(next, autoDelay);
    }
    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }
    function pauseAuto() {
      autoPaused = true;
      stopAuto();
      if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = null; }
    }
    function resumeAutoSoon() {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function () {
        autoPaused = false;
        startAuto();
      }, 1000);
    }

    // Pause on hover / touch
    var section = document.getElementById("seriesCarousel");
    if (section) {
      section.addEventListener("mouseenter", pauseAuto);
      section.addEventListener("mouseleave", resumeAutoSoon);
      section.addEventListener("touchstart", pauseAuto, { passive: true });
      section.addEventListener("touchend", resumeAutoSoon);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { stopAuto(); }
      else if (!autoPaused) { startAuto(); }
    });

    // --------- Arrows ---------
    if (prevBtn) prevBtn.addEventListener("click", function () {
      pauseAuto(); prev(); resumeAutoSoon();
    });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      pauseAuto(); next(); resumeAutoSoon();
    });

    // --------- Card click → morph bg to that series ---------
    cards.forEach(function (card, idx) {
      card.addEventListener("click", function (e) {
        // Always intercept: the bg morph is the primary action.
        e.preventDefault();
        pauseAuto();
        setActive(idx);
        resumeAutoSoon();
      });
    });

    // --------- Keyboard nav ---------
    if (section) {
      section.setAttribute("tabindex", "-1");
      section.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); pauseAuto(); next(); resumeAutoSoon(); }
        if (e.key === "ArrowLeft")  { e.preventDefault(); pauseAuto(); prev(); resumeAutoSoon(); }
      });
    }

    // --------- Init ---------
    requestAnimationFrame(function () {
      setActive(0);
    });
    window.addEventListener("resize", function () {
      // keep active card centered on resize
      var target = cards[currentIdx];
      if (!target) return;
      var tr = track.getBoundingClientRect();
      var cr = target.getBoundingClientRect();
      var delta = cr.left - tr.left - (tr.width - cr.width) / 2;
      track.scrollBy({ left: delta, behavior: "auto" });
    });

    startAuto();
  }

  /* ---- Stone Effect List (filters + view toggle + lazy load + load more) ---- */
  function initStoneList() {
    var grid = document.getElementById("stoneGrid");
    if (!grid) return;
    var section = grid.closest(".stone-list");
    var filterBar = document.getElementById("filterBar");
    var chipsList = document.getElementById("activeChipsList");
    var clearBtn = document.getElementById("clearAll");
    var resultCount = document.getElementById("resultCount");
    var listStatus = document.getElementById("listStatus");
    var loadMoreBtn = document.getElementById("loadMore");
    var emptyState = document.getElementById("stoneEmpty");
    var toggle = section ? section.querySelector(".view-toggle") : null;
    var indicator = toggle ? toggle.querySelector(".view-toggle__indicator") : null;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".stone-card"));
    cards.forEach(function (c, i) {
      c._idx = i;
      // staggered entrance; remove the animation once it ends so the forwards
      // fill state can no longer override the filter transition (opacity)
      c.style.animationDelay = (i * 0.06) + "s";
      c.addEventListener("animationend", function () {
        c.style.animation = "none";
        c.style.animationDelay = "";
      }, { once: true });
    });

    var facets = ["color", "thickness", "finish", "use"];
    var active = { color: [], thickness: [], finish: [], use: [] };
    var colorSwatch = {
      white: "#f3efe8", beige: "#d8c4a0", grey: "#8c887f", black: "#1c1b19",
      brown: "#6b5532", blue: "#5b7e8c", multicolor: "conic-gradient(#f3efe8 0 25%,#d8c4a0 25% 50%,#8c887f 50% 75%,#6b5532 75% 100%)"
    };
    var facetLabel = { color: "颜色", thickness: "厚度", finish: "工艺", use: "应用" };
    var pageSize = 6;
    var visibleCount = pageSize;

    /* ---- Filter matching ---- */
    function cardMatches(card) {
      for (var f = 0; f < facets.length; f++) {
        var facet = facets[f];
        var sel = active[facet];
        if (!sel.length) continue;
        var cardVals = (card.getAttribute("data-" + facet) || "").split(/\s+/);
        var hit = false;
        for (var k = 0; k < sel.length; k++) {
          if (cardVals.indexOf(sel[k]) !== -1) { hit = true; break; }
        }
        if (!hit) return false;
      }
      return true;
    }

    /* ---- Render: filter + paginate ---- */
    function render() {
      var matched = cards.filter(cardMatches);
      var visible = matched.slice(0, visibleCount);
      var visSet = {};
      visible.forEach(function (c) { visSet[c._idx] = true; });

      cards.forEach(function (card) {
        var show = !!visSet[card._idx];
        var wasShown = card._shown; // was it visible in the previous render?
        if (show) {
          // cancel any pending collapse so a quick re-toggle keeps the card alive
          if (card._hideTimer) { clearTimeout(card._hideTimer); card._hideTimer = null; }
          card._shown = true;
          var wasHidden = card.classList.contains("is-hidden");
          card.classList.remove("is-hidden");
          if (wasHidden) {
            // if the entrance animation is still pending (card was hidden on
            // initial load / load-more), drop the original stagger delay so it
            // plays promptly instead of waiting up to ~0.5s
            if (card.style.animation !== "none" && card.style.animationDelay) {
              card.style.animationDelay = "0s";
            }
            // double rAF so the browser paints opacity:0 before fading in
            requestAnimationFrame(function () {
              requestAnimationFrame(function () { card.classList.remove("is-filtered-out"); });
            });
          } else {
            card.classList.remove("is-filtered-out");
          }
        } else {
          card._shown = false;
          card.classList.add("is-filtered-out");
          if (wasShown && !card._hideTimer) {
            // was visible → fade out, then collapse layout after the transition
            card._hideTimer = setTimeout(function () {
              card._hideTimer = null;
              if (card.classList.contains("is-filtered-out")) {
                card.classList.add("is-hidden");
              }
            }, 500);
          } else {
            // never shown (initial load) or already collapsed → hide now
            card.classList.add("is-hidden");
          }
        }
      });

      // counts + chrome
      if (resultCount) resultCount.textContent = matched.length;
      if (listStatus) listStatus.textContent = "显示 " + visible.length + " / " + matched.length + " 款系列";
      if (emptyState) emptyState.classList.toggle("is-hidden", matched.length > 0);

      // load more button
      if (loadMoreBtn) {
        var more = matched.length - visible.length;
        if (more > 0) {
          loadMoreBtn.classList.remove("is-hidden");
          loadMoreBtn.textContent = "加载更多 ↓ （" + more + "）";
        } else {
          loadMoreBtn.classList.add("is-hidden");
        }
      }

      renderChips();
      lazyScan();
    }

    /* ---- Active chips ---- */
    function renderChips() {
      if (!chipsList) return;
      chipsList.innerHTML = "";
      var total = 0;
      facets.forEach(function (facet) {
        active[facet].forEach(function (val) {
          total++;
          var chip = document.createElement("span");
          chip.className = "active-chip";
          var sw = colorSwatch[val];
          if (sw) {
            var dot = document.createElement("i");
            if (sw.indexOf("conic") === 0) dot.style.background = sw;
            else { dot.style.background = sw; }
            chip.appendChild(dot);
          }
          var label = document.createElement("span");
          label.textContent = facetLabel[facet] + " · " + chipLabel(facet, val);
          chip.appendChild(label);
          var rm = document.createElement("button");
          rm.setAttribute("aria-label", "移除 " + facetLabel[facet] + " " + val);
          rm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>';
          (function (f, v) {
            rm.addEventListener("click", function () { toggleFacet(f, v); });
          })(facet, val);
          chip.appendChild(rm);
          chipsList.appendChild(chip);
        });
      });
      if (clearBtn) clearBtn.classList.toggle("is-shown", total > 0);
    }

    function chipLabel(facet, val) {
      var el = filterBar.querySelector('[data-facet="' + facet + '"][data-val="' + val + '"]');
      if (!el) return val;
      if (facet === "color") return el.textContent.trim();
      // pills have "中文 English" — show full
      return el.textContent.trim();
    }

    /* ---- Toggle a facet value ---- */
    function toggleFacet(facet, val) {
      var arr = active[facet];
      var i = arr.indexOf(val);
      if (i === -1) arr.push(val);
      else arr.splice(i, 1);
      var btn = filterBar.querySelector('[data-facet="' + facet + '"][data-val="' + val + '"]');
      if (btn) btn.classList.toggle("is-active", arr.indexOf(val) !== -1);
      visibleCount = pageSize;
      render();
    }

    /* ---- Filter bar click delegation ---- */
    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-facet]");
      if (!btn) return;
      toggleFacet(btn.getAttribute("data-facet"), btn.getAttribute("data-val"));
    });

    /* ---- Clear all ---- */
    if (clearBtn) clearBtn.addEventListener("click", function () {
      facets.forEach(function (f) { active[f] = []; });
      filterBar.querySelectorAll(".is-active").forEach(function (b) { b.classList.remove("is-active"); });
      visibleCount = pageSize;
      render();
    });

    /* ---- Load more ---- */
    if (loadMoreBtn) loadMoreBtn.addEventListener("click", function () {
      visibleCount += pageSize;
      render();
    });

    /* ---- View mode toggle ---- */
    function moveIndicator() {
      if (!toggle || !indicator) return;
      var act = toggle.querySelector(".view-toggle__btn.is-active");
      if (!act) return;
      indicator.style.width = act.offsetWidth + "px";
      indicator.style.transform = "translateX(" + (act.offsetLeft - 4) + "px)";
    }
    if (toggle) {
      toggle.querySelectorAll(".view-toggle__btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var view = btn.getAttribute("data-view");
          toggle.querySelectorAll(".view-toggle__btn").forEach(function (b) {
            b.classList.toggle("is-active", b === btn);
            b.setAttribute("aria-selected", b === btn ? "true" : "false");
          });
          grid.classList.toggle("is-view-ambient", view === "ambient");
          grid.classList.toggle("is-view-texture", view === "texture");
          moveIndicator();
        });
      });
      requestAnimationFrame(moveIndicator);
      window.addEventListener("resize", moveIndicator);
      // re-measure once web fonts arrive — button widths shift after font swap
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          moveIndicator();
          // also catch late layout reflow one frame after font paint
          requestAnimationFrame(moveIndicator);
        });
      }
    }

    /* ---- Lazy load images via IntersectionObserver ---- */
    var io = ("IntersectionObserver" in window)
      ? new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var card = en.target;
            card.querySelectorAll(".stone-card__img[data-lazy-local]").forEach(function (img) {
              if (img.dataset.loaded) return;
              img.dataset.loaded = "1";
              var src = img.getAttribute("data-lazy-local");
              var pre = new Image();
              pre.onload = function () {
                img.style.backgroundImage = "url('" + src + "')";
                img.classList.add("is-loaded");
              };
              pre.onerror = function () { img.dataset.loaded = ""; };
              pre.src = src;
            });
            io.unobserve(card);
          });
        }, { rootMargin: "300px 0px" })
      : null;

    function lazyScan() {
      cards.forEach(function (card) {
        if (card.classList.contains("is-hidden")) return;
        if (io) io.observe(card);
        else {
          // fallback: load immediately
          card.querySelectorAll(".stone-card__img[data-lazy-local]").forEach(function (img) {
            if (img.dataset.loaded) return;
            img.dataset.loaded = "1";
            var src = img.getAttribute("data-lazy-local");
            img.style.backgroundImage = "url('" + src + "')";
            img.classList.add("is-loaded");
          });
        }
      });
    }

    // initial render
    render();
  }

  /* ---- Floating back-to-filter indicator ---- */
  function initBackToFilter() {
    var btn = document.getElementById("backToFilter");
    var target = document.getElementById("filterBar");
    if (!btn || !target) return;
    var ticking = false;
    function update() {
      // show once the filter bar has scrolled above the viewport
      btn.classList.toggle("is-shown", target.getBoundingClientRect().bottom < 80);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top < 0 ? 0 : top, behavior: "smooth" });
    });
  }

  /* ---- Search overlay ---- */
  var SITE_PAGES = [
    { url: "index.html",            title: "首页",         sub: "岩屿石英砖 ROCKISLE · 与大地共生息",             keywords: "首页 home 岩屿 ROCKISLE 石英砖 官网 主页" },
    { url: "series.html",           title: "九大系列",     sub: "Nine Collections",                               keywords: "系列 series 九大 collections 产品" },
    { url: "limes.html",            title: "莱姆石",       sub: "Limestone Series",                               keywords: "莱姆石 limestone 地中海 温润 米白 浅米黄 浅灰 中灰" },
    { url: "slate.html",            title: "板岩",         sub: "Slate Series",                                   keywords: "板岩 slate 解理 力量 米黄 浅灰 中灰 深灰" },
    { url: "travertine.html",       title: "洞石",         sub: "Travertine Series",                              keywords: "洞石 travertine 孔洞 罗马 白 黄 灰" },
    { url: "granite.html",          title: "花岗岩",       sub: "Granite Series",                                 keywords: "花岗岩 granite 星河 结晶 浅灰 深灰" },
    { url: "terrazzo.html",         title: "水磨石",       sub: "Terrazzo Series",                                keywords: "水磨石 terrazzo 晶石 研磨 米白 米杏 浅黄" },
    { url: "marble.html",           title: "大理石",       sub: "Marble Series",                                  keywords: "大理石 marble 理石 鱼肚灰 象牙白 石纹 天然 白色 灰色" },
    { url: "woodgrain.html",        title: "木纹",         sub: "Wood Grain Series",                              keywords: "木纹 wood grain 黄棕 石木 棕 橡木 胡桃" },
    { url: "waterscape.html",       title: "水景",         sub: "Water Landscape Series",                         keywords: "水景 waterscape 池水 倒映 白 浅灰 黑" },
    { url: "accessory.html",        title: "配套辅材",     sub: "Accessory Products",                             keywords: "配套 accessory 收边 转角 芝麻 芝麻白 芝麻灰 芝麻黑 楼梯 踢脚线" },
    { url: "projects.html",         title: "项目案例",     sub: "Projects · 项目故事",                            keywords: "项目 projects 案例 设计 工程 应用" },
    { url: "about.html",            title: "关于岩屿",     sub: "About · 关于岩屿",                                keywords: "关于 about 岩屿 大地 造物 品牌 故事" },
    { url: "contact.html",          title: "联系我们",     sub: "Contact · 联系岩屿",                              keywords: "联系 contact 索样 展厅 电话 邮箱 预约" }
  ];

  function initSearch() {
    var triggers = document.querySelectorAll(".nav__search");
    if (!triggers.length) return;

    var overlay = null;
    var input = null;
    var resultsEl = null;
    var closeBtn = null;
    var currentFocus = -1;
    var currentResults = [];

    function buildOverlay() {
      var o = document.createElement("div");
      o.className = "search-overlay";
      o.setAttribute("role", "dialog");
      o.setAttribute("aria-modal", "true");
      o.setAttribute("aria-label", "站内搜索");
      o.innerHTML =
        '<div class="search-overlay__bar">' +
          '<svg class="search-overlay__icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
          '<input type="text" class="search-overlay__input" placeholder="搜索系列、项目、页面…" autofocus />' +
          '<button class="search-overlay__close" aria-label="关闭搜索">×</button>' +
        '</div>' +
        '<div class="search-overlay__body">' +
          '<p class="search-overlay__hint">全部页面 · 按 Enter 跳转 · Esc 关闭</p>' +
          '<ul class="search-overlay__results"></ul>' +
        '</div>';
      document.body.appendChild(o);
      overlay = o;
      input = o.querySelector(".search-overlay__input");
      resultsEl = o.querySelector(".search-overlay__results");
      closeBtn = o.querySelector(".search-overlay__close");

      closeBtn.addEventListener("click", close);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close();
      });
      input.addEventListener("input", onInput);
      input.addEventListener("keydown", onKeydown);
    }

    function open() {
      if (!overlay) buildOverlay();
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
      setTimeout(function () { input.focus(); }, 50);
      renderResults(SITE_PAGES);
    }

    function close() {
      if (!overlay) return;
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
      if (input) input.value = "";
      currentFocus = -1;
      currentResults = [];
    }

    function onInput() {
      var q = input.value.trim().toLowerCase();
      if (!q) { renderResults(SITE_PAGES); return; }
      var matched = SITE_PAGES.filter(function (p) {
        return (
          p.title.toLowerCase().indexOf(q) !== -1 ||
          p.sub.toLowerCase().indexOf(q) !== -1 ||
          p.keywords.toLowerCase().indexOf(q) !== -1
        );
      });
      renderResults(matched);
    }

    function renderResults(list) {
      currentResults = list;
      currentFocus = -1;
      resultsEl.innerHTML = "";
      if (!list.length) {
        resultsEl.innerHTML =
          '<li class="search-overlay__empty">未找到相关页面，尝试其他关键词。</li>';
        return;
      }
      list.forEach(function (page, idx) {
        var li = document.createElement("li");
        li.className = "search-overlay__item";
        li.setAttribute("data-index", idx);
        li.innerHTML =
          '<span class="search-overlay__item-icon">' + page.title.charAt(0) + '</span>' +
          '<span class="search-overlay__item-text">' +
            '<span class="search-overlay__item-title">' + page.title + '</span>' +
            '<span class="search-overlay__item-sub">' + page.sub + '</span>' +
          '</span>';
        li.addEventListener("click", function () {
          window.location.href = page.url;
        });
        resultsEl.appendChild(li);
      });
    }

    function onKeydown(e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveFocus(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveFocus(-1);
      } else if (e.key === "Enter" && currentFocus >= 0) {
        e.preventDefault();
        if (currentResults[currentFocus]) {
          window.location.href = currentResults[currentFocus].url;
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }

    function moveFocus(dir) {
      var items = resultsEl.querySelectorAll(".search-overlay__item");
      if (!items.length) return;
      currentFocus = (currentFocus + dir + items.length) % items.length;
      items.forEach(function (el, i) {
        el.classList.toggle("is-focused", i === currentFocus);
      });
      if (items[currentFocus]) {
        items[currentFocus].scrollIntoView({ block: "nearest" });
      }
    }

    // Bind to all search triggers
    triggers.forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        open();
      });
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });

    // Global shortcut
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (overlay && overlay.classList.contains("is-open")) close();
        else open();
      }
    });
  }

  /* ---- Contact form (front-end only with feedback) ---- */
  function initForm() {
    var form = document.querySelector(".form");
    if (!form) return;
    var submitBtn = form.querySelector(".form__submit");
    var originalText = submitBtn.textContent;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Validate fields
      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var need = form.querySelector("#need");
      var valid = true;
      var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      [name, email].forEach(function (field) {
        if (!field.value.trim()) {
          valid = false;
          field.style.borderColor = "#c44";
        } else {
          field.style.borderColor = "";
        }
      });

      if (email.value && !emailRe.test(email.value.trim())) {
        valid = false;
        email.style.borderColor = "#c44";
      }

      if (!valid) return;

      // Success state
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
      submitBtn.textContent = "发送中…";

      setTimeout(function () {
        submitBtn.textContent = "✓ 已收到，我们将尽快联系您";
        submitBtn.style.color = "#228b22";
        form.reset();

        setTimeout(function () {
          submitBtn.textContent = originalText;
          submitBtn.style.color = "";
          submitBtn.disabled = false;
          submitBtn.style.opacity = "";
        }, 5000);
      }, 600);
    });

    // Clear error on input
    form.querySelectorAll(".form__input, .form__select, .form__textarea").forEach(function (el) {
      el.addEventListener("input", function () {
        el.style.borderColor = "";
      });
    });
  }

  /* ---- Nav submenu keyboard accessibility ---- */
  function initSubmenu() {
    var items = document.querySelectorAll(".nav__item.has-submenu > .nav__link");
    items.forEach(function (link) {
      link.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          var parent = link.parentElement;
          var wasOpen = parent.classList.contains("is-open");
          // Close all open submenus
          document.querySelectorAll(".nav__item.has-submenu.is-open").forEach(function (p) {
            p.classList.remove("is-open");
          });
          if (!wasOpen) parent.classList.add("is-open");
        }
      });
      link.addEventListener("blur", function () {
        setTimeout(function () {
          var parent = link.parentElement;
          if (!parent.matches(":hover")) parent.classList.remove("is-open");
        }, 150);
      });
    });

    // Mobile submenu toggle
    var mobileSubLinks = document.querySelectorAll(".mobile-menu__sublink");
    var mobileSubTriggers = document.querySelectorAll(".mobile-menu__item");
    mobileSubTriggers.forEach(function (item) {
      var sub = item.nextElementSibling;
      if (sub && sub.classList.contains("mobile-menu__sub")) {
        item.addEventListener("click", function (e) {
          e.preventDefault();
          sub.classList.toggle("is-open");
          var arrow = item.querySelector(".mobile-menu__arrow");
          if (arrow) arrow.style.transform = sub.classList.contains("is-open") ? "rotate(180deg)" : "";
        });
      }
    });
  }

  /* ---- Footer year ---- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function boot() {
    applyImages();
    initNav();
    initHero();
    initReveal();
    initSeriesDetail();
    initSeriesCarousel();
    initStoneList();
    initBackToFilter();
    initSearch();
    initSubmenu();
    initForm();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
