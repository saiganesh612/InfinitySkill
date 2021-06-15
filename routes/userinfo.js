const express = require("express")
const router = express.Router()
const Contest = require("../models/contest")
const User = require("../models/user")
const multer = require("multer")
const { storage } = require("../cloudinary")
const upload = multer({ storage })
const { isLoggedIn } = require("../middlewares")

router.get("/home", isLoggedIn, async (req, res) => {
    const contests = await Contest.find({ isApproved: { $eq: true } })
    res.render("home", { page: "", contests })
})

router.get("/sort", isLoggedIn, async (req, res) => {
    try {
        const { category } = req.query
        const contests = await Contest.find({ category: { $eq: category } })
        res.render("home", { page: "", contests })
    } catch (err) {
        console.log(err)
        res.redirect("/")
    }
})

router.get("/dashboard", isLoggedIn, async (req, res) => {
    try {
        const { postedContests, participatedContest } = req.user;
        let postedCont = postedContests.map(id => (Contest.findById(id)))
        let participatedCont = participatedContest.map(contest => (Contest.findOne({ _id: { $eq: contest.contestId } })))
        postedCont = await Promise.all(postedCont)
        participatedCont = await Promise.all(participatedCont)
        res.render("userInfo/sidebar", { page: "sidebar", postedCont, participatedCont })
    } catch (err) {
        console.log(err);
        res.redirect("/home");
    }
})

router.get("/post-contest", isLoggedIn, (req, res) => {
    res.render("userInfo/PostContest", { page: "" })
})

router.post("/post-contest", isLoggedIn, upload.any(), async (req, res) => {
    try {
        const { contestName, motive, startDate, endDate, votingStart,
            votingEnd, WinnerDate, description, category, subCategory, prizeMoney, entryFee
        } = req.body
        const { username, isEmailVerified } = req.user;
        if (!isEmailVerified) throw "U need to verify your email to perform this action.";
        const user = await User.findOne({ username: { $eq: username } })
        const newContest = new Contest({
            owner: username,
            contestName, motive, startDate, endDate, votingStart, votingEnd, WinnerDate,
            description, category, subCategory, prizeMoney, entryFee
        })
        newContest.coverPhoto = { url: req.files[0].path, filename: req.files[0].filename }
        newContest.rules = { url: req.files[1].path, filename: req.files[1].filename }
        await newContest.save()
        user.postedContests.unshift(newContest)
        await user.save()
        req.flash("success", "Thanks for posting a contest. Once this was reviewed by admin the contest will be seen by public.")
        res.redirect("/dashboard")
    } catch (err) {
        req.flash("error", err)
        res.redirect("/post-contest")
    }
})

router.get("/update-profile", isLoggedIn, (req, res) => {
    res.render("userInfo/UpdateProfile", { page: "" })
})

router.put("/update-profile", isLoggedIn, async (req, res) => {
    try {
        const { username, email } = req.body
        await User.findOneAndUpdate({ _id: { $eq: req.user._id } }, { username, email })
        req.flash("success", "Changes saved successfully")
        res.redirect("/update-profile")
    } catch (err) {
        req.flash("error", "Oho no, somethng went wrong")
        res.redirect("/update-profile")
    }
})

module.exports = router
