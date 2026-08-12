# P&P Collections — Static Product Catalogue

A lightweight, mobile-first artificial jewellery catalogue built with **vanilla HTML, CSS and JavaScript**.

It is designed to run entirely on **GitHub Pages**. There is:

- No Node.js backend
- No PHP/Python backend
- No Firebase
- No Supabase
- No database server
- No authentication
- No checkout/payment gateway
- No API key
- No paid hosting requirement

Google Sheets is the single source of truth for products, settings and business contact information.

---

## 1. Project structure

```text
p-and-p-collections/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── google-sheet.js
│   └── whatsapp.js
├── assets/
│   └── favicon.svg
└── README.md
```

You can upload this entire folder directly to a GitHub repository.

---

# 2. Google Sheet setup

Create one Google Spreadsheet named something like:

`P&P Collections Website`

Create exactly these three tabs:

1. `Products`
2. `Settings`
3. `Content`

The tab names are used by the website, so keep the names exactly as shown.

## Products tab

The first row must contain these column names:

| ProductID | ProductName | Category | ImageURL | Price | DiscountPercent | DiscountedPrice | Stock | Availability | Description |
|---|---|---|---|---:|---:|---:|---:|---|---|
| ER001 | Pearl Drop Earrings | Earrings | https://example.com/image.jpg | 299 | 20 |  | 5 | In Stock | Elegant pearl drop earrings. |
| NK001 | Classic Pearl Necklace | Necklaces | https://example.com/image2.jpg | 799 | 15 |  | 3 | In Stock | A simple pearl necklace for everyday styling. |
| RG001 | Minimal Gold Ring | Rings | https://example.com/image3.jpg | 399 | 10 |  | 0 |  | Minimal artificial gold-finish ring. |

### Important product rules

- `ProductID` — required and should be unique.
- `ProductName` — required.
- `Category` — required. New category names automatically become filters.
- `ImageURL` — optional. If missing or broken, the card shows an image placeholder.
- `Price` — required and should be numeric.
- `DiscountPercent` — optional. Use a number such as `20` for 20%.
- `DiscountedPrice` — optional. If empty, the website calculates:

```text
Price × (1 - DiscountPercent / 100)
```

- `Stock` — optional. If it is `0`, the product is treated as Out of Stock.
- `Availability` — optional. If it contains `Out of Stock`, `Unavailable` or `Sold Out`, the product is treated as unavailable even if Stock is greater than zero.
- `Description` — optional.

If both `DiscountedPrice` and `DiscountPercent` are supplied, the explicit `DiscountedPrice` is used for the displayed selling price. The discount badge still uses `DiscountPercent`.

Invalid rows are skipped instead of crashing the website.

---

# 3. Settings tab

Create these columns:

| Setting | Value |
|---|---|
| WebsiteName | P&P Collections |
| LogoText | P&P |
| PrimaryColor | #8b5e6b |
| SecondaryColor | #d9b6a3 |
| BackgroundColor | #fffaf8 |
| HeaderColor | #fffaf8 |
| FooterColor | #2e2226 |
| CardColor | #ffffff |
| CardBorderColor | #eadfe0 |
| ButtonColor | #8b5e6b |
| ButtonTextColor | #ffffff |
| HeadingTextColor | #2e2226 |
| BodyTextColor | #65575b |
| PriceColor | #8b5e6b |
| DiscountColor | #b44d62 |
| InStockColor | #39755a |
| OutOfStockColor | #a04444 |
| HeadingFont | Playfair Display |
| BodyFont | Poppins |
| BorderRadius | 18px |
| ProductCardRadius | 18px |
| ButtonRadius | 999px |
| ShowProductID | true |
| ShowDescription | true |
| ShowStock | true |
| ShowDiscount | true |
| ShowOriginalPrice | true |
| HeroTitle | Elegant Jewellery for Every Occasion |
| HeroSubtitle | Discover timeless artificial jewellery designed to add a little sparkle to every look. |
| MetaDescription | Elegant and affordable artificial jewellery from P&P Collections. |

### Theme values

Colors can be normal CSS colors, for example:

```text
#8b5e6b
#ffffff
rgb(139, 94, 107)
```

Keep the values simple and valid.

Boolean settings use:

```text
true
false
```

For example:

```text
ShowProductID = false
```

will hide Product IDs from cards without changing the Products sheet.

---

# 4. Content tab

Create these columns:

| Setting | Value |
|---|---|
| AboutUs | P&P Collections brings you elegant and affordable artificial jewellery for everyday style and special occasions. |
| Email | hello@example.com |
| Phone | +91 9876543210 |
| WhatsAppNumber | +91 9876543210 |
| InstagramURL | https://www.instagram.com/yourusername/ |
| MeeshoURL | https://www.meesho.com/ |
| FooterText | Jewellery that makes every moment a little more special. |

Any blank value is automatically hidden from the relevant section.

### WhatsApp number

You can enter either:

```text
+91 9876543210
```

or:

```text
919876543210
```

