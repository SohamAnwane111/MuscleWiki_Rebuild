import { KEY } from "../server.js";

export const renderData = async (req, res) => {
  res.render("../views/workout.ejs");
};

export const postData = async (req, res) => {
  const formData = req.body;

  const options = {
    method: "POST",
    url: "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/generateWorkoutPlan",
    params: { noqueue: "1" },
    headers: {
      "x-rapidapi-key": KEY,
      "x-rapidapi-host":
        "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    data: {
      goal: formData.goal,
      fitness_level: formData.fitness_level,
      preferences: Array.isArray(formData["preferences[]"])
        ? formData["preferences[]"]
        : [formData["preferences[]"]], // Ensure array
      health_conditions: Array.isArray(formData["health_conditions[]"])
        ? formData["health_conditions[]"]
        : [formData["health_conditions[]"]], // Ensure array
      schedule: {
        days_per_week: parseInt(formData["schedule[days_per_week]"], 10),
        session_duration: parseInt(formData["schedule[session_duration]"], 10),
      },
      plan_duration_weeks: parseInt(formData.plan_duration_weeks, 10),
      lang: formData.lang,
    },
  };

  try {
    const response = await axios.request(options);
    const workoutData = response.data;

    console.log(workoutData); // Log the API response for debugging

    // Render the EJS template with the workout data
    res.render("workout", { data: workoutData });
  } catch (error) {
    console.error(error.message);

    // Pass error message to the EJS template
    res.render("workout", {
      data: {
        result: {
          error: "Failed to fetch workout plan. Please try again later.",
        },
      },
    });
  }
};
