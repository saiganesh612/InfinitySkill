const express = require("express")
const app = express()
const path = require("path")

const userRoutes = require("./routes/Auth")

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.use(userRoutes)

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})
