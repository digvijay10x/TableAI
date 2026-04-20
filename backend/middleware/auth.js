const supabase = require("../supabaseClient");

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = authenticate;
