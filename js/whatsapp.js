const FALLBACK_COUNTRY_CODE = "91";

/**
 * Creates a WhatsApp enquiry URL. WhatsApp receives a text message only;
 * the product image URL is included in the message and is not automatically attached.
 */
export function createWhatsAppUrl(number, product) {
  const normalized = normalizePhone(number);
  if (!normalized) return null;

  const message = [
    "Hi, I'm interested in this product from P&P Collections.",
    "",
    `Product ID: ${product.productId}`,
    `Product Name: ${product.productName}`,
    `Price: ${formatINR(product.discountedPrice)}`,
    "",
    `Product Image: ${product.imageUrl || "Not available"}`,
    "",
    "Please share more details."
  ].join("\n");

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function normalizePhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";

  // India is the default because this catalogue is intended for an Indian business.
  if (digits.length === 10) return `${FALLBACK_COUNTRY_CODE}${digits}`;
  return digits;
}

function formatINR(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Price on request";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(number);
}

export function openWhatsApp(number, product) {
  const url = createWhatsAppUrl(number, product);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
