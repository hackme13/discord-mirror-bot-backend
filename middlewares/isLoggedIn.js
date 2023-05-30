import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config()

export default async function isLoggedIn(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = { email: decodedToken.email, userId: decodedToken.userId };
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
