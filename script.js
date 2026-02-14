// =========================
// WhatsApp wiring
// =========================
const WHATSAPP_NUMBER = "27670070229";

function buildWhatsAppLink(text) {
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

function formatZAR(amount) {
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `R${Math.round(amount).toLocaleString("en-ZA")}`;
  }
}

// =========================
// Header offset for smooth scroll
// =========================
function setHeaderOffsetVar(){
  const header = document.querySelector(".site-header");
  if (!header) return;
  const h = Math.ceil(header.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--header-offset", `${h}px`);
}

// =========================
// Scroll progress bar
// =========================
function initProgressBar(){
  const bar = document.getElementById("scrollProgressBar");
  if (!bar) return;

  const update = () => {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const scrollHeight = doc.scrollHeight - window.innerHeight;
    const p = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = `${Math.max(0, Math.min(100, p))}%`;
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}

// =========================
// Scroll-spy (active nav highlight)
// =========================
function initScrollSpy() {
  const links = Array.from(document.querySelectorAll('nav a[data-spy]'));
  const sections = links
    .map(a => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);

  if (!links.length || !sections.length) return;

  const setActive = (id) => {
    links.forEach(a => {
      const target = a.getAttribute("href").slice(1);
      a.classList.toggle("active", target === id);
    });
  };

  setActive(sections[0].id);

  const obs = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible?.target?.id) setActive(visible.target.id);
  }, {
    threshold: [0.25, 0.4, 0.6],
    rootMargin: "-30% 0px -55% 0px"
  });

  sections.forEach(sec => obs.observe(sec));

  links.forEach(a => {
    a.addEventListener("click", () => {
      const id = a.getAttribute("href").slice(1);
      setActive(id);
    });
  });
}

// =========================
// Reveal (slide/fade in) — About logo + slogan
// =========================
function initReveal(){
  const els = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.25 });

  els.forEach(el => obs.observe(el));
}

// =========================
// Quote calculator pricing model
// =========================
const PRICING = {
  basic:    { perPlatform: 3000, label: "Basic" },
  standard: { perPlatform: 5500, label: "Standard" },
  premium:  { perPlatform: 9000, label: "Premium" },
};

function getPlatformsValue() {
  const platformsEl = document.getElementById("calc-platforms");
  const n = Number(platformsEl?.value || 1);
  return Math.max(1, Math.min(10, n));
}

function updateFromLabels() {
  const platforms = getPlatformsValue();

  document.querySelectorAll(".platform-count").forEach(el => {
    el.textContent = String(platforms);
  });

  document.querySelectorAll(".from-total[data-from-tier]").forEach(el => {
    const tier = el.getAttribute("data-from-tier");
    if (!PRICING[tier]) return;
    el.textContent = formatZAR(PRICING[tier].perPlatform * platforms);
  });

  const tierEl = document.getElementById("calc-tier");
  const calcFromLine = document.getElementById("calcFromLine");
  if (tierEl && calcFromLine) {
    const tier = tierEl.value in PRICING ? tierEl.value : "basic";
    calcFromLine.textContent = `From ${formatZAR(PRICING[tier].perPlatform * platforms)} / month`;
  }
}

function initFromLabelSync() {
  const platformsEl = document.getElementById("calc-platforms");
  const tierEl = document.getElementById("calc-tier");

  updateFromLabels();
  platformsEl?.addEventListener("input", updateFromLabels);
  tierEl?.addEventListener("change", updateFromLabels);
}

function initCalculator() {
  const platformsEl = document.getElementById("calc-platforms");
  const tierEl = document.getElementById("calc-tier");
  const adBudgetEl = document.getElementById("calc-adbudget");
  const adsManagedEl = document.getElementById("calc-ads-managed");
  const btn = document.getElementById("calc-btn");
  const out = document.getElementById("quoteResult");

  if (!platformsEl || !tierEl || !adBudgetEl || !adsManagedEl || !btn || !out) return;

  const calculate = () => {
    const platforms = getPlatformsValue();
    const tierKey = tierEl.value in PRICING ? tierEl.value : "basic";
    const adBudget = Math.max(0, Number(adBudgetEl.value || 0));
    const adsManaged = !!adsManagedEl.checked;

    const retainer = PRICING[tierKey].perPlatform * platforms;
    const adMgmtFee = adsManaged ? (adBudget * 0.15) : 0;
    const monthlyTotal = retainer + adMgmtFee + adBudget;

    out.style.display = "block";
    out.innerHTML = `
      <div style="font-weight:700; margin-bottom:.35rem;">Estimated Monthly Total: ${formatZAR(monthlyTotal)}</div>
      <div style="line-height:1.6;">
        <div>Retainer (${PRICING[tierKey].label} × ${platforms} platform${platforms>1?"s":""}): <strong>${formatZAR(retainer)}</strong></div>
        <div>Ad budget (pass-through): <strong>${formatZAR(adBudget)}</strong></div>
        <div>Ad management fee (15%): <strong>${formatZAR(adMgmtFee)}</strong></div>
      </div>
      <div style="margin-top:.6rem; opacity:.85; font-size:.92rem;">
        Note: This is an estimate. Final pricing depends on deliverables and turnaround.
      </div>
    `;
  };

  btn.addEventListener("click", calculate);
}

