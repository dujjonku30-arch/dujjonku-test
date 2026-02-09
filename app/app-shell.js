(function () {
  function setupAds() {
    if (typeof CONFIG !== "object" || !CONFIG) return;
    if (!CONFIG.enableAds) return;
    if (CONFIG.adsProvider !== "adsense") return;

    const clientId = String(CONFIG.adsenseClientId || "").trim();
    if (!clientId || !clientId.startsWith("ca-pub-")) return;
    if (document.querySelector("script[data-adsense-auto='1']")) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-adsense-auto", "1");
    document.head.appendChild(script);
  }

  function bootstrapShell() {
    const page = document.querySelector("main.page, main.result-page, main.full");
    if (page) page.classList.add("app-page");
    setupAds();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapShell);
  } else {
    bootstrapShell();
  }
})();
