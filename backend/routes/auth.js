const express = require("express");
const router = express.Router();
const supabase = require("../supabaseClient");

// Sign up
router.post("/signup", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ error: "Email, password, and role are required" });
  }

  if (!["customer", "restaurant"].includes(role)) {
    return res
      .status(400)
      .json({ error: "Role must be customer or restaurant" });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "Signup failed" });
    }

    // Insert into our users table
    const { error: userError } = await supabase
      .from("users")
      .insert({ id: userId, email, role });

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    // If customer, create empty taste profile
    if (role === "customer") {
      await supabase.from("taste_profile").insert({ user_id: userId });
    }

    // If restaurant, create a default restaurant entry
    if (role === "restaurant") {
      await supabase
        .from("restaurants")
        .insert({
          owner_id: userId,
          name: `${email.split("@")[0]}'s Restaurant`,
        });
    }

    return res.status(201).json({
      message: "Signup successful",
      user: authData.user,
      session: authData.session,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error during signup" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get user role from our users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (userError) {
      return res.status(400).json({ error: "User record not found" });
    }

    return res.json({
      user: data.user,
      session: data.session,
      role: userData.role,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error during login" });
  }
});

module.exports = router;