// =========================
// Packages -> select tier -> jump to calculator + auto calculate
// =========================
function initPackageSelect(){
  const buttons = document.querySelectorAll("[data-select-tier]");
  if (!buttons.length) return;

  const tierEl = document.getElementById("calc-tier");
  const platformsEl = document.getElementById("calc-platforms");
  const btnCalc = document.getElementById("calc-btn");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tier = btn.getAttribute("data-select-tier");
      if (tierEl) tierEl.value = tier;

      if (platformsEl && (!platformsEl.value || Number(platformsEl.value) < 1)) {
        platformsEl.value = "1";
      }

      updateFromLabels();

      const calc = document.getElementById("quote-calculator");
      if (calc) calc.scrollIntoView({ behavior: "smooth", block: "start" });

      setTimeout(() => {
        btnCalc?.click();
      }, 250);
    });
  });
}

// =========================
// Packages -> WhatsApp tier-specific messages
// =========================
function buildTierWhatsAppMessage(tierKey) {
  const platforms = getPlatformsValue();
  const tier = PRICING[tierKey] ? PRICING[tierKey] : PRICING.basic;
  const fromTotal = tier.perPlatform * platforms;

  const deliverables = {
    basic: [
      "8–12 posts",
      "4 videos",
      "Basic lead link system",
      "Monthly summary",
    ],
    standard: [
      "12–16 posts",
      "8–12 videos",
      "1 landing page + tracking",
      "WhatsApp scripts + follow-up",
      "Dashboard",
    ],
    premium: [
      "16–24 posts",
      "12–20 videos",
      "2 landing pages",
      "Ads management option",
      "Weekly check-ins",
      "Lead tracker + close monitoring",
    ],
  };

  const list = (deliverables[tierKey] || []).map(x => `- ${x}`).join("\n");

  return [
    "Hi EJT Digital,",
    "",
    `I’m interested in the ${tier.label} package.`,
    `Platforms: ${platforms}`,
    `Estimated from: ${formatZAR(fromTotal)} / month`,
    "",
    "Deliverables:",
    list || "- (please share deliverables)",
    "",
    "Next step: Please send me pricing details and available start dates.",
  ].join("\n");
}

function initPackagesWhatsApp() {
  const buttons = document.querySelectorAll("[data-wa-tier]");
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tierKey = btn.getAttribute("data-wa-tier") || "basic";
      const msg = buildTierWhatsAppMessage(tierKey);
      window.open(buildWhatsAppLink(msg), "_blank", "noopener,noreferrer");
    });
  });
}

// =========================
// WhatsApp links + contact form
// =========================
function initWhatsApp() {
  const topWhatsappLink = document.getElementById("topWhatsappLink");
  if (topWhatsappLink) {
    topWhatsappLink.href = buildWhatsAppLink("Hi EJT Digital — I’d like to book a free strategy call.");
  }

  const footerWhatsappLink = document.getElementById("footerWhatsappLink");
  if (footerWhatsappLink) {
    footerWhatsappLink.href = buildWhatsAppLink("Hi EJT Digital — I’d like to enquire about your services.");
  }

  const form = document.getElementById("whatsappForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = (document.getElementById("name")?.value || "").trim();
    const email = (document.getElementById("email")?.value || "").trim();
    const phone = (document.getElementById("phone")?.value || "").trim();
    const message = (document.getElementById("message")?.value || "").trim();

    const lines = [
      "Hi EJT Digital,",
      "",
      "I’d like to enquire about brand scaling.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      message ? "" : null,
      message ? `Message: ${message}` : null,
    ].filter(Boolean);

    window.open(buildWhatsAppLink(lines.join("\n")), "_blank", "noopener,noreferrer");
  });
}

// =========================
// Init
// =========================
document.addEventListener("DOMContentLoaded", () => {
  setHeaderOffsetVar();
  window.addEventListener("resize", setHeaderOffsetVar);

  initProgressBar();
  initScrollSpy();
  initReveal();

  initCalculator();
  initFromLabelSync();

  initPackageSelect();
  initPackagesWhatsApp();

  initWhatsApp();
});
