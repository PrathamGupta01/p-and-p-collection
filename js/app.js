import { fetchAllSheets } from "./google-sheet.js";
import { openWhatsApp } from "./whatsapp.js";

/* =========================================================
   CONFIGURATION — ONLY CHANGE THESE VALUES IF NEEDED
   ========================================================= */
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQV6fMOMA6SJjVhA02PCKEp7of8Z8KB3wOFMYwVe2VksyJFMdq-cx1p18LtdSGmFWryYrbN0ga12Qtn/pubhtml";
const WHATSAPP_FALLBACK_NUMBER = "1234567890";
/* ========================================================= */

const DEFAULT_SETTINGS = {
  WebsiteName: "P&P Collections",
  LogoText: "P&P",
  PrimaryColor: "#8b5e6b",
  SecondaryColor: "#d9b6a3",
  BackgroundColor: "#fffaf8",
  HeaderColor: "#fffaf8",
  FooterColor: "#2e2226",
  CardColor: "#ffffff",
  CardBorderColor: "#eadfe0",
  ButtonColor: "#8b5e6b",
  ButtonTextColor: "#ffffff",
  HeadingTextColor: "#2e2226",
  BodyTextColor: "#65575b",
  PriceColor: "#8b5e6b",
  DiscountColor: "#b44d62",
  InStockColor: "#39755a",
  OutOfStockColor: "#a04444",
  HeadingFont: "Playfair Display",
  BodyFont: "Poppins",
  BorderRadius: "18px",
  ProductCardRadius: "18px",
  ButtonRadius: "999px",
  ShowProductID: "true",
  ShowDescription: "true",
  ShowStock: "true",
  ShowDiscount: "true",
  ShowOriginalPrice: "true",
  HeroTitle: "Elegant Jewellery for Every Occasion",
  HeroSubtitle: "Discover timeless artificial jewellery designed to add a little sparkle to every look."
};

const state = {
  products: [],
  filteredProducts: [],
  categories: [],
  activeCategory: "All",
  settings: { ...DEFAULT_SETTINGS },
  content: {},
  whatsappNumber: ""
};

const elements = {
  header: document.querySelector(".site-header"),
  nav: document.querySelector("#site-nav"),
  menuToggle: document.querySelector(".menu-toggle"),
  categoryFilters: document.querySelector("#category-filters"),
  productGrid: document.querySelector("#product-grid"),
  catalogueStatus: document.querySelector("#catalogue-status"),
  about: document.querySelector("#about"),
  aboutContent: document.querySelector("#about-content"),
  contact: document.querySelector("#contact"),
  contactList: document.querySelector("#contact-list"),
  footer: document.querySelector("#footer"),
  footerBrand: document.querySelector("#footer-brand"),
  footerText: document.querySelector("#footer-text"),
  footerInstagram: document.querySelector("#footer-instagram"),
  heroTitle: document.querySelector("#hero-title"),
  heroSubtitle: document.querySelector("#hero-subtitle"),
  toast: document.querySelector("#toast")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setupNavigation();
  setInitialPageMetadata();
  setLoadingState();

  if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL.includes("PASTE_YOUR")) {
    showCatalogueError("Please add your Google Sheet URL in js/app.js before publishing the website.");
    return;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  try {
    const data = await fetchAllSheets(GOOGLE_SHEET_URL, controller.signal);
    state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
    state.content = data.content;
    state.whatsappNumber = data.content.WhatsAppNumber || WHATSAPP_FALLBACK_NUMBER;

    applySettings(state.settings);
    applyContent(state.content);
    state.products = normalizeProducts(data.products);
    state.categories = getCategories(state.products);

    renderCategories();
    renderProducts();

    elements.catalogueStatus.classList.add("is-hidden");

    if (!state.products.length) {
      showEmptyState("Our collection is being updated. Please check back soon.");
    }
  } catch (error) {
    console.error("Catalogue load error:", error);
    const message = error?.name === "AbortError"
      ? "The collection took too long to load. Please try again later."
      : "Unable to load our collection right now. Please try again later.";
    showCatalogueError(message);
  } finally {
    window.clearTimeout(timeout);
  }
}

