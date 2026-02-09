function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove("open");
  if (!document.querySelector(".modal.open")) {
    document.body.classList.remove("modal-open");
  }
}

let quickAdIntervalId = null;

function ensureLegalModals() {
  if (!document.getElementById("privacy-modal")) {
    const privacy = document.createElement("div");
    privacy.id = "privacy-modal";
    privacy.className = "modal";
    privacy.innerHTML = `
      <div class="modal-card legal">
        <button class="modal-close" type="button" data-modal-close="privacy-modal">×</button>
        <h1>개인정보처리방침</h1>
        <p>두쫀쿠 테스트는 성향 테스트 제공을 위해 필요한 최소 정보만 처리합니다.</p>
        <h2>1. 수집 정보</h2>
        <ul class="list">
          <li>객관식/주관식 답변 데이터</li>
          <li>접속 로그(브라우저, 기기, 언어, 방문 시각)</li>
          <li>광고·성과 측정을 위한 쿠키/유사 식별자</li>
        </ul>
        <h2>2. 이용 목적</h2>
        <ul class="list">
          <li>결과 산출 및 품질 개선</li>
          <li>오류 진단, 서비스 안정성 관리</li>
          <li>광고 노출 및 성과 분석</li>
        </ul>
        <h2>3. 보관/파기</h2>
        <p>목적 달성 후 즉시 파기하며, 법령상 보관 의무가 있는 항목만 별도 보관합니다.</p>
        <h2>4. 제3자 처리</h2>
        <p>광고/분석/AI API 제공사에 처리 위탁될 수 있으며, 필요한 범위 내에서만 처리됩니다.</p>
        <h2>5. 이용자 권리</h2>
        <p>문의 메일을 통해 열람·정정·삭제를 요청할 수 있습니다. 문의: dujjonku30@gmail.com</p>
      </div>
    `;
    document.body.appendChild(privacy);
  }

  if (!document.getElementById("terms-modal")) {
    const terms = document.createElement("div");
    terms.id = "terms-modal";
    terms.className = "modal";
    terms.innerHTML = `
      <div class="modal-card legal">
        <button class="modal-close" type="button" data-modal-close="terms-modal">×</button>
        <h1>이용약관</h1>
        <p>본 서비스는 엔터테인먼트 목적의 성향 테스트입니다.</p>
        <h2>1. 서비스 범위</h2>
        <ul class="list">
          <li>테스트 문항, 결과 화면, 진열대 기능 제공</li>
          <li>공유/이미지 저장 및 광고 노출 기능 제공</li>
        </ul>
        <h2>2. 이용자 준수사항</h2>
        <ul class="list">
          <li>서비스 운영 방해, 어뷰징, 자동화 부정 이용 금지</li>
          <li>타인 권리 침해 및 불법 행위 금지</li>
        </ul>
        <h2>3. 책임 제한</h2>
        <p>결과는 참고용 콘텐츠이며, 법률·의료·상담 등 전문 판단을 대체하지 않습니다.</p>
        <h2>4. 정책 변경</h2>
        <p>서비스 개선을 위해 기능·정책은 사전/사후 공지 후 변경될 수 있습니다.</p>
        <h2>5. 문의</h2>
        <p>문의: dujjonku30@gmail.com</p>
      </div>
    `;
    document.body.appendChild(terms);
  }
}

