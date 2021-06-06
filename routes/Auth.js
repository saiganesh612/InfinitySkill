const express = require("express")
const router = express.Router();

router.get("/login", (req, res) => {
    res.render("Auth/login", { page: "login" })
})

router.get("/signup", (req, res) => {
    res.render("Auth/signup", { page: "signup" })
})

module.exports = router
