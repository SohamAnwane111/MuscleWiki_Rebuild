import { db } from "../server.js";

export const renderPr = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect("/");
    }

    const result = await db.query(
      "SELECT id, date, exercise, weight, reps FROM prs WHERE user_id = $1",
      [req.user.id]
    );

    res.render("pr.ejs", { data: result.rows });
  } catch (err) {
    console.error("Error fetching PRs:", err);
    res.status(500).send("Error fetching PRs. Please try again later.");
  }
};

export const createPr = async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }

  try {
    if (req.body.toDelete) {
      const prId = parseInt(req.body.toDelete, 10);
      await db.query("DELETE FROM prs WHERE id = $1 AND user_id = $2", [prId, req.user.id]);
      return res.redirect("/pr");
    }

    const { "pr-date": date, "pr-exercise": exercise, "pr-weight": weight, "pr-reps": reps } = req.body;

    await db.query(
      "INSERT INTO prs (user_id, date, exercise, weight, reps) VALUES ($1, $2, $3, $4, $5)",
      [req.user.id, date, exercise, parseFloat(weight), parseInt(reps, 10)]
    );

    res.redirect("/pr");
  } catch (err) {
    console.error("Error processing PR request:", err);
    res.status(500).send("Something went wrong. Please try again.");
  }
};