function setupNavigation() {
  elements.menuToggle.addEventListener("click", () => {
    const open = elements.nav.classList.toggle("is-open");

    elements.menuToggle.setAttribute(
      "aria-expanded",
      String(open)
    );

    elements.menuToggle.setAttribute(
      "aria-label",
      open ? "Close menu" : "Open menu"
    );
  });

  document.querySelectorAll('.site-nav a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);

      if (!target || target.classList.contains("is-hidden")) {
        return;
      }

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      elements.nav.classList.remove("is-open");
      elements.menuToggle.setAttribute("aria-expanded", "false");
      elements.menuToggle.setAttribute("aria-label", "Open menu");
    });
  });
}

function normalizeProducts(rows) {
  return rows
    .map(row => {
      const productId = clean(row.ProductID);
      const productName = clean(row.ProductName);
      const category = clean(row.Category);
      const imageUrl = clean(row.ImageURL);
      const price = toNumber(row.Price);
      const discountPercent = clamp(toNumber(row.DiscountPercent), 0, 100);
      const suppliedDiscountedPrice = toNumber(row.DiscountedPrice);
      const discountedPrice = suppliedDiscountedPrice > 0
        ? suppliedDiscountedPrice
        : (Number.isFinite(price) ? price * (1 - discountPercent / 100) : NaN);
      const stock = toNumber(row.Stock);
      const availability = clean(row.Availability);
      const description = clean(row.Description);

      // Required fields: ID, name, category and a usable price.
      if (!productId || !productName || !category || !Number.isFinite(price)) {
        return null;
      }

      const explicitUnavailable = /out[\s-]?of[\s-]?stock|unavailable|sold[\s-]?out/i.test(availability);
      const available = explicitUnavailable ? false : (Number.isFinite(stock) ? stock > 0 : true);

      return {
        productId,
        productName,
        category,
        imageUrl,
        price,
        discountPercent,
        discountedPrice: Number.isFinite(discountedPrice) ? discountedPrice : price,
        stock,
        availability,
        description,
        available
      };
    })
    .filter(Boolean);
}

