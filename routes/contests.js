const express = require("express")
const router = express.Router();
const User = require("../models/user")
const Contest = require("../models/contest")
const { transporter, sender } = require("../settings")
const { isLoggedIn, isAdmin } = require("../middlewares")

router.get("/contest/:id", isLoggedIn, async (req, res) => {
    const contest = await Contest.findById(req.params.id)
    res.render("contests/contest", { page: "Contest", contest })
})

router.get("/requested-contests", isLoggedIn, isAdmin, async (req, res) => {
    try {
        const requestedContests = await Contest.find({ isApproved: { $eq: false } })
        res.render("contests/requested", { page: "", requestedContests })
    } catch (err) {
        console.log(err)
        res.redirect("/home")
    }
})

router.get("/approved-contests", isLoggedIn, isAdmin, async (req, res) => {
    try {
        const approvedContests = await Contest.find({ isApproved: { $eq: true } })
        res.render("contests/approved", { page: "", approvedContests: approvedContests.reverse() })
    } catch (err) {
        console.log(err)
        res.redirect("/home")
    }
})

router.get("/approve/:id", isLoggedIn, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const contest = await Contest.findByIdAndUpdate(id, { isApproved: true })
        const user = await User.findOne({ username: { $eq: contest.owner } })

        const body = `
            Hey ${contest.owner},
            Admin reviewed your ${contest.contestName} contest and was approved by the admin.
            Now, you can proceed with the contest.
        `

        const mailOptions = {
            from: sender,
            to: user.email,
            subject: `Status of ${contest.contestName} contest.`,
            text: body
        }

        transporter.sendMail(mailOptions, err => {
            if (err) return console.log("error occured", err)
            return console.log('mail sent');
        })

        res.redirect("/requested-contests")
    } catch (err) {
        console.log(err)
        res.redirect("/requested-contests")
    }
})

module.exports = router
