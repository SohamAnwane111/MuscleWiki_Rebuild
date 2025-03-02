import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import env from "dotenv";
import path from "path";

import { fileURLToPath } from "url";

// Define __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY = "300bd0dde6mshac26486321139dap106030jsna29950716ce2";

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;
const API_URL = "https://api.api-ninjas.com/v1/exercises";
var currentMuscle = "";
var currentIntensity = "";
var currentEquipment = null;
var currentUser;
env.config();

app.use(
  session({
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

function parseData(data) {
  const resultArray = [];

  for (const day in data) {
    if (data.hasOwnProperty(day)) {
      data[day].forEach((muscle) => {
        resultArray.push(`${day}-${muscle}`);
      });
    }
  }
  return resultArray;
}

function splitString(str) {
  var date = "";
  var text = "";
  var i = 0;
  while (i < str.length && str[i] != "#") {
    date += str[i];
    i++;
  }
  i++;
  while (i < str.length) {
    text += str[i];
    i++;
  }
  return [date, text];
}

app.get("/home", (req, res) => {
  if (currentUser) {
    res.render("home.ejs", {
      username: currentUser.name,
    });
  } else res.render("home.ejs");
});

app.get("/home/info", async (req, res) => {
  const { muscle, intensity, equipment } = req.query; // Extract query parameters

  console.log("Muscle:", muscle); // Log the received parameters
  console.log("Intensity:", intensity);
  console.log("Type:", equipment);

  try {
    // Use these query parameters in the axios request to make the API call
    const response = await axios.get(API_URL, {
      params: {
        muscle: muscle,
        difficulty: intensity,
        type: equipment,
      },
      headers: {
        "x-rapidapi-key": "78914fac3bmshf0fc97e3ac765fdp1f7d5fjsn8652559b2698",
        "x-rapidapi-host": "exercises-by-api-ninjas.p.rapidapi.com",
      },
    });

    console.log(`Data received: ${JSON.stringify(response.data)}`);

    // Pass the data to the view for rendering
    res.render("info.ejs", {
      data: response.data,
    });
  } catch (error) {
    res.status(404).send(error);
  }
});

app.get("/home/plans", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT plans FROM workouts JOIN users ON users.id = workouts.user_id WHERE users.id = $1",
      [currentUser.id]
    );
    res.render("plans.ejs", {
      data: result.rows[0],
    });
  } catch (err) {
    res.redirect("/");
    console.log(err);
  }
});

