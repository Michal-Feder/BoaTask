import { join } from "path";
import express, { Request, Response } from 'express';  // ככה import נכון
import { readFileSync } from "fs";
import serveStatic from "serve-static";
import dotenv from "dotenv";

import shopify from "./shopify.js";

const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// const cors = require("cors");

dotenv.config();

const backendPort = process.env.BACKEND_PORT as string;
const envPort = process.env.PORT as string;
const PORT = parseInt(backendPort || envPort, 10);

const app = express();

// app.use(cors({
//   origin: "*", // אפשר לאפשר מקור ספציפי כמו "https://your-shopify-store.com"
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// }));

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);

app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: {} })
);

app.use(express.json());

// All endpoints after this point will require an active session
app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(serveStatic(`${process.cwd()}/frontend/`, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  const htmlContent = readFileSync(
    join(`${process.cwd()}/frontend/`, "index.html"),
    "utf-8"
  );
  const transformedHtml = htmlContent.replace(
    /%SHOPIFY_API_KEY%/g,
    process.env.SHOPIFY_API_KEY || ""
  );

  res.status(200).set("Content-Type", "text/html").send(transformedHtml);
});

app.listen(PORT);
app.use(router); 

console.log(`Server is running on port ${PORT}`);

router.post('/save-cart', async (req, res) => {
  const { user, selectedItems } = req.body;

  if (!user || !selectedItems) {
    res.status(400).json({ error: 'Invalid data' });
  }

  try {
    await prisma.savedCart.upsert({
      where: { customer_id: user },
      update: { saved_cart: JSON.stringify(selectedItems) },
      create: { customer_id: user, saved_cart: JSON.stringify(selectedItems) },
    });

    res.status(200).json({ message: 'Cart saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error saving cart' });
  }
});

// router.get('/get-saved-cart/:userId', async (req, res) => {
//   const { userId } = req.params;

//   try {
//     // שליפת הפריטים השמורים לפי מזהה הלקוח
//     const savedCart = await prisma.savedCart.findUnique({
//       where: { customer_id: userId },
//     });

//     if (!savedCart) {
//       res.status(404).json({ message: 'No saved cart found' });
//     }

//     // החזרת הפריטים השמורים ללקוח
//     res.status(200).json({ savedCart: JSON.parse(savedCart.saved_cart) });
//   } catch (error) {
//     console.error('Error fetching saved cart:', error);
//     res.status(500).json({ error: 'Error fetching saved cart' });
//   }
// });


module.exports = router;
