import { KEY } from "../server.js";

export const renderData = async (req, res) => {
  res.render("../views/nutrition.ejs");
};

export const postData = async (req, res) => {
    const formData = req.body;
  
    const options = {
      method: "POST",
      url: "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/nutritionAdvice",
      params: { noqueue: "1" },
      headers: {
        "x-rapidapi-key": KEY,
        "x-rapidapi-host":
          "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com",
        "Content-Type": "application/json",
      },
      data: {
        goal: formData.goal,
        dietary_restrictions: Array.isArray(formData["dietary_restrictions[]"])
          ? formData["dietary_restrictions[]"]
          : [formData["dietary_restrictions[]"]], // Ensure array
        current_weight: parseFloat(formData.current_weight),
        target_weight: parseFloat(formData.target_weight),
        daily_activity_level: formData.daily_activity_level,
        lang: formData.lang,
      },
    };
  
    try {
      const response = await axios.request(options);
      const nutritionData = response.data;
  
      // console.log(formData); // Log the API response for debugging
  
      // Render the EJS template with the nutrition data
      res.render("nutrition", { data: nutritionData });
    } catch (error) {
      console.error(error.message);
  
      // Pass error message to the EJS template
      res.render("nutrition", {
        data: {
          result: {
            error: "Failed to fetch nutrition plan. Please try again later.",
          },
        },
      });
    }
  };
