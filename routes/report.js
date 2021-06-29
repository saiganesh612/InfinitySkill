const express = require("express")
const router = express.Router()
const User = require("../models/user")
const Report = require("../models/report")
const Contest = require("../models/contest")
const { isLoggedIn } = require("../middlewares/index")
const { transporter, sender } = require("../settings")

router.post("/report", isLoggedIn, async (req, res) => {
    const { contestId, pname, reason } = req.body
    try {
        const user = await User.findOne({ username: { $eq: pname } })
        if (!user) throw "Their is no user with the given name. Please check the spelling and try again."

        const contest = await Contest.findOne({ _id: { $eq: contestId } })
        if (!contest) throw "Their is no contest with this reference ID."

        const present = contest.peopleParticipated.find(id => id.equals(user._id))
        if (!present) throw "Their is no participant with this name in this contest. Please check the spelling and try again."

        const report = new Report({
            username: req.user.username, reportedOn: pname, contestName: contest.contestName, contestId,
            status: "under review", reason
        })
        await report.save()

        req.flash("success", "You report is under progress.")
        res.redirect(`/list-of-participants?id=${contestId}`)
    } catch (err) {
        err = err ? err : "Something went wrong"
        req.flash("error", err)
        res.redirect(`/list-of-participants?id=${contestId}`)
    }
})

router.post("/approve-report", isLoggedIn, async (req, res) => {
    const { id, username, reportedOn } = req.body
    try {
        // Remove contest from user
        const user = await User.findOne({ username: { $eq: reportedOn } })
        const contests = user.participatedContest.filter(obj => obj.contestId !== id)
        user.participatedContest = contests
        await user.save()

        // Remove participant from contest
        const contest = await Contest.findOne({ _id: { $eq: id } })
        const participants = contest.peopleParticipated.filter(pid => !pid.equals(user._id))
        contest.peopleParticipated = participants
        await contest.save()

        await Report.findOneAndUpdate({ username: { $eq: username }, reportedOn: { $eq: reportedOn }, contestId: { $eq: id } }, { status: "Approved" })

        const body = `
            Hey ${user.username},
            Some of your fellow participants in ${contest.contestName} contest pointed that your submission contains some bad content.
            So, they reported on you. Admin made background check-up and found the same issue. So, admin removed you from that contest.
            Now, your are no longer a participant for that contest. We, hope not to repeat this from next time.
        `

        const mailOptions = {
            from: sender,
            to: user.email,
            subject: "Report on your work submission.",
            text: body
        }

        transporter.sendMail(mailOptions, err => {
            if (err) return console.log("error occured", err)
            console.log('mail sent');
            res.status(200).json({ message: "Approved" })
        })
    } catch (err) {
        res.status(200).json({ message: "Can't able to update the status. Try after sometime" })
    }
})

router.post("/reject-report", isLoggedIn, async (req, res) => {
    try {
        const { id, username, reportedOn, contestName } = req.body
        await Report.findOneAndUpdate({ username: { $eq: username }, reportedOn: { $eq: reportedOn }, contestId: { $eq: id } }, { status: "Rejected" })

        const user = await User.findOne({ username: { $eq: username } })

        const body = `
            Hey ${user.username},
            In ${contestName} contest, you reported on ${reportedOn} participant. Admin, went through background check-up and found nothing serious.
            So, Admin rejected your report. Anyway thanks for trying to make our platform a better place.
        `

        const mailOptions = {
            from: sender,
            to: user.email,
            subject: "Report status that you made.",
            text: body
        }

        transporter.sendMail(mailOptions, err => {
            if (err) return console.log("error occured", err)
            console.log('mail sent');
            res.status(200).json({ message: "Rejected" })
        })
    } catch (err) {
        res.status(200).json({ message: "Can't able to update the status. Try after sometime" })
    }
})

module.exports = router
