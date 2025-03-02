import { KEY, currentUser } from "../server.js";
import axios from "axios";

export const renderData = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT plans FROM workouts JOIN users ON users.id = workouts.user_id WHERE users.id = $1",
      [currentUser.id]
    );
    res.render("../views/plans.ejs", {
      data: result.rows[0],
    });
  } catch (err) {
    res.redirect("/");
    console.log(err);
  }
};

export const postData = async (req, res) => {
  const data = parseData(req.body);
  try {
    await db.query("delete from workouts where user_id = $1", [currentUser.id]);

    try {
      await db.query(
        "INSERT INTO workouts (user_id, plans) VALUES ($1, $2::text[])",
        [currentUser.id, data]
      );
      res.redirect("/home/plans");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
}
