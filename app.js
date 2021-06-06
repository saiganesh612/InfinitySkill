const express = require("express")
const app = express()
const path = require("path")
const mongoose = require("mongoose")
const passport = require("passport")
const localStrategy = require("passport-local")
const session = require("express-session")

const User = require("./models/user")

const userRoutes = require("./routes/Auth")

// Connecting to database
const dbUrl = "mongodb://localhost:27017/infiniteskill"
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

// Passport configurations
app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get("/", (req, res) => {
    res.render("home", { page: "" })
})

app.get("/about", (req, res) => {
    res.render("about", { page: "" })
})

app.get("/articles", (req, res) => {
    res.render("articles", { page: "" })
})

app.get("/contact-form", (req, res) => {
    res.render("contact", { page: "" })
})
app.get("/home",(req,res)=>{
    res.render("home2", { page: "" })
})
app.use(userRoutes)

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})
