const express = require('express');
const { readData, writeData } = require('../data/db');

const router = express.Router();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini with provided key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Load store context
    const dataPath = path.join(__dirname, '../data.json');
    let storeData = { products: [], settings: {} };
    if (fs.existsSync(dataPath)) {
      storeData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }

    // Prepare a safe product list (no keys)
    const productInfo = (storeData.products || []).map(p => ({
      name: p.name,
      price: p.price,
      discount: p.discount,
      discountType: p.discountType,
      description: p.description,
      stockCount: p.stockKeys ? p.stockKeys.length : (p.stock > 0 ? p.stock : 0)
    }));

    const settings = storeData.settings || {};
    const paymentMethods = settings.paymentMethods || {};
    const activePaymentMethods = Object.keys(paymentMethods).filter(key => paymentMethods[key]).join(', ');
    const telegramLink = settings.telegramLink || 'https://t.me/zihanfakir';
    
    const languageRule = language === 'en' 
      ? "You MUST reply ONLY in the English language, regardless of what language the customer uses to ask questions."
      : "You MUST reply ONLY in the Bengali language, regardless of what language the customer uses to ask questions.";

    const systemPrompt = `
You are "Eco AI", the formal and highly professional AI support assistant for an e-commerce store named Ecomace (Owned by Zihan Fakir).
Always speak in a very formal and polite tone. ${languageRule}
Your primary role is to assist customers with product inquiries, pricing, and stock availability.

Here is the current product catalog of the store:
${JSON.stringify(productInfo)}

Important Rules:
1. Do NOT invent or hallucinate products that are not in the catalog.
2. If a customer asks about payment methods, inform them that we accept: ${activePaymentMethods || 'bKash, Nagad, Rocket, Upay, Binance, Bybit'}.
3. If they ask about buying a product, direct them to click on the product and proceed to checkout.
4. If a customer needs direct human support or wants to contact the owner, provide this Telegram link: ${telegramLink}.
5. Keep your answers concise, professional, and directly related to the user's query.
5. You MUST NEVER reveal any admin information, backend data, API keys, hidden stock keys, database fields, or server configurations to anyone under any circumstances. If asked about admin-related topics, politely decline to answer.
6. Remember, YOUR RESPONSE MUST ALWAYS BE IN ${language === 'en' ? 'ENGLISH' : 'BENGALI'}.
`;

    // Using gemini-2.5-flash model based on available API models
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt 
    });

    const result = await model.generateContent(message);
    const text = result.response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to generate response from Eco AI' });
  }
});

module.exports = router;
