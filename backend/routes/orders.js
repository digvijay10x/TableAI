const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const authenticate = require("../middleware/auth");

// Place an order (customer)
router.post("/", authenticate, async (req, res) => {
  const { restaurant_id, items } = req.body;
  // items = [{ menu_item_id, quantity, price }]

  if (!restaurant_id || !items || !items.length) {
    return res
      .status(400)
      .json({ error: "restaurant_id and items are required" });
  }

  try {
    const total_amount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: req.user.id,
        restaurant_id,
        total_amount,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) return res.status(400).json({ error: orderError.message });

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price_at_order: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) return res.status(400).json({ error: itemsError.message });

    // Update taste profile
    await updateTasteProfile(req.user.id, items, total_amount);

    return res.status(201).json(order);
  } catch (err) {
    return res.status(500).json({ error: "Failed to place order" });
  }
});

// Get customer's orders
router.get("/my-orders", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, restaurants(name), order_items(*, menu_items(name, price))")
      .eq("customer_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get restaurant's incoming orders
router.get("/restaurant-orders", authenticate, async (req, res) => {
  try {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", req.user.id)
      .single();

    if (!restaurant) {
      return res.status(404).json({ error: "No restaurant found" });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*, users(email), order_items(*, menu_items(name))")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Update order status (restaurant owner)
router.put("/:id/status", authenticate, async (req, res) => {
  const { status } = req.body;

  if (!["pending", "preparing", "ready", "delivered"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update order status" });
  }
});

// Helper: Update taste profile after order
async function updateTasteProfile(userId, items, totalAmount) {
  try {
    // Get current taste profile
    const { data: profile } = await supabase
      .from("taste_profile")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!profile) return;

    // Get tags from ordered items
    const menuItemIds = items.map((i) => i.menu_item_id);
    const { data: menuItems } = await supabase
      .from("menu_items")
      .select("tags")
      .in("id", menuItemIds);

    const newTags = menuItems?.flatMap((item) => item.tags) || [];
    const existingTags = profile.preferred_tags || [];

    // Merge tags (add new ones, keep unique)
    const mergedTags = [...new Set([...existingTags, ...newTags])];

    // Calculate new average budget
    const newTotalOrders = profile.total_orders + 1;
    const newAvgBudget =
      (profile.avg_budget * profile.total_orders + totalAmount) /
      newTotalOrders;

    await supabase
      .from("taste_profile")
      .update({
        preferred_tags: mergedTags,
        avg_budget: Math.round(newAvgBudget * 100) / 100,
        total_orders: newTotalOrders,
      })
      .eq("user_id", userId);
  } catch (err) {
    console.error("Failed to update taste profile:", err);
  }
}

module.exports = router;
