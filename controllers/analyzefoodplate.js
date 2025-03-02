import { KEY } from "../server.js";

export const renderData = async (req, res) => {
  res.render("../views/foodplate.ejs");
};

export const postData = async (req, res) => {
  try {
    // Extract form data
    const { imageUrl, language } = req.body;

    // Prepare the API request
    const encodedParams = new URLSearchParams();
    encodedParams.append("image", imageUrl); // Assuming API requires the image URL
    encodedParams.append("lang", language);

    const options = {
      method: "POST",
      url: "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/analyzeFoodPlate",
      headers: {
        "x-rapidapi-key": KEY,
        "x-rapidapi-host":
          "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: encodedParams,
    };

    // Make the API call
    const response = await axios.request(options);

    // Log the API response
    console.log(response.data);

    // Render the results on the page
    res.render("foodplate.ejs", { data: response.data });
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing your request.");
  }
};
