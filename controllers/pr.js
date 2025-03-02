import { db, currentUser } from "../server.js";

export const renderPr = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, date, exercise, weight, reps FROM prs WHERE user_id = $1",
      [currentUser.id]
    );

    if (result.rows.length > 0) {
      const arrayOfObjects = result.rows.map((row) => ({
        id: row.id,
        date: row.date,
        exercise: row.exercise,
        weight: row.weight,
        reps: row.reps,
      }));

      console.log(arrayOfObjects);

      res.render("pr.ejs", { data: arrayOfObjects });
    } else {
      res.render("pr.ejs", { data: [] });
    }
  } catch (err) {
    console.error("Error fetching PRs:", err);
    res.status(500).send("Error fetching PRs. Please try again later.");
  }
};

export const createPr = async (req, res) => {
  if (req.body.toDelete) {
    try {
      const prId = parseInt(req.body.toDelete, 10);

      await db.query("DELETE FROM prs WHERE id = $1 AND user_id = $2", [
        prId,
        currentUser.id,
      ]);

      res.redirect("/pr");
    } catch (err) {
      console.error("Error deleting PR:", err);
      res.status(500).send("Error deleting PR. Please try again later.");
    }
    return;
  }

  try {
    const {
      "pr-date": date,
      "pr-exercise": exercise,
      "pr-weight": weight,
      "pr-reps": reps,
    } = req.body;

    await db.query(
      "INSERT INTO prs (user_id, date, exercise, weight, reps) VALUES ($1, $2, $3, $4, $5)",
      [currentUser.id, date, exercise, parseFloat(weight), parseInt(reps, 10)]
    );

    res.redirect("/pr");
  } catch (err) {
    console.error("Error adding PR:", err);
    res.status(500).send("Error adding PR. Please try again later.");
  }
};
