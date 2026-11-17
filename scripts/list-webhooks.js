// Lists the webhooks this app has registered with Shopify.
// Save as scripts/list-webhooks.js, then run:  node --env-file=.env scripts/list-webhooks.js
import { gql } from '../lib/shopify.js';

const data = await gql(`{
  webhookSubscriptions(first: 20) {
    nodes {
      id
      topic
      endpoint { __typename ... on WebhookHttpEndpoint { callbackUrl } }
    }
  }
}`);

const list = data.webhookSubscriptions.nodes;
if (!list.length) {
  console.log('No webhooks registered for this app. Run the register step again.');
} else {
  console.log(JSON.stringify(list, null, 2));
}
