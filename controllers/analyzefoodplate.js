import { KEY } from "../server.js";
import axios from "axios";

export const renderData = async (req, res) => {
  res.render("../views/foodplate.ejs", { data: null, status: "idle" }); // Default state
};

export const postData = async (req, res) => {
  try {
    const { imageUrl, language } = req.body;

    // Send initial response to indicate processing
    res.render("../views/foodplate.ejs", { data: null, status: "loading" });

    const encodedParams = new URLSearchParams();
    encodedParams.append("image", imageUrl);
    encodedParams.append("lang", language);

    const options = {
      method: "POST",
      url: "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/analyzeFoodPlate",
      headers: {
        "x-rapidapi-key": KEY,
        "x-rapidapi-host": "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: encodedParams,
    };

    // Call API
    const response = await axios.request(options);

    // Send final response with data
    res.render("foodplate.ejs", { data: response.data, status: "done" });
  } catch (error) {
    console.error(error);
    res.render("foodplate.ejs", { data: null, status: "error" });
  }
};
