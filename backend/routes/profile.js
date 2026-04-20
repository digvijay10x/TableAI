const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");
const authenticate = require("../middleware/auth");

// Get user profile + role
router.get("/me", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Get taste profile (customer)
router.get("/taste", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("taste_profile")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch taste profile" });
  }
});

// Update avoided tags
router.put("/taste", authenticate, async (req, res) => {
  const { avoided_tags } = req.body;

  try {
    const { data, error } = await supabase
      .from("taste_profile")
      .update({ avoided_tags: avoided_tags || [] })
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update taste profile" });
  }
});

// Get restaurant info for the logged-in owner
router.get("/my-restaurant", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", req.user.id)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch restaurant" });
  }
});

// Update restaurant info
router.put("/my-restaurant", authenticate, async (req, res) => {
  const { name, description } = req.body;

  try {
    const { data, error } = await supabase
      .from("restaurants")
      .update({ name, description })
      .eq("owner_id", req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: "Failed to update restaurant" });
  }
});

module.exports = router;
