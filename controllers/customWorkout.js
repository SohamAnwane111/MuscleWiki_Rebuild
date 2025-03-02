import { KEY } from "../server.js";

export const renderData = async (req, res) => {
  res.render("../views/customworkout.ejs");
};

export const postData = async (req, res) => {
  const formData = req.body;

  console.log(formData);

  // Validate required fields
  if (
    !formData.goal ||
    !formData.fitness_level ||
    !formData.schedule ||
    !formData.plan_duration_weeks ||
    !formData.lang ||
    !formData.custom_goals
  ) {
    return res.render("workout", {
      data: {
        result: {
          error:
            "Missing required fields. Please ensure all fields are filled correctly.",
        },
      },
    });
  }

  // Construct the request options for the API call
  const options = {
    method: "POST",
    url: "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/customWorkoutPlan",
    params: { noqueue: "1" },
    headers: {
      "x-rapidapi-key": KEY, // Replace with your actual API key
      "x-rapidapi-host":
        "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    data: {
      goal: formData.goal,
      fitness_level: formData.fitness_level,
      preferences: Array.isArray(formData["preferences[]"])
        ? formData["preferences[]"]
        : [formData["preferences[]"]], // Ensure preferences is an array
      health_conditions: Array.isArray(formData["health_conditions[]"])
        ? formData["health_conditions[]"]
        : [formData["health_conditions[]"]], // Ensure health_conditions is an array
      schedule: {
        days_per_week: parseInt(formData["schedule[days_per_week]"], 10),
        session_duration: parseInt(formData["schedule[session_duration]"], 10),
      },
      plan_duration_weeks: parseInt(formData.plan_duration_weeks, 10),
      custom_goals: Array.isArray(formData["custom_goals[]"])
        ? formData["custom_goals[]"]
        : [formData["custom_goals[]"]], // Ensure custom_goals is an array
      lang: formData.lang,
    },
  };

  try {
    // Making the API call
    const response = await axios.request(options);
    const workoutData = response.data;

    // Debugging: Log the API response
    console.log(workoutData);

    // Render the EJS template with the API response data
    res.render("customworkout", { data: workoutData });
  } catch (error) {
    // Log the error details for debugging
    console.error("API Call Error:", error.message);

    // Render an error message on the EJS page if the API call fails
    res.render("customworkout", {
      data: {
        result: {
          error: "Failed to fetch workout plan. Please try again later.",
        },
      },
    });
  }
};
