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

import { signInRoute } from "./routers/signin.js";
import { signUpRoute } from "./routers/signup.js";
import { contactRoute } from "./routers/contact.js";
import { prRoute } from "./routers/pr.js";
import { workoutPlanRoute } from "./routers/workoutplan.js";
import { nutritionalRoute } from "./routers/nutrition.js";
import { analyzeFoodPlateRoute } from "./routers/analyzefoodplate.js";
import { customWorkoutRoute } from "./routers/customWorkout.js";
import { learnExerciseRoute } from "./routers/learnExercise.js";
import { homeRoute } from "./routers/home.js";
import { plansRoute } from "./routers/plans.js";

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

// app.get("/home", (req, res) => {
//   if (currentUser) {
//     res.render("home.ejs", {
//       username: currentUser.name,
//     });
//   } else res.render("home.ejs");
// });

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

// app.get("/home/plans", async (req, res) => {
//   try {
//     const result = await db.query(
//       "SELECT plans FROM workouts JOIN users ON users.id = workouts.user_id WHERE users.id = $1",
//       [currentUser.id]
//     );
//     res.render("plans.ejs", {
//       data: result.rows[0],
//     });
//   } catch (err) {
//     res.redirect("/");
//     console.log(err);
//   }
// });


app.use("/", signInRoute);
app.use("/signup", signUpRoute);
app.use("/contact", contactRoute);
app.use("/pr", prRoute);
app.use("/workoutplan", workoutPlanRoute);
app.use("/nutrition", nutritionalRoute);
app.use("/analyzefoodplate", analyzeFoodPlateRoute);
app.use("/customworkout", customWorkoutRoute);
app.use("/learnExercise", learnExerciseRoute);
app.use("/home", homeRoute);
app.use("/home/plans", plansRoute);

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

app.post("/home/info", (req, res) => {
  res.redirect("/home");
});

// app.post("/home/plans", async (req, res) => {
//   const data = parseData(req.body);
//   try {
//     await db.query("delete from workouts where user_id = $1", [currentUser.id]);

//     try {
//       await db.query(
//         "INSERT INTO workouts (user_id, plans) VALUES ($1, $2::text[])",
//         [currentUser.id, data]
//       );
//       res.redirect("/home/plans");
//     } catch (err) {
//       console.log(err);
//     }
//   } catch (err) {
//     console.log(err);
//   }
// });

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

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

export {db as db};
export {currentUser as currentUser};
export {KEY as KEY};

// end