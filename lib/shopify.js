const SHOP = process.env.SHOPIFY_SHOP;                     // store name, the part before .myshopify.com
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-04';
const FILE_TYPE = process.env.SHOPIFY_FILE_TYPE || 'FILE'; // set to IMAGE if you prefer Shopify to treat the PNG as an image

const base = () => 'https://' + SHOP + '.myshopify.com';

/* ---------- access token (client credentials grant) ---------- */
let cached = { token: null, expires: 0 };

export async function getToken() {
  if (cached.token && Date.now() < cached.expires) return cached.token;
  const res = await fetch(base() + '/admin/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET
    })
  });
  if (!res.ok) throw new Error('Token request failed (' + res.status + '): ' + (await res.text()));
  const json = await res.json();
  const ttl = Number(json.expires_in) > 120 ? Number(json.expires_in) - 60 : 3000; // seconds
  cached = { token: json.access_token, expires: Date.now() + ttl * 1000 };
  return cached.token;
}

/* ---------- GraphQL ---------- */
export async function gql(query, variables) {
  const res = await fetch(base() + '/admin/api/' + API_VERSION + '/graphql.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await getToken() },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error('GraphQL HTTP ' + res.status + ': ' + (await res.text()));
  const json = await res.json();
  if (json.errors) throw new Error('GraphQL errors: ' + JSON.stringify(json.errors));
  return json.data;
}

function assertNoUserErrors(label, payload) {
  const errs = payload && payload.userErrors;
  if (errs && errs.length) throw new Error(label + ': ' + errs.map((e) => e.message).join('; '));
}

/* ---------- upload a PNG to Shopify Files ---------- */
export async function uploadPng(buffer, filename, alt) {
  // 1. ask Shopify for a temporary upload target
  const staged = await gql(
    `mutation ($input: [StagedUploadInput!]!) {
       stagedUploadsCreate(input: $input) {
         stagedTargets { url resourceUrl parameters { name value } }
         userErrors { field message }
       }
     }`,
    { input: [{ resource: 'FILE', filename, mimeType: 'image/png', httpMethod: 'POST' }] }
  );
  assertNoUserErrors('stagedUploadsCreate', staged.stagedUploadsCreate);
  const target = staged.stagedUploadsCreate.stagedTargets[0];

  // 2. upload the bytes (the file field must come last)
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append('file', new Blob([buffer], { type: 'image/png' }), filename);
  const up = await fetch(target.url, { method: 'POST', body: form });
  if (!up.ok) throw new Error('Staged upload failed (' + up.status + '): ' + (await up.text()));

  // 3. turn the upload into a file in the store
  const created = await gql(
    `mutation ($files: [FileCreateInput!]!) {
       fileCreate(files: $files) {
         files { id fileStatus }
         userErrors { field message }
       }
     }`,
    { files: [{ originalSource: target.resourceUrl, contentType: FILE_TYPE, filename, alt }] }
  );
  assertNoUserErrors('fileCreate', created.fileCreate);
  const id = created.fileCreate.files[0].id;

  // 4. processing is asynchronous: wait until the file is ready, then read its URL
  for (let i = 0; i < 30; i++) {
    const data = await gql(
      `query ($id: ID!) {
         node(id: $id) {
           ... on File { fileStatus }
           ... on MediaImage { image { url } }
           ... on GenericFile { url }
         }
       }`,
      { id }
    );
    const n = data.node;
    if (n && n.fileStatus === 'FAILED') throw new Error('Shopify could not process the file');
    if (n && n.fileStatus === 'READY') {
      const url = (n.image && n.image.url) || n.url;
      if (url) return { id, url };
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Timed out waiting for the file to be ready');
}

/* ---------- order helpers ---------- */
export async function getOrderState(orderGid) {
  const data = await gql(`query ($id: ID!) { order(id: $id) { note tags } }`, { id: orderGid });
  return { note: data.order?.note || '', tags: data.order?.tags || [] };
}

export async function attachToOrder(orderGid, currentNote, files, doneTag) {
  const lines = files.map((f) => '- ' + f.title + ': ' + f.url);
  const note = (currentNote ? currentNote + '\n\n' : '') + 'Print files:\n' + lines.join('\n');

  const upd = await gql(
    `mutation ($input: OrderInput!) {
       orderUpdate(input: $input) { order { id } userErrors { field message } }
     }`,
    { input: { id: orderGid, note } }
  );
  assertNoUserErrors('orderUpdate', upd.orderUpdate);

  const tag = await gql(
    `mutation ($id: ID!, $tags: [String!]!) {
       tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
     }`,
    { id: orderGid, tags: [doneTag] }
  );
  assertNoUserErrors('tagsAdd', tag.tagsAdd);

  // Best effort: also keep the links in an order metafield for apps and automations.
  try {
    await gql(
      `mutation ($m: [MetafieldsSetInput!]!) {
         metafieldsSet(metafields: $m) { userErrors { field message } }
       }`,
      { m: [{ ownerId: orderGid, namespace: 'artwork', key: 'print_files', type: 'multi_line_text_field', value: lines.join('\n') }] }
    );
  } catch (err) {
    console.warn('Metafield not saved:', err.message);
  }
}
