import { db } from "../server.js";
import bcrypt from "bcrypt";
import passport from "passport";

const saltRounds = 10;

export const renderForm = async (req, res) => {
  res.render("../views/signup.ejs");
};

export const fillInformation = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      return res.send("Email already exists. Try logging in.");
    }

    const hash = await bcrypt.hash(password, saltRounds);
    
    const result = await db.query(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
      [email, hash, name]
    );

    const user = result.rows[0];

    req.login(user, (err) => {
      if (err) {
        console.error("Error logging in new user:", err);
        return res.redirect("/signup");
      }
      res.redirect("/home");
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("An error occurred. Please try again later.");
  }
};
