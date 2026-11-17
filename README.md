# Print-file server for your artwork and business card editors

When an order is paid, this server:

1. receives Shopify's "order paid" notification,
2. reads each line item's saved properties (the visible ones plus the hidden `_Artwork ...` / `_Card ...` ones),
3. redraws the poster or business card at print size, with no watermark,
4. uploads the PNG to your store's **Files**,
5. writes the file links into the order **note**, adds the tag `print-file-ready`, and saves the links in an order metafield (`artwork.print_files`).

It runs on Vercel. Total time to set up: about an hour the first time.

---

## Step 1. Check the snippets (theme)

Use the latest `artwork.liquid` and `businesscard.liquid` (the card file was updated to save two more hidden settings, `_Card caps` and `_Card one line`). Re-upload both to your theme's `snippets` folder.

Then test on a product page: edit the design, click **Save**, add to cart, and check the properties show in the cart. Properties that start with an underscore are hidden from the customer by design.

## Step 2. Create the Shopify app

1. In your Shopify admin go to **Settings > Apps and sales channels > Develop apps > Build apps in Dev Dashboard**, then **Create app**.
2. Give it a name such as "Print files".
3. In the app's version settings, add these access scopes: `read_orders`, `write_orders`, `read_files`, `write_files`.
4. **Release** the version, then **Install** the app on your store.
5. Open the app's **Settings** in the Dev Dashboard and copy the **Client ID** and **Client secret**.

Notes:
- The client-credentials sign-in used here only works when the app and the store are in the same Shopify organization (both listed in the same Dev Dashboard org).
- If a later step complains about "protected customer data", open the app in the Dev Dashboard and request access under its API access / data protection settings, then try again.

## Step 3. Add the fonts

The server has no system fonts, so it ships with the ones you put in the `fonts` folder. Follow `fonts/README.txt` (Montserrat, Gelasio, Arimo, Cousine, Liberation Sans Narrow, all free). If the folder is empty the server stops with an error rather than printing blank artwork.

These were chosen so text wraps the same as in the editor preview. Small differences can still happen, so always check a first order by eye.

## Step 4. Try it on your computer (optional but recommended)

You need Node 20 or newer.

```
npm install
npm run test:render
```

This writes sample posters and a card to the `out` folder, with no Shopify involved. Open them and check the fonts and layout. To include a product image, add one of your `cdn.shopify.com` image links:

```
npm run test:render -- --image=https://cdn.shopify.com/s/files/....jpg
```

## Step 5. Deploy to Vercel

1. Put this folder in a GitHub repository (or use the Vercel CLI: `npx vercel`).
2. Create a project on vercel.com from it. No framework settings are needed.
3. In **Settings > Environment Variables** add:
   - `SHOPIFY_SHOP` = your store name (the part before `.myshopify.com`)
   - `SHOPIFY_CLIENT_ID`
   - `SHOPIFY_CLIENT_SECRET`
4. Deploy. Open `https://YOUR-PROJECT.vercel.app/api/webhook` in a browser. You should see "Artwork webhook is running."

## Step 6. Register the webhook (once)

Copy `.env.example` to `.env`, fill in the same three values, then run:

```
npm run register -- https://YOUR-PROJECT.vercel.app/api/webhook
```

It prints "Webhook registered". Shopify will now call your server whenever an order is paid.

## Step 7. Place a test order

1. Turn on a test payment method (for example the Bogus Gateway on a development store), or create a draft order and mark it as paid.
2. Order a poster or card with your editor, using **Save** before adding to cart.
3. After a few seconds, open the order in the admin: the **note** has the print file links and the tag `print-file-ready` is added. The PNG is also in **Content > Files**.
4. If nothing happens, open the Vercel project's **Logs** and look for lines starting with "Order".

---

## Good to know

- **Size limits.** Shopify allows files up to 20 MB, and images up to 20 megapixels. The server starts at 300 dpi and lowers the resolution a little if needed to stay under those limits. A4 and A3 usually keep 300 dpi; A2 and A1 come out around 200 dpi or less. Settings: `PRINT_DPI`, `MAX_FILE_MB`, `MAX_PIXELS`.
- **Same order twice.** Shopify can send a notification more than once. The tag `print-file-ready` stops the server from making the files again.
- **Safety.** Cart properties come from the customer's browser, so the server validates every value, and only downloads images from `cdn.shopify.com`.
- **Keep the drawing code in sync.** `lib/poster.js` and `lib/card.js` are copies of the drawing code from the two snippets. If you change how the editors draw, ask for the server copies to be regenerated.
- **Letter spacing.** The editor adds a little space between letters in labels. The server library may not support that, so those labels can look slightly tighter in the print file.
- **File type.** Files are uploaded as generic files so Shopify does not re-process them. If you prefer image handling, set `SHOPIFY_FILE_TYPE=IMAGE`.

## If something goes wrong

| What you see | Likely cause |
| --- | --- |
| 401 in the logs or webhook calls rejected | Wrong `SHOPIFY_CLIENT_SECRET`, or the secret was rotated |
| "Token request failed" | Wrong client ID/secret, app not installed, or app and store are in different organizations |
| "No fonts found" | The `fonts` folder is empty |
| "Access denied" from a GraphQL call | A scope is missing. Add it, release a new version, and approve it on the store |
| Webhook stops arriving | Shopify removes a webhook after many failed deliveries. Run the register step again |
| Text looks different from the preview | A font file is missing or has a different name. Check `fonts/README.txt` |
| Function times out | Raise `maxDuration` in `vercel.json` (it is 60 seconds) |
