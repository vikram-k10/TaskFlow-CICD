import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 401 = not logged in. Loads the user from the database on every request.
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(401).json({ error: "Account no longer exists" });

    req.userId = String(user._id);
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth lookup failed:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
}
