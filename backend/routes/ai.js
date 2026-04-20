const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const supabase = require("../supabaseClient");
const authenticate = require("../middleware/auth");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are TableAI, a smart and friendly food ordering assistant. Your job is to help customers find and order food from available restaurants.

When a user describes what they want, you must:
1. Parse their natural language request to understand: cuisine preference, budget, calorie range, veg/non-veg preference, specific cravings, allergens or ingredients to avoid.
2. Search through the provided menu catalog and filter items that match.
3. Rank the top 3-5 best matches based on how well they fit the request.
4. For each recommendation, explain WHY you picked it in plain English.
5. Show the price, calories, restaurant name, and tags for each recommendation.
6. Ask the user if they want to order any of these items.

When the user confirms an order (says "yes", "order it", "I'll take the first one", etc.), respond with a JSON block in this exact format:
ORDER_CONFIRMED:{"items":[{"menu_item_id":"<id>","name":"<name>","price":<price>,"quantity":1,"restaurant_id":"<restaurant_id>"}]}

Important rules:
- Always be conversational and helpful, not robotic.
- If the request is vague, ask one clarifying question at most, then recommend anyway.
- Respect the user's taste profile — prefer dishes matching their preferred tags and avoid their avoided tags.
- If budget is mentioned, never recommend items above that budget.
- Prices are in Indian Rupees (INR).
- Never use emojis in your responses.
- Keep responses concise but informative.
- If no items match, say so honestly and suggest alternatives.`;

// SSE streaming chat endpoint
router.post("/chat", authenticate, async (req, res) => {
  const { message, conversationHistory } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    // Fetch full menu catalog
    const { data: catalog } = await supabase
      .from("menu_items")
      .select("*, restaurants(name)")
      .eq("is_available", true);

    // Fetch user's taste profile
    const { data: tasteProfile } = await supabase
      .from("taste_profile")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    // Build the catalog string for the AI
    const catalogString = catalog
      .map(
        (item) =>
          `[ID:${item.id}] ${item.name} - ${item.restaurants?.name} | Rs.${item.price} | ${item.calories} cal | ${item.is_veg ? "Veg" : "Non-Veg"} | Tags: ${item.tags?.join(", ")} | Restaurant ID: ${item.restaurant_id}`,
      )
      .join("\n");

    const tasteString = tasteProfile
      ? `User's taste profile: Preferred tags: ${tasteProfile.preferred_tags?.join(", ") || "none"} | Avoided tags: ${tasteProfile.avoided_tags?.join(", ") || "none"} | Average budget: Rs.${tasteProfile.avg_budget} | Total past orders: ${tasteProfile.total_orders}`
      : "No taste profile available yet.";

    // Build messages array
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "system",
        content: `AVAILABLE MENU CATALOG:\n${catalogString}\n\n${tasteString}`,
      },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      // Keep last 10 messages for context
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);
    }

    // Add current user message
    messages.push({ role: "user", content: message });

    // Stream from Groq
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1024,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    // Send done signal
    res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
    res.end();
  } catch (err) {
    console.error("AI chat error:", err);
    res.write(
      `data: ${JSON.stringify({ error: "Failed to get AI response" })}\n\n`,
    );
    res.end();
  }
});

module.exports = router;
