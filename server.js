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
import pgSession from "connect-pg-simple";

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY = "300bd0dde6mshac26486321139dap106030jsna29950716ce2";

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;
const API_URL = "https://api.api-ninjas.com/v1/exercises";
env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(
  session({
    store: new (pgSession(session))({
      pool: db,
      tableName: "session",
      createTableIfMissing: true, // This will create the table if it doesn't exist
    }),
    secret: "TOPSECRETWORD",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);


app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to ensure req.user is always set if session exists
app.use((req, res, next) => {
  if (req.session.passport && req.session.passport.user) {
    db.query("SELECT * FROM users WHERE id = $1", [req.session.passport.user])
      .then(result => {
        req.user = result.rows[0];
        next();
      })
      .catch(err => next());
  } else {
    next();
  }
});

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
    async (email, password, done) => {
      try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length > 0) {
          const user = result.rows[0];
          bcrypt.compare(password, user.password, (err, valid) => {
            if (err) return done(err);
            return valid ? done(null, user) : done(null, false, { message: "Incorrect password." });
          });
        } else {
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
        const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.email]);
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
            [profile.email, "google", profile.given_name]
          );
          return cb(null, newUser.rows[0]);
        } else {
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => cb(null, user.id));

passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    cb(null, result.rows[0]);
  } catch (err) {
    cb(err);
  }
});

app.listen(port, () => {
  console.log(`Listening on url http://localhost:${port}`);
});

export { db };
export { KEY };