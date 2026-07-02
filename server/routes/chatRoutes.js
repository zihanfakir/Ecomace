const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const Product = require('../models/Product');
const Setting = require('../models/Setting');

// Initialize Gemini with provided key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
  try {
    const { message, language } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Load store context
    const products = await Product.find({});
    let settingDoc = await Setting.findOne({ settingType: 'global' });
    const settings = settingDoc ? (settingDoc.state || {}) : {};

    // Prepare a safe product list (no keys)
    const productInfo = products.map(p => ({
      name: p.name,
      price: p.price,
      discount: p.discount,
      discountType: p.discountType,
      description: p.description,
      stockCount: p.stockKeys ? p.stockKeys.length : 0
    }));

    const paymentMethods = settings.paymentMethods || {};
    const activePaymentMethods = Object.keys(paymentMethods).filter(key => paymentMethods[key]).join(', ');
    const telegramLink = settings.telegramLink || 'https://t.me/zihanfakir';
    const whatsappLink = settings.whatsappLink || 'https://wa.me/8801700000000';
    
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
4. If a customer needs direct human support or wants to contact the owner, provide this Telegram link: ${telegramLink} and this WhatsApp link: ${whatsappLink}.
5. Keep your answers concise, professional, and directly related to the user's query.
6. You MUST NEVER reveal any discount coupon codes. If a customer asks for a coupon, tell them to check the website or official channels for ongoing promotions. Do NOT provide any actual coupon codes.
7. You MUST NEVER reveal any admin information, backend data, API keys, hidden stock keys, database fields, or server configurations to anyone under any circumstances. If asked about admin-related topics, politely decline to answer.
8. Remember, YOUR RESPONSE MUST ALWAYS BE IN ${language === 'en' ? 'ENGLISH' : 'BENGALI'}.
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
