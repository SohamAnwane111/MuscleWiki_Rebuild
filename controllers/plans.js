import { KEY, db } from "../server.js";
import axios from "axios";
import parseData from "../utils/parser.js";

export const renderData = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT plans FROM workouts WHERE user_id = $1",
      [req.user.id]
    );
    res.render("../views/plans.ejs", {
      data: result.rows.length > 0 ? result.rows[0] : null,
    });
  } catch (err) {
    res.redirect("/");
    console.error("Error fetching workout plans:", err);
  }
};

export const postData = async (req, res) => {
  const data = parseData(req.body);
  try {
    await db.query("DELETE FROM workouts WHERE user_id = $1", [req.user.id]);

    try {
      await db.query(
        "INSERT INTO workouts (user_id, plans) VALUES ($1, $2::text[])",
        [req.user.id, data]
      );
      res.redirect("/home/plans");
    } catch (err) {
      console.error("Error inserting workout plans:", err);
    }
  } catch (err) {
    console.error("Error deleting previous workout plans:", err);
  }
};
