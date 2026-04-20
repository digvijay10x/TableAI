const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const authenticate = require("../middleware/auth");

// Get all menu items (public — for AI to query full catalog)
router.get("/catalog", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*, restaurants(name)")
      .eq("is_available", true);

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch catalog" });
  }
});

// Get menu items for a specific restaurant
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", req.params.restaurantId);

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// Get menu for the logged-in restaurant owner
router.get("/my-menu", authenticate, async (req, res) => {
  try {
    // First get the restaurant owned by this user
    const { data: restaurant, error: restError } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", req.user.id)
      .single();

    if (restError || !restaurant) {
      return res
        .status(404)
        .json({ error: "No restaurant found for this user" });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ restaurant_id: restaurant.id, items: data });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch menu" });
  }
});

// Add a menu item (restaurant owner)
router.post("/", authenticate, async (req, res) => {
  const { restaurant_id, name, description, price, calories, tags, is_veg } =
    req.body;

  if (!restaurant_id || !name || !price) {
    return res
      .status(400)
      .json({ error: "restaurant_id, name, and price are required" });
  }

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        restaurant_id,
        name,
        description: description || "",
        price,
        calories: calories || null,
        tags: tags || [],
        is_veg: is_veg !== undefined ? is_veg : true,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to add menu item" });
  }
});

// Update a menu item
router.put("/:id", authenticate, async (req, res) => {
  const { name, description, price, calories, tags, is_veg, is_available } =
    req.body;

  try {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price;
    if (calories !== undefined) updates.calories = calories;
    if (tags !== undefined) updates.tags = tags;
    if (is_veg !== undefined) updates.is_veg = is_veg;
    if (is_available !== undefined) updates.is_available = is_available;

    const { data, error } = await supabase
      .from("menu_items")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update menu item" });
  }
});

// Delete a menu item
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.json({ message: "Item deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete menu item" });
  }
});

module.exports = router;
