import Stripe from "stripe";

async function getStripeClient() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found");
  }

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", "stripe");
  url.searchParams.set("environment", "development");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      X_REPLIT_TOKEN: xReplitToken,
    },
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings?.settings?.secret) {
    throw new Error("Stripe connection not found");
  }

  return new Stripe(connectionSettings.settings.secret);
}

async function createProducts() {
  console.log("Creating Stripe products...");
  const stripe = await getStripeClient();

  const products = [
    {
      name: "Voicall Starter",
      description: "Für kleine Praxen - 200 Minuten/Monat",
      metadata: { tier: "starter", minutes: "200" },
      price: 19900,
    },
    {
      name: "Voicall Pro",
      description: "Für größere Praxen - 1000 Minuten/Monat",
      metadata: { tier: "pro", minutes: "1000" },
      price: 34900,
    },
    {
      name: "Voicall Enterprise",
      description: "Für große Einrichtungen - Unbegrenzte Minuten",
      metadata: { tier: "enterprise", minutes: "unlimited" },
      price: 49900,
    },
  ];

  const createdPrices: Record<string, string> = {};

  for (const productData of products) {
    const existingProducts = await stripe.products.search({
      query: `name:'${productData.name}'`,
    });

    let product;
    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(
        `Product "${productData.name}" already exists: ${product.id}`
      );
    } else {
      product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata,
      });
      console.log(`Created product "${productData.name}": ${product.id}`);
    }

    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    let price;
    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0];
      console.log(
        `Price already exists for "${productData.name}": ${price.id}`
      );
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.price,
        currency: "chf",
        recurring: { interval: "month" },
      });
      console.log(`Created price for "${productData.name}": ${price.id}`);
    }

    createdPrices[productData.metadata.tier] = price.id;
  }

  console.log("\n=== SET THESE ENVIRONMENT VARIABLES ===");
  console.log(`STRIPE_PRICE_STARTER=${createdPrices.starter}`);
  console.log(`STRIPE_PRICE_PRO=${createdPrices.pro}`);
  console.log(`STRIPE_PRICE_ENTERPRISE=${createdPrices.enterprise}`);
}

createProducts().catch(console.error);
