import { KEY, currentUser } from "../server.js";
import axios from "axios";

export const renderHome = async (req, res) => {
  if (currentUser) {
    res.render("home.ejs", {
      username: currentUser.name,
    });
  } else res.render("home.ejs");
};

export const postData = async (req, res) => {
  try {
    const { muscle, exercise_type, difficulty, exercise_name } = req.body;

    const params = {};
    if (muscle) params.muscle = muscle;
    if (exercise_type) params.type = exercise_type;
    if (difficulty) params.difficulty = difficulty;
    if (exercise_name) params.name = exercise_name;

    console.log("Params:", params);

    const options = {
      method: "GET",
      url: "https://exercises-by-api-ninjas.p.rapidapi.com/v1/exercises",
      params,
      headers: {
        "x-rapidapi-key": "78914fac3bmshf0fc97e3ac765fdp1f7d5fjsn8652559b2698",
        "x-rapidapi-host": "exercises-by-api-ninjas.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);

    // Pass the data to the template
    res.render("home", { exercises: response.data });
  } catch (error) {
    console.error("Error fetching exercises:", error.message);

    // Pass an empty array and render the template with a user-friendly message
    res.render("home", { exercises: [] });
  }
};
