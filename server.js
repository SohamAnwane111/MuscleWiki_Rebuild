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
import nodemailer from "nodemailer";

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
const KEY = "75ee6a9346msh1f2b05505e012bcp1996a0jsnaf4364262d34";

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

// 🔹 Setup Nodemailer for email notifications
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔹 Function to send login email with updated template
async function sendLoginEmail(email, name) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "🚀 New Login Alert - Your Account",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #007bff;">Hello, ${name}!</h2>
          <p style="font-size: 16px;">You have successfully logged into your MuscleWiki account.</p>
          <p style="color: red; font-weight: bold;">If this wasn't you, please reset your password immediately.</p>
          <p style="font-size: 14px;">For any issues, contact our support team.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">This is an automated email, please do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Login email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Error sending email: ${error}`);
  }
}

app.use(
  session({
    store: new (pgSession(session))({
      pool: db,
      tableName: "session",
      createTableIfMissing: true,
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

app.use((req, res, next) => {
  if (req.session.passport && req.session.passport.user) {
    db.query("SELECT * FROM users WHERE id = $1", [req.session.passport.user])
      .then((result) => {
        req.user = result.rows[0];
        next();
      })
      .catch((err) => next());
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

// 🔹 Google OAuth Authentication
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

// 🔹 Local Login
app.post(
  "/",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/",
  })
);

// 🔹 Local Authentication Strategy (Email/Password)
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
          bcrypt.compare(password, user.password, async (err, valid) => {
            if (err) return done(err);
            if (valid) {
              await sendLoginEmail(user.email, user.name);
              return done(null, user);
            }
            return done(null, false, { message: "Incorrect password." });
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

// 🔹 Google Authentication Strategy
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

        let user;
        if (result.rows.length === 0) {
          const newUser = await db.query(
            "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *",
            [profile.email, "google", profile.given_name]
          );
          user = newUser.rows[0];
        } else {
          user = result.rows[0];
        }

        await sendLoginEmail(user.email, user.name);
        return cb(null, user);
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
  console.log(`🚀 Server running at http://localhost:${port}`);
});

export { db };
export { KEY };
