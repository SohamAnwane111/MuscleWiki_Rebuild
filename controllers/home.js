import { KEY } from "../server.js";
import axios from "axios";

export const renderHome = async (req, res) => {
  res.render("home.ejs", {
    username: req.user ? req.user.name : null,
  });
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
        "x-rapidapi-key": KEY,
        "x-rapidapi-host": "exercises-by-api-ninjas.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);
    res.render("home", { exercises: response.data });
  } catch (error) {
    console.error("Error fetching exercises:", error.message);
    res.render("home", { exercises: [] });
  }
};