app.get("/", (req, res) => {
  res.render("signin.ejs");
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/home",
  passport.authenticate("google", {
    successRedirect: "/home",
    failureRedirect: "/",
  })
);

app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

app.get("/pr", async (req, res) => {
  try {
    const result = await db.query("SELECT id, date, exercise, weight, reps FROM prs WHERE user_id = $1", [
      currentUser.id,
    ]);

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
});


app.post("/pr", async (req, res) => {
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
    const { "pr-date": date, "pr-exercise": exercise, "pr-weight": weight, "pr-reps": reps } = req.body;

    await db.query(
      "INSERT INTO prs (user_id, date, exercise, weight, reps) VALUES ($1, $2, $3, $4, $5)",
      [currentUser.id, date, exercise, parseFloat(weight), parseInt(reps, 10)]
    );

    res.redirect("/pr");
  } catch (err) {
    console.error("Error adding PR:", err);
    res.status(500).send("Error adding PR. Please try again later.");
  }
});


// Define the POST route
app.post("/home", async (req, res) => {
  try {
    const { muscle, exercise_type, difficulty, exercise_name } = req.body;

    const params = {};
    if (muscle) params.muscle = muscle;
    if (exercise_type) params.type = exercise_type;
    if (difficulty) params.difficulty = difficulty;
    if (exercise_name) params.name = exercise_name;

    console.log("Params:", params);

    const options = {
      method: 'GET',
      url: 'https://exercises-by-api-ninjas.p.rapidapi.com/v1/exercises',
      params,
      headers: {
        'x-rapidapi-key': '78914fac3bmshf0fc97e3ac765fdp1f7d5fjsn8652559b2698',
        'x-rapidapi-host': 'exercises-by-api-ninjas.p.rapidapi.com',
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
});


app.post("/home/info", (req, res) => {
  res.redirect("/home");
});

app.post("/home/plans", async (req, res) => {
  const data = parseData(req.body);
  try {
    await db.query("delete from workouts where user_id = $1", [currentUser.id]);

    try {
      await db.query(
        "INSERT INTO workouts (user_id, plans) VALUES ($1, $2::text[])",
        [currentUser.id, data]
      );
      res.redirect("/home/plans");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/signup", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
            [email, hash, name]
          );
          const user = result.rows[0];
          currentUser = user;
          req.login(user, (err) => {
            res.redirect("/home");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/",
  })
);

passport.use(
  new Strategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async function (email, password, done) {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          email,
        ]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const storedHashedPassword = user.password;
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              console.error("Error comparing passwords:", err);
              return done(err);
            } else {
              if (valid) {
                currentUser = user;
                return done(null, user);
              } else {
                return done(null, false, { message: "Incorrect password." });
              }
            }
          });
        } else {
          console.log("User not found");
          return done(null, false, { message: "User not found." });
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/home",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(profile);
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password, name) VALUES ($1, $2, $3)",
            [profile.email, "google", profile.given_name]
          );
          currentUser = newUser;
          return cb(null, newUser.rows[0]);
        } else {
          currentUser = result.rows[0];
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

app.get("/workoutplan", (req, res) => {
  res.render("workout.ejs");
});

app.post("/workoutplan", async (req, res) => {
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
});

app.get("/nutrition", (req, res) => {
  res.render("nutrition.ejs");
});

app.post("/nutritionplan", async (req, res) => {
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
});

app.get("/analyzefoodplate", (req, res) => {
  res.render("foodplate.ejs");
});

app.post('/analyzefoodplate', async (req, res) => {
  try {
    // Extract form data
    const { imageUrl, language } = req.body;

    // Prepare the API request
    const encodedParams = new URLSearchParams();
    encodedParams.append('image', imageUrl); // Assuming API requires the image URL
    encodedParams.append('lang', language);

    const options = {
      method: 'POST',
      url: 'https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/analyzeFoodPlate',
      headers: {
        'x-rapidapi-key': KEY,
        'x-rapidapi-host': 'ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: encodedParams,
    };

    // Make the API call
    const response = await axios.request(options);

    // Log the API response
    console.log(response.data);

    // Render the results on the page
    res.render('foodplate.ejs', { data: response.data });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while processing your request.');
  }
});

app.get('/customworkout', (req, res) => {
  res.render('customworkout.ejs');
});

app.post("/customworkout", async (req, res) => {
  const formData = req.body;

  console.log(formData);

  // Validate required fields
  if (!formData.goal || !formData.fitness_level || !formData.schedule || !formData.plan_duration_weeks || !formData.lang || !formData.custom_goals) {
    return res.render("workout", {
      data: {
        result: {
          error: "Missing required fields. Please ensure all fields are filled correctly."
        }
      }
    });
  }

  // Construct the request options for the API call
  const options = {
    method: "POST",
    url: 'https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/customWorkoutPlan',
    params: { noqueue: '1' },
    headers: {
      'x-rapidapi-key': KEY,  // Replace with your actual API key
      'x-rapidapi-host': 'ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com',
      'Content-Type': 'application/json',
    },
    data: {
      goal: formData.goal,
      fitness_level: formData.fitness_level,
      preferences: Array.isArray(formData["preferences[]"]) ? formData["preferences[]"] : [formData["preferences[]"]], // Ensure preferences is an array
      health_conditions: Array.isArray(formData["health_conditions[]"]) ? formData["health_conditions[]"] : [formData["health_conditions[]"]], // Ensure health_conditions is an array
      schedule: {
        days_per_week: parseInt(formData["schedule[days_per_week]"], 10),
        session_duration: parseInt(formData["schedule[session_duration]"], 10),
      },
      plan_duration_weeks: parseInt(formData.plan_duration_weeks, 10),
      custom_goals: Array.isArray(formData["custom_goals[]"]) ? formData["custom_goals[]"] : [formData["custom_goals[]"]], // Ensure custom_goals is an array
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
          error: "Failed to fetch workout plan. Please try again later."
        }
      }
    });
  }
});

app.get("/learnExercise", (req, res) => {
  res.render("learnExercise.ejs");
});

app.post("/learnExercise", async (req, res) => {
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
});



passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// hii bro