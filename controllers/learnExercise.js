import { KEY } from "../server.js";
import axios from "axios";

export const renderData = async (req, res) => {
  res.render("../views/learnExercise.ejs");
};

export const postData = async (req, res) =>{
    const { exercise_name, lang } = req.body;
  
    console.log(req.body);
  
    // Prepare API request
    const options = {
      method: "POST",
      url: "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/exerciseDetails",
      params: { noqueue: "1" },
      headers: {
        "x-rapidapi-key": KEY,
        "x-rapidapi-host": "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      data: {
        exercise_name,
        lang: lang || "en", // Default to English if not provided
      },
    };
  
    try {
      const response = await axios.request(options); // Call the API
      const data = response.data; // Extract the response data
  
      console.log(data);
  
      // Render the EJS file with the API response and the input values
      res.render("learnExercise", { data, input: exercise_name });
    } catch (error) {
      console.error(error);
  
      // Handle API errors and render the page with an error message
      res.render("learnExercise", { data: null, input: exercise_name, error: "Unable to fetch exercise data. Please try again." });
    }
  }