const express = require("express")
const router = express.Router()
const Contest = require("../models/contest")
const User = require("../models/user")

router.get("/dashboard", async (req, res) => {
    try {
        const { postedContests, participatedContest } = req.user;
        let postedCont = postedContests.map(id => (Contest.findById(id)))
        let participatedCont = participatedContest.map(id => (Contest.findById(id)))
        postedCont = await Promise.all(postedCont)
        participatedCont = await Promise.all(participatedCont)
        res.render("userInfo/sidebar", { page: "sidebar", postedCont, participatedCont })
    } catch (err) {
        console.log(err);
        res.redirect("/home");
    }
})

router.get("/post-contest", (req, res) => {
    res.render("userInfo/PostContest", { page: "" })
})

router.post("/post-contest", async (req, res) => {
    try {
        const { contestName, motive, startDate, endDate, description, category, subCategory, prizeMoney, entryFee } = req.body
        const { username, isEmailVerified } = req.user;
        if (!isEmailVerified) throw "U need to verify your email to perform this action.";
        const user = await User.findOne({ username: { $eq: username } })
        const newContest = new Contest({
            owner: username,
            contestName, motive, startDate, endDate, description, category, subCategory, prizeMoney, entryFee
        })
        await newContest.save()
        user.postedContests.unshift(newContest)
        await user.save()
        res.redirect("/dashboard")
    } catch (err) {
        console.log(err)
        res.redirect("/post-contest")
    }
})

module.exports = router
