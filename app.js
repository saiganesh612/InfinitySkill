if (process.env.NODE_ENV !== "production") {
    require("dotenv").config()
}

const express = require("express")
const app = express()
const path = require("path")
const mongoose = require("mongoose")
const passport = require("passport")
const localStrategy = require("passport-local")
const session = require("express-session")
const flash = require("connect-flash")
const methodOverride = require("method-override")

const User = require("./models/user")

const userRoutes = require("./routes/Auth")
const infoRoutes = require("./routes/userinfo")
const contestRoutes = require("./routes/contests")
const contactRoutes = require("./routes/contact")
// Connecting to database
const dbUrl = /*process.env.DB_URL ||*/ "mongodb://localhost:27017/infiniteskill"
mongoose.connect(dbUrl, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
})

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"))

const db = mongoose.connection
db.on("error", console.error.bind(console, "Mongoose connection denied"))
db.once("open", () => {
    console.log("Mongoose connection established")
})

const secret = process.env.SECRET || "This is secret"

const sessionConfigs = {
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24,
        maxAge: 1000 * 60 * 60 * 24
    }
}

app.use(session(sessionConfigs))
app.use(flash())

// Passport configurations
app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// Preserving user data
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    next()
})

app.get("/", (req, res) => {
    res.render("index", { page: "" })
})

app.get("/about", (req, res) => {
    res.render("about", { page: "" })
})

app.get("/articles", (req, res) => {
    res.render("articles", { page: "" })
})

// app.get("/contact-form", (req, res) => {
//     res.render("contact", { page: "" })
// })

app.use(userRoutes)
app.use(infoRoutes)
app.use(contestRoutes)
app.use(contactRoutes)
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})
