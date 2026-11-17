// Run once after deploying:  node --env-file=.env scripts/register-webhook.js https://YOUR-PROJECT.vercel.app/api/webhook
import { gql } from '../lib/shopify.js';

const callbackUrl = process.argv[2];
if (!callbackUrl || !callbackUrl.startsWith('https://')) {
  console.error('Usage: node --env-file=.env scripts/register-webhook.js https://YOUR-PROJECT.vercel.app/api/webhook');
  process.exit(1);
}

const data = await gql(
  `mutation ($topic: WebhookSubscriptionTopic!, $sub: WebhookSubscriptionInput!) {
     webhookSubscriptionCreate(topic: $topic, webhookSubscription: $sub) {
       webhookSubscription { id topic }
       userErrors { field message }
     }
   }`,
  { topic: 'ORDERS_PAID', sub: { callbackUrl, format: 'JSON' } }
);

const result = data.webhookSubscriptionCreate;
if (result.userErrors.length) {
  console.error('Shopify said:', result.userErrors.map((e) => e.message).join('; '));
  process.exit(1);
}
console.log('Webhook registered:', result.webhookSubscription.id);
