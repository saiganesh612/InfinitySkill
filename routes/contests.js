const express = require("express")
const router = express.Router();
const User = require("../models/user")
const Contest = require("../models/contest")
const { transporter, sender } = require("../settings")
const { isLoggedIn, isAdmin } = require("../middlewares")
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)

router.get("/contest/:id", isLoggedIn, async (req, res) => {
    const contest = await Contest.findById(req.params.id)
    res.render("contests/contest", { page: "Contest", contest, stripePublicKey: process.env.STRIPE_PUBLIC_KEY })
})

router.get("/list-of-participants", isLoggedIn, async (req, res) => {
    try {
        const participants = []
        const { id } = req.query
        const { votes } = req.user

        const contest = await Contest.findOne({ _id: { $eq: id } })
        const users = await User.find({ _id: { $in: contest.peopleParticipated } })

        const match = votes.filter(vote => vote.contestId === id)

        users.forEach(user => {
            let participant = user.participatedContest.filter(contest => contest.contestId === id)[0]
            if (match.length) {
                let style = match[0].voteList.findIndex(ele => ele.pName === user.username)
                if (style !== -1) participants.push({ participant, user: user.username, voted: true })
                else participants.push({ participant, user: user.username, voted: false })
            }
            else participants.push({ participant, user: user.username, voted: false })
        })
        res.render("contests/participants", { page: " ", participants, contest })
    } catch (err) {
        res.redirect(`/contest/${id}`)
    }
})

router.post("/validate-data", isLoggedIn, async (req, res) => {
    try {
        const { id, email, user, contestId } = req.body
        const { username, _id } = req.user
        const userInfo = await User.findOne({ username: { $eq: user }, email: { $eq: email } })
        if (!userInfo) throw "Enter email that was registered by current account. we didn't cut the money."

        const contest = await Contest.findOne({ _id: { $eq: contestId } })
        if (!contest) throw "Their contest was not registered. Please aware of frauds. we didn't cut the money."

        if (contest.owner === username) throw "Contest creators can't able to participant in their own contest. we didn't cut the money."

        const present = contest.peopleParticipated.find(person => person.equals(_id))
        if (present) throw "You already participating in this contest. we didn't cut the money."

        const response = await stripe.charges.create({
            amount: contest.entryFee * 100,
            source: id,
            currency: 'INR'
        })

        if (response.status !== "succeeded" || !response.paid) throw "Can't able to charge your card. we didn't cut the money."

        contest.peopleParticipated.push(userInfo)
        userInfo.participatedContest.unshift({ contestId })
        await contest.save()
        await userInfo.save()
        res.status(200).json({ message: "Payment successful" })
    } catch (err) {
        console.log(err)
        res.status(200).json({ message: err })
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

router.post("/contest/:id/submitWork", isLoggedIn, async (req, res) => {
    try {
        const { workLink } = req.body
        const { id } = req.params

        const supportedLinkFormat = "https://drive.google.com/"
        const accessPermission = "usp=sharing"
        if (!workLink.includes(supportedLinkFormat) || !workLink.includes(accessPermission))
            throw "This link is not supported. Please keep your drive link with access permissions."

        const user = await User.findOne({ _id: { $eq: req.user._id } })
        if (!user) throw "You don't have access to submit work"

        const contest = user.participatedContest.filter(contest => contest.contestId === id)

        if (contest.length === 0) throw "You don't have access to submit your work, because you are not participating in this contest."

        contest[0].workSubmitted = workLink
        await user.save()
        res.redirect(`/list-of-participants?id=${id}`)
    } catch (err) {
        req.flash("error", err)
        res.redirect("back")
    }

})

router.post("/manage-votes/:id", async (req, res) => {
    try {
        const { id } = req.params
        const { cun, pts } = req.body

        const user = await User.findOne({ username: { $eq: req.user.username } })
        const cuser = await User.findOne({ username: { $eq: cun } })

        const voteData = user.votes.filter(ele => ele.contestId === id)

        // Dealing with votes
        if (voteData.length && (voteData[0].voteList.findIndex(vote => vote.pName === cun) !== -1))
            throw "You already made a vote to this member."

        if (!voteData.length) user.votes.push({ contestId: id, voteList: [{ isVoted: true, pName: cun }] })
        else {
            const vi = user.votes.findIndex(ele => ele.contestId === id)
            user.votes[vi].voteList.push({ isVoted: true, pName: cun })
        }

        // Updating the data
        const index = cuser.participatedContest.findIndex(contest => contest.contestId === id)
        cuser.participatedContest[index].points = parseInt(pts)

        await user.save()
        await cuser.save()
        res.status(200).json({ message: "Updated" })
    } catch (err) {
        res.status(400).json({ message: err })
    }
})

module.exports = router
