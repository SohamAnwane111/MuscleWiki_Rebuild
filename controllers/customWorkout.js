import { KEY } from "../server.js";
import axios from "axios";

export const renderData = async (req, res) => {
  res.render("../views/customworkout.ejs");
};

export const postData = async (req, res) => {
  const formData = req.body;

  console.log(formData); // Debugging: Ensure formData contains expected fields

  if (
    !formData.goal ||
    !formData.fitness_level ||
    !formData.schedule ||
    !formData.plan_duration_weeks ||
    !formData.lang ||
    !formData.custom_goals || // Fixed: Checking actual key instead of "custom_goals[]"
    formData.custom_goals.length === 0 // Ensuring it's not empty
  ) {
    return res.render("customWorkout", {
      data: {
        result: {
          error: "Missing required fields. Please ensure all fields are filled correctly.",
        },
      },
    });
  }

  const options = {
    method: "POST",
    url: "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/customWorkoutPlan",
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
      preferences: Array.isArray(formData.preferences)
        ? formData.preferences
        : formData.preferences
        ? [formData.preferences]
        : [],
      health_conditions: Array.isArray(formData.health_conditions)
        ? formData.health_conditions
        : formData.health_conditions
        ? [formData.health_conditions]
        : [],
      schedule: {
        days_per_week: parseInt(
          formData.schedule?.days_per_week || formData["schedule[days_per_week]"],
          10
        ),
        session_duration: parseInt(
          formData.schedule?.session_duration || formData["schedule[session_duration]"],
          10
        ),
      },
      plan_duration_weeks: parseInt(formData.plan_duration_weeks, 10),
      custom_goals: Array.isArray(formData.custom_goals)
        ? formData.custom_goals.filter(goal => goal.trim() !== "") // Filtering empty values
        : formData.custom_goals
        ? [formData.custom_goals].filter(goal => goal.trim() !== "")
        : [],
      lang: formData.lang,
    },
  };

  try {
    const response = await axios.request(options);
    const workoutData = response.data;

    console.log(workoutData); // Debugging: Check API response

    res.render("customworkout", { data: workoutData });
  } catch (error) {
    console.error("API Call Error:", error.message);

    res.render("customworkout", {
      data: {
        result: {
          error: "Failed to fetch workout plan. Please try again later.",
        },
      },
    });
  }
};
