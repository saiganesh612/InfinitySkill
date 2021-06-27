const express = require("express")
const router = express.Router()
const User = require("../models/user")
const Report = require("../models/report")
const Contest = require("../models/contest")
const { isLoggedIn } = require("../middlewares/index")

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
            username: req.user.username, reportedOn: pname, contestName: contest.contestName, status: "under review", reason
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

module.exports = router