function ensureQuickAdModal() {
  let modal = document.getElementById("quick-ad-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "quick-ad-modal";
  modal.className = "modal quick-ad-modal";
  modal.innerHTML = `
    <div class="modal-card quick-ad-card">
      <div class="quick-ad-head">
        <p class="quick-ad-copy">광고봐주세요.</p>
        <button id="quick-ad-x" class="quick-ad-x" type="button" aria-label="닫기">×</button>
      </div>
      <div class="quick-ad-frame">
        <div id="quick-ad-slot" class="quick-ad-slot"></div>
      </div>
      <button id="quick-ad-confirm" class="quick-ad-close-btn" type="button" disabled>닫기 (5S)</button>
    </div>
  `;
  document.body.appendChild(modal);

  const confirmBtn = modal.querySelector("#quick-ad-confirm");
  const closeX = modal.querySelector("#quick-ad-x");
  confirmBtn?.addEventListener("click", () => {
    if (modal.dataset.lock === "true") return;
    closeModal("quick-ad-modal");
  });
  closeX?.addEventListener("click", () => {
    if (modal.dataset.lock === "true") return;
    closeModal("quick-ad-modal");
  });

  return modal;
}

function renderQuickAdSlot(modal) {
  const slotHost = modal?.querySelector("#quick-ad-slot");
  if (!slotHost) return;

  const slotId = String(CONFIG?.adsenseSlots?.quickAdModal || "").trim();
  const canRender = typeof window.DujjonkuAds?.renderSlot === "function" && !!slotId;
  if (canRender) {
    const rendered = window.DujjonkuAds.renderSlot(slotHost, slotId, {
      adFormat: "auto",
      fullWidthResponsive: true
    });
    if (rendered) return;
  }

  slotHost.innerHTML = '<p class="quick-ad-placeholder">광고 준비 중입니다.</p>';
}

function startQuickAdModal() {
  const modal = ensureQuickAdModal();
  const confirmBtn = modal.querySelector("#quick-ad-confirm");
  const closeX = modal.querySelector("#quick-ad-x");
  if (!confirmBtn || !closeX) return;
  renderQuickAdSlot(modal);

  if (quickAdIntervalId) {
    clearInterval(quickAdIntervalId);
    quickAdIntervalId = null;
  }

  let remaining = 5;
  modal.dataset.lock = "true";
  confirmBtn.disabled = true;
  closeX.disabled = true;
  confirmBtn.classList.remove("is-ready");
  confirmBtn.textContent = `닫기 (${remaining}S)`;
  openModal("quick-ad-modal");

  quickAdIntervalId = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      confirmBtn.textContent = `닫기 (${remaining}S)`;
      return;
    }

    clearInterval(quickAdIntervalId);
    quickAdIntervalId = null;
    modal.dataset.lock = "false";
    confirmBtn.disabled = false;
    closeX.disabled = false;
    confirmBtn.classList.add("is-ready");
    confirmBtn.textContent = "닫기";
  }, 1000);
}

function setupHeader() {
  ensureQuickAdModal();

  const menuBtns = document.querySelectorAll("#menu-btn, .menu-trigger");
  const brandEls = document.querySelectorAll(".brand");

  menuBtns.forEach((menuBtn) => {
    menuBtn.addEventListener("click", () => {
      const modal = document.getElementById("menu-modal");
      if (!modal) return;
      const isOpen = modal.classList.contains("open");
      if (isOpen) {
        closeModal("menu-modal");
      } else {
        openModal("menu-modal");
      }
    });
  });
  brandEls.forEach((el) => {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  });
  document.querySelectorAll(".flag").forEach((flagEl) => {
    flagEl.addEventListener("click", () => openModal("lang-modal"));
  });

  document.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-modal-close");
      const modal = id ? document.getElementById(id) : null;
      if (modal?.dataset.lock === "true") return;
      closeModal(id);
    });
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (modal.dataset.lock === "true") return;
      if (event.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  document.querySelectorAll("[data-open-coin]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal("menu-modal");
      startQuickAdModal();
    });
  });

  document.querySelectorAll("[data-open-privacy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal("menu-modal");
      window.location.href = "privacy.html";
    });
  });

  document.querySelectorAll("[data-open-terms]").forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal("menu-modal");
      window.location.href = "terms.html";
    });
  });

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => setLanguage(btn.getAttribute("data-lang")));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const opened = document.querySelector(".modal.open");
    if (opened?.dataset.lock === "true") return;
    if (opened) closeModal(opened.id);
  });
}

function applyCommonUI() {
  setupHeader();
}

document.addEventListener("DOMContentLoaded", applyCommonUI);