function getCategories(products) {
  return [...new Set(products.map(product => product.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

function renderCategories() {
  elements.categoryFilters.replaceChildren();

  const categories = ["All", ...state.categories];
  for (const category of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-filter";
    button.textContent = category;
    button.setAttribute("aria-pressed", String(category === state.activeCategory));
    button.addEventListener("click", () => {
      state.activeCategory = category;
      renderCategories();
      renderProducts();
    });
    elements.categoryFilters.appendChild(button);
  }
}

function renderProducts() {
  const products = state.activeCategory === "All"
    ? state.products
    : state.products.filter(product => product.category === state.activeCategory);

  state.filteredProducts = products;
  elements.productGrid.replaceChildren();

  if (!products.length) {
    showEmptyState("No products found in this category.");
    return;
  }

  for (const product of products) {
    elements.productGrid.appendChild(createProductCard(product));
  }
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";

  const imageWrap = document.createElement("div");
  imageWrap.className = "product-image-wrap";

  if (product.imageUrl) {
    const img = document.createElement("img");
    img.src = product.imageUrl;
    img.alt = product.productName;
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "product-image-fallback";
      fallback.textContent = "Image unavailable";
      img.replaceWith(fallback);
    }, { once: true });
    imageWrap.appendChild(img);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "product-image-fallback";
    fallback.textContent = "Image unavailable";
    imageWrap.appendChild(fallback);
  }

  if (showSetting("ShowDiscount") && product.discountPercent > 0) {
    const badge = document.createElement("span");
    badge.className = "discount-badge";
    badge.textContent = `${formatNumber(product.discountPercent)}% OFF`;
    imageWrap.appendChild(badge);
  }

  const body = document.createElement("div");
  body.className = "product-body";

  const category = document.createElement("p");
  category.className = "product-category";
  category.textContent = product.category;

  const name = document.createElement("h3");
  name.className = "product-name";
  name.textContent = product.productName;

  body.append(category, name);

  if (showSetting("ShowProductID")) {
    const id = document.createElement("p");
    id.className = "product-id";
    id.textContent = `ID: ${product.productId}`;
    body.appendChild(id);
  }

  if (showSetting("ShowDescription") && product.description) {
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description;
    body.appendChild(description);
  }

  const priceRow = document.createElement("div");
  priceRow.className = "price-row";

  const discountedPrice = document.createElement("span");
  discountedPrice.className = "discounted-price";
  discountedPrice.textContent = formatINR(product.discountedPrice);
  priceRow.appendChild(discountedPrice);

  if (showSetting("ShowOriginalPrice") && product.discountedPrice < product.price) {
    const originalPrice = document.createElement("span");
    originalPrice.className = "original-price";
    originalPrice.textContent = formatINR(product.price);
    priceRow.appendChild(originalPrice);
  }

  body.appendChild(priceRow);

  if (showSetting("ShowStock")) {
    const stock = document.createElement("p");
    stock.className = `stock ${product.available ? "in-stock" : "out-of-stock"}`;
    stock.textContent = product.available
      ? (product.availability || "In Stock")
      : "Out of Stock";
    body.appendChild(stock);
  }

  const enquiryButton = document.createElement("button");
  enquiryButton.type = "button";
  enquiryButton.className = "btn product-enquiry";
  enquiryButton.textContent = product.available ? "Enquire on WhatsApp" : "Out of Stock";
  enquiryButton.disabled = !product.available;
  enquiryButton.addEventListener("click", () => {
    if (!product.available) return;

    if (!state.whatsappNumber) {
      showToast("WhatsApp contact is not configured yet.");
      return;
    }

    const opened = openWhatsApp(state.whatsappNumber, product);
    if (!opened) showToast("Please add a valid WhatsApp number in the Sheet.");
  });

  body.appendChild(enquiryButton);
  card.append(imageWrap, body);
  return card;
}

function applySettings(settings) {
  const cssMap = {
    PrimaryColor: "--primary-color",
    SecondaryColor: "--secondary-color",
    BackgroundColor: "--background-color",
    HeaderColor: "--header-color",
    FooterColor: "--footer-color",
    CardColor: "--card-color",
    CardBorderColor: "--card-border-color",
    ButtonColor: "--button-color",
    ButtonTextColor: "--button-text-color",
    HeadingTextColor: "--heading-text-color",
    BodyTextColor: "--body-text-color",
    PriceColor: "--price-color",
    DiscountColor: "--discount-color",
    InStockColor: "--in-stock-color",
    OutOfStockColor: "--out-of-stock-color",
    BorderRadius: "--border-radius",
    ProductCardRadius: "--product-card-radius",
    ButtonRadius: "--button-radius"
  };

  for (const [setting, cssVariable] of Object.entries(cssMap)) {
    const value = settings[setting];
    if (value && isSafeCssValue(value)) {
      document.documentElement.style.setProperty(cssVariable, value);
    }
  }

  if (settings.HeadingFont) {
    document.documentElement.style.setProperty("--heading-font", fontStack(settings.HeadingFont, true));
    loadGoogleFont(settings.HeadingFont);
  }

  if (settings.BodyFont) {
    document.documentElement.style.setProperty("--body-font", fontStack(settings.BodyFont, false));
    loadGoogleFont(settings.BodyFont);
  }

  elements.heroTitle.textContent = settings.HeroTitle || DEFAULT_SETTINGS.HeroTitle;
  elements.heroSubtitle.textContent = settings.HeroSubtitle || DEFAULT_SETTINGS.HeroSubtitle;
  document.title = `${settings.WebsiteName || "P&P Collections"} | Artificial Jewellery`;

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.content = settings.MetaDescription || "Elegant and affordable artificial jewellery from P&P Collections.";
  }

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = document.title;
}

function applyContent(content) {
  const websiteName = state.settings.WebsiteName || "P&P Collections";
  document.querySelectorAll(".brand-name").forEach(el => el.textContent = websiteName);
  elements.footerBrand.textContent = websiteName;

  if (content.AboutUs && content.AboutUs.trim()) {
  elements.about.classList.remove("is-hidden");
  elements.aboutContent.textContent = content.AboutUs.trim();
}

  const contactItems = [
    {
      label: "Email",
      value: content.Email,
      href: content.Email ? `mailto:${content.Email}` : "",
      display: content.Email
    },
    {
      label: "Phone",
      value: content.Phone,
      href: content.Phone ? `tel:${content.Phone.replace(/[^\d+]/g, "")}` : "",
      display: content.Phone
    },
    {
      label: "WhatsApp",
      value: content.WhatsAppNumber,
      href: content.WhatsAppNumber ? `https://wa.me/${normalizeWhatsApp(content.WhatsAppNumber)}` : "",
      display: content.WhatsAppNumber
    },
    {
      label: "Instagram",
      value: content.InstagramURL,
      href: safeUrl(content.InstagramURL),
      display: content.InstagramURL
    },
    {
      label: "Meesho",
      value: content.MeeshoURL,
      href: safeUrl(content.MeeshoURL),
      display: content.MeeshoURL
    }
  ];

  const visibleContacts = contactItems.filter(item => item.display && item.href);
  if (visibleContacts.length > 0) {
  elements.contact.classList.remove("is-hidden");
  elements.contactList.replaceChildren();

    visibleContacts.forEach(item => {
      const link = document.createElement("a");
      link.className = "contact-item";
      link.href = item.href;
      link.target = item.label === "Email" || item.label === "Phone" ? "_self" : "_blank";
      if (link.target === "_blank") link.rel = "noopener noreferrer";

      const label = document.createElement("span");
      label.textContent = item.label;

      const value = document.createElement("span");
      value.textContent = item.value;

      link.append(label, value);
      elements.contactList.appendChild(link);
    });
  }

  if (content.FooterText || content.InstagramURL) {
    elements.footer.classList.remove("is-hidden");
    elements.footerText.textContent = content.FooterText || "";
    if (content.InstagramURL) {
      const url = safeUrl(content.InstagramURL);
      if (url) {
        elements.footerInstagram.href = url;
        elements.footerInstagram.classList.remove("is-hidden");
      }
    }
  }
}

function setInitialPageMetadata() {
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.content = window.location.href;
}

function setLoadingState() {
  elements.catalogueStatus.classList.remove("is-hidden", "error");
  elements.catalogueStatus.innerHTML = '<div class="loader" aria-hidden="true"></div><span>Loading our collection…</span>';
  elements.productGrid.replaceChildren();
}

function showCatalogueError(message) {
  elements.catalogueStatus.classList.remove("is-hidden");
  elements.catalogueStatus.classList.add("error");
  elements.catalogueStatus.innerHTML = `<span>${escapeHtml(message)}</span>`;
  elements.productGrid.replaceChildren();
  elements.categoryFilters.replaceChildren();
}

function showEmptyState(message) {
  elements.productGrid.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";
  empty.textContent = message;
  elements.productGrid.appendChild(empty);
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 3500);
}

function showSetting(key) {
  return String(state.settings[key] ?? "true").toLowerCase() !== "false";
}

function formatINR(value) {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
    : "Price on request";
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function toNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return NaN;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : NaN;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(min, value));
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeWhatsApp(value) {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

function safeUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function isSafeCssValue(value) {
  const text = String(value).trim();
  return text.length <= 100 && !/[{};]/.test(text);
}

function fontStack(font, heading) {
  const quoted = `"${String(font).replace(/"/g, "")}"`;
  return heading
    ? `${quoted}, Georgia, "Times New Roman", serif`
    : `${quoted}, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
}

function loadGoogleFont(fontName) {
  const cleanName = String(fontName).trim();
  if (!cleanName) return;

  const id = `google-font-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanName).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`;
  link.onerror = () => link.remove();
  document.head.appendChild(link);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
