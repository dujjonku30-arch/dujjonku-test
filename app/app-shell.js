(function () {
  function isAdsenseEnabled() {
    if (typeof CONFIG !== "object" || !CONFIG) return false;
    if (!CONFIG.enableAds) return false;
    if (CONFIG.adsProvider !== "adsense") return false;
    const clientId = String(CONFIG.adsenseClientId || "").trim();
    return !!clientId && clientId.startsWith("ca-pub-");
  }

  function getAdsenseClientId() {
    return String(CONFIG?.adsenseClientId || "").trim();
  }

  function setupAds() {
    if (!isAdsenseEnabled()) return;
    const clientId = getAdsenseClientId();
    if (document.querySelector("script[src*='pagead2.googlesyndication.com/pagead/js/adsbygoogle.js']")) return;
    if (document.querySelector("script[data-adsense-auto='1']")) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-adsense-auto", "1");
    document.head.appendChild(script);
  }

  function renderAdSlot(container, slotId, options) {
    if (!(container instanceof HTMLElement)) return false;
    if (!isAdsenseEnabled()) return false;

    const safeSlotId = String(slotId || "").trim();
    if (!safeSlotId) return false;

    const alreadyRendered = container.dataset.adRendered === "1" && container.dataset.adSlotId === safeSlotId;
    if (alreadyRendered && container.querySelector("ins.adsbygoogle")) return true;

    const clientId = getAdsenseClientId();
    const opts = options && typeof options === "object" ? options : {};
    const adFormat = String(opts.adFormat || "auto");
    const fullWidthResponsive = opts.fullWidthResponsive === false ? "false" : "true";

    container.innerHTML = "";

    const ad = document.createElement("ins");
    ad.className = "adsbygoogle";
    ad.style.display = "block";
    ad.setAttribute("data-ad-client", clientId);
    ad.setAttribute("data-ad-slot", safeSlotId);
    ad.setAttribute("data-ad-format", adFormat);
    ad.setAttribute("data-full-width-responsive", fullWidthResponsive);
    container.appendChild(ad);

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      container.dataset.adRendered = "1";
      container.dataset.adSlotId = safeSlotId;
      return true;
    } catch (_error) {
      container.innerHTML = "";
      return false;
    }
  }

  function bootstrapShell() {
    const page = document.querySelector("main.page, main.result-page, main.full");
    if (page) page.classList.add("app-page");
    setupAds();
    window.DujjonkuAds = {
      isReady: isAdsenseEnabled,
      renderSlot: renderAdSlot
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapShell);
  } else {
    bootstrapShell();
  }
})();