For a normal Indian 10-digit number, the website automatically adds country code `91`.

---

# 5. Make the Google Sheet public

The website runs from GitHub Pages, so the browser must be able to read the spreadsheet.

### Recommended setup

1. Open the Google Spreadsheet.
2. Click **Share**.
3. Under General access, choose **Anyone with the link**.
4. Set permission to **Viewer**.
5. Do not put private information in this spreadsheet.

You can also use Google's **Publish to the web** feature if you prefer:

1. Open the spreadsheet.
2. Go to **File → Share → Publish to web**.
3. Publish the spreadsheet or the required tabs.
4. Keep the published data limited to information you are comfortable making public.

The website uses Google's public Visualization CSV endpoint. No Google API key is required.

---

# 6. Put your Google Sheet URL into the website

Open:

```text
js/app.js
```

Near the top you will see:

```js
const GOOGLE_SHEET_URL = "PASTE_YOUR_GOOGLE_SHEET_URL_HERE";
const WHATSAPP_FALLBACK_NUMBER = "";
```

Replace the first value with your Google Sheet URL.

Example:

```js
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit";
```

You normally do not need to enter the WhatsApp fallback number because `Content → WhatsAppNumber` is the primary source.

If you want a fallback, use:

```js
const WHATSAPP_FALLBACK_NUMBER = "+919876543210";
```

Do not put passwords, private API keys, service-account credentials or other secrets in the frontend.

---

# 7. How the Google Sheet connection works

The website extracts the Spreadsheet ID from your URL and requests public CSV data for:

```text
Products
Settings
Content
```

Conceptually, it uses Google's public CSV endpoint:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/gviz/tq?tqx=out:csv&sheet=Products
```

The same mechanism is used for `Settings` and `Content`.

This is a frontend-only approach and does not require a backend or API key.

---

# 8. Adding a new product

You do **not** edit the HTML.

Simply add a new row to the `Products` tab.

Example:

```text
ER002 | Rose Gold Hoops | Earrings | https://... | 499 | 25 | | 8 | In Stock | Lightweight rose-gold hoops.
```

Then reload the website.

The new product will automatically appear.

If you create a completely new category, for example:

```text
Anklets
```

the website automatically creates an `Anklets` category filter.

---

# 9. Changing a product

Everything is controlled from the spreadsheet.

### Price

Change:

```text
Price
```

The website will use the new value.

### Discount

Change:

```text
DiscountPercent
```

If `DiscountedPrice` is blank, the website recalculates the selling price.

### Fixed discounted price

If you want to control the exact selling price, enter:

```text
DiscountedPrice
```

### Stock

Change:

```text
Stock
```

If it becomes `0`, the website displays Out of Stock and disables WhatsApp enquiry.

### Availability

Set:

```text
Out of Stock
```

to force the product to be unavailable.

### Image

Replace:

```text
ImageURL
```

with the new public image URL.

### Category

Change:

```text
Category
```

and the product moves to the new category automatically.

---

# 10. Changing About Us / contact information

Open the `Content` tab.

Change:

```text
AboutUs
Email
Phone
WhatsAppNumber
InstagramURL
MeeshoURL
FooterText
```

Save the spreadsheet and refresh the website.

No code change is required.

---

# 11. Changing colours

Open the `Settings` tab.

Change values such as:

```text
PrimaryColor
SecondaryColor
BackgroundColor
HeaderColor
FooterColor
CardColor
CardBorderColor
ButtonColor
ButtonTextColor
HeadingTextColor
BodyTextColor
PriceColor
DiscountColor
InStockColor
OutOfStockColor
```

The website maps these values to CSS custom properties at runtime.

---

# 12. Changing fonts

Set:

```text
HeadingFont
BodyFont
```

Examples:

```text
HeadingFont = Playfair Display
BodyFont = Poppins
```

The website attempts to load the selected font from Google Fonts.

If Google Fonts cannot be reached, the site still works using local system/serif fallbacks.

Fonts are therefore an enhancement, not a requirement.

---

# 13. Product image hosting

The spreadsheet stores only image URLs.

For a beginner, a simple approach is to use a public image hosting/CDN service that gives you a direct HTTPS image URL.

Requirements:

- The URL should be publicly accessible.
- It should use HTTPS.
- It should point to the actual image.
- Do not use a private Google Drive link that requires login.
- Avoid huge original images.

### Recommended image preparation

For catalogue images:

- Use JPG/WebP where practical.
- Around 800–1200px on the longest side is usually enough.
- Keep file sizes reasonable.
- Use a consistent background/style for better catalogue presentation.

You can also host images from another public static/CDN source. No backend is required.

---

# 14. WhatsApp enquiries

When an available product is clicked, the website opens a WhatsApp `wa.me` URL.

The pre-filled message includes:

```text
Hi, I'm interested in this product from P&P Collections.

Product ID: ER001
Product Name: Pearl Drop Earrings
Price: ₹239

Product Image: https://example.com/image.jpg

