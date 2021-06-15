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

router.get("/list-of-participants", isLoggedIn, async (req, res) => {
    try {
        const participants = []
        const { id } = req.query

        const contest = await Contest.findOne({ _id: { $eq: id } })

        const users = await User.find({ _id: { $in: contest.peopleParticipated } })
        users.forEach(user => {
            let participant = user.participatedContest.filter(contest => contest.contestId === id)[0]
            participants.push({ participant, user: user.username })
        })

        res.render("contests/participants", { page: " ", participants })
    } catch (err) {
        res.redirect(`/contest/${id}`)
    }
})

router.get("/participants", isLoggedIn, async (req, res) => {
    try {
        const { contestId } = req.query
        const { username, _id } = req.user
        const user = await User.findOne({ _id: { $eq: _id } })
        if (!user) throw "You don't have access to participate in this contest"

        const contest = await Contest.findOne({ _id: { $eq: contestId } })
        if (!contest) throw "Their is no contest of this type..."

        if (contest.owner === username) throw "Contest creators can't able to participant in their own contest"

        const present = contest.peopleParticipated.find(person => person.equals(_id))
        if (present) throw "You already participating in this contest"

        contest.peopleParticipated.push(user)
        user.participatedContest.unshift({ contestId })
        await contest.save()
        await user.save()
        res.redirect(`/list-of-participants?id=${contestId}`)
    } catch (err) {
        req.flash("error", err)
        res.redirect("back")
    }
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
