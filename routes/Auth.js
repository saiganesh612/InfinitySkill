const express = require("express")
const router = express.Router();
const User = require("../models/user")
const passport = require("passport")
const { transporter, sender } = require("../settings")
const cryto = require("crypto")

router.get("/login", (req, res) => {
    res.render("Auth/login", { page: "login" })
})
router.get("/newPassword", (req, res) => {
    res.render("Auth/ForgetPwd", { page: "ForgetPwd" })
})

router.post("/login", passport.authenticate('local', {
    failureRedirect: "/login"
}), (req, res) => {
    console.log("U logged in")
    res.redirect("/home")
})

router.get("/signup", (req, res) => {
    res.render("Auth/signup", { page: "signup" })
})

router.post("/signup", async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body
        const emailToken = cryto.randomBytes(64).toString("hex")
        if (password !== confirmPassword) throw "Password misspelled..."
        const user = new User({ username, email, emailToken })
        const newUser = await User.register(user, password)

        const body = `Hello, Thanks for registering on our site.
            Please click the below link to verify your account.
            http://${req.headers.host}/verify-email/${newUser.emailToken}
        `

        mailOptions = {
            from: sender,
            to: newUser.email,
            subject: "Email verification",
            text: body
        };

        transporter.sendMail(mailOptions, err => {
            if (err) return console.log("error occured", err)
            return console.log('mail sent');
        });
        console.log(newUser)
        res.redirect("/")
    } catch (err) {
        console.log(err)
        res.redirect("/signup")
    }
})

router.get("/verify-email/:id", async (req, res) => {
    try {
        const user = await User.findOneAndUpdate({ emailToken: { $eq: req.params.id } }, { emailToken: null, isEmailVerified: true })
        console.log(user)
        console.log("email verified...")
        req.login(user, err => {
            if (err) throw "Failed to authenticate"
            console.log("logged in")
            res.redirect("/")
        })
    } catch (err) {
        console.log(err)
        res.redirect("/")
    }
})

router.get("/logout", (req, res) => {
    req.logout()
    console.log("U logged out...")
    res.redirect("/")
})

module.exports = router