Please share more details.
```

The product image is **not automatically attached** to WhatsApp.

The image URL is included in the message so the customer can identify the product.

---

# 15. GitHub Pages deployment

## Step 1 — Create repository

Go to GitHub and create a new repository, for example:

```text
p-and-p-collections
```

## Step 2 — Upload the project

Upload:

```text
index.html
css/
js/
assets/
README.md
```

Make sure `index.html` is in the repository root.

## Step 3 — Commit

Commit the files to the `main` branch.

## Step 4 — Open Settings

Inside the GitHub repository:

```text
Settings
```

## Step 5 — Open Pages

Go to:

```text
Settings → Pages
```

## Step 6 — Configure deployment

Under the build/deployment source:

```text
Deploy from a branch
```

Select:

```text
Branch: main
Folder: / (root)
```

Then click:

```text
Save
```

## Step 7 — Wait for deployment

GitHub will build and publish the static website.

Your URL will normally look similar to:

```text
https://YOUR-USERNAME.github.io/p-and-p-collections/
```

## Step 8 — Test

Open the published URL on:

- Desktop
- Android
- iPhone
- Tablet

Also test:

- Product filtering
- Product images
- Out-of-stock products
- WhatsApp buttons
- Instagram link
- Meesho link
- Email
- Phone
- Google Sheet updates

---

# 16. Updating the website

### Product/content/theme changes

If you only change Google Sheet data:

**No GitHub deployment is required.**

Refresh the website after the sheet data has updated.

### Code/design changes

If you modify HTML/CSS/JS:

1. Edit the files.
2. Commit the changes to `main`.
3. GitHub Pages automatically republishes the site.

---

# 17. Important Google Sheets caching note

The website requests the spreadsheet with `cache: no-store`, but Google and browser/network layers can still introduce short delays before a very recent spreadsheet edit becomes visible.

If you make a change and do not immediately see it:

1. Wait a short time.
2. Hard refresh the page.
3. Check that the spreadsheet is publicly accessible.
4. Check that the tab names are exactly:
   - `Products`
   - `Settings`
   - `Content`

---

# 18. Troubleshooting

## "Please add your Google Sheet URL..."

Open:

```text
js/app.js
```

and replace:

```js
PASTE_YOUR_GOOGLE_SHEET_URL_HERE
```

with the actual spreadsheet URL.

---

## Collection cannot load

Check:

- The spreadsheet is publicly viewable.
- The tab names are correct.
- The first row contains the correct column headers.
- The browser has an internet connection.
- The spreadsheet ID in the URL is valid.

---

## Product does not appear

Check:

- ProductID exists.
- ProductName exists.
- Category exists.
- Price is numeric.

Rows with missing required fields are intentionally skipped.

---

## Image does not appear

Check that:

- ImageURL is HTTPS.
- The URL is publicly accessible.
- It points to an actual image.
- The host does not require login.
- The host allows browser image loading.

The product card will show a safe placeholder if the image fails.

---

## WhatsApp does not open

Check:

```text
Content → WhatsAppNumber
```

Use a number containing the country code or a normal 10-digit Indian number.

Example:

```text
+91 9876543210
```

---

# 19. Security and privacy

This website is static.

Anything downloaded by the browser should be considered public.

Therefore:

**Never put these into the Google Sheet or JavaScript:**

- Passwords
- API secrets
- Private credentials
- Google service-account credentials
- Payment credentials
- Private customer information

The Google Sheet should contain only catalogue/business information that you are comfortable making public.

---

# 20. Business scope

This website intentionally does not include:

- Cart
- Checkout
- Payments
- Customer accounts
- Login
- Registration
- Order management
- Inventory backend
- Database
- Admin dashboard

Its job is to:

1. Build trust in P&P Collections.
2. Display the catalogue.
3. Help customers discover products.
4. Send product enquiries to WhatsApp.
5. Link customers to Instagram and Meesho.

This keeps the project lightweight and suitable for GitHub Pages.

---

# 21. Browser compatibility

The project uses modern browser features including:

- ES modules
- Fetch API
- CSS custom properties
- CSS Grid
- Intersection-independent native lazy loading
- Modern DOM APIs

Current Chrome, Safari, Edge and Firefox versions are supported.

---

# 22. Final setup checklist

- [ ] Create Google Spreadsheet
- [ ] Create `Products` tab
- [ ] Create `Settings` tab
- [ ] Create `Content` tab
- [ ] Add product data
- [ ] Add image URLs
- [ ] Make the sheet publicly viewable
- [ ] Copy the Google Sheet URL
- [ ] Put the URL into `js/app.js`
- [ ] Add WhatsApp number in `Content`
- [ ] Upload project to GitHub
- [ ] Enable GitHub Pages from `main` + `/ (root)`
- [ ] Open the published URL
- [ ] Test on mobile
- [ ] Test a WhatsApp enquiry
- [ ] Test an out-of-stock product
- [ ] Test category filters
- [ ] Test a broken/missing image
