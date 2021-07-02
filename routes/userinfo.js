const express = require("express")
const router = express.Router()
const User = require("../models/user")
const Contest = require("../models/contest")
const Payment = require("../models/payment")
const Profile = require("../models/profile")
const multer = require("multer")
const { storage } = require("../cloudinary")
const upload = multer({ storage })
const { isLoggedIn } = require("../middlewares")
const { sortBy } = require("async")
const ReportedIssue = require("../models/report")
global.fetch = require("node-fetch"); 


router.get("/home?", isLoggedIn, async (req, res) => {
    const contestsLen = await Contest.find({
        $and: [{ isApproved: { $eq: true }, $or: [{ $and: [{ mode: "free", payment_status: "paid" }] }, { $and: [{ mode: "paid", payment_status: "paid" }] }] }]
    })
    let TotalContests = contestsLen.length;
    let {page,size,search,category, status,type,popularity, prize} = req.query;
    if(!page) page=1;
    if(!size) size=10;
    TotalContests =Math.ceil(TotalContests/size);
    const limit = parseInt(size)
    const skip = (page-1)*size;
    let contests = await Contest.find({
        $and: [{ isApproved: { $eq: true }, $or: [{ $and: [{ mode: "free", payment_status: "paid" }] }, { $and: [{ mode: "paid", payment_status: "paid" }] }] }]
    }).limit(limit).skip(skip)
    console.log(search)
    if(search){
     contests = await Contest.find({ $and: [{ isApproved: { $eq: true }, $or: [{ $and: [{ mode: "free", payment_status: "paid" }] }, { $and: [{ mode: "paid", payment_status: "paid" }] }] },{contestName: { $regex: search, $options: "$i" }}]}).limit(limit).skip(skip)
    }
    if(category){
     contests = await Contest.find({ $and: [{ isApproved: { $eq: true }, $or: [{ $and: [{ mode: "free", payment_status: "paid" }] }, { $and: [{ mode: "paid", payment_status: "paid" }] }] },{ category: { $eq: category } }]}).limit(limit).skip(skip) 
    }
    if(status){
        const dateObj = new Date();
        let month = dateObj.getUTCMonth() + 1; //months from 1-12
        const day = dateObj.getUTCDate();
        const year = dateObj.getUTCFullYear();
        month = month >= 10 ? month : `0${month}`
        today = `${year}-${month}-${day}`
        today = String(today)
        if (status === "Ongoing") {
            contests = await Contest.find({ $and: [{ isApproved: { $eq: true }, $or: [{ $and: [{ mode: "free", payment_status: "paid" }] }, { $and: [{ mode: "paid", payment_status: "paid" }] }] },{ $and: [{ endDate: { "$gte": today } }, { startDate: { "$lte": today } }] }]}).limit(limit).skip(skip) 
        } else if (status === "Upcoming") {
            contests = await Contest.find({ $and: [{ isApproved: { $eq: true }, $or: [{ $and: [{ mode: "free", payment_status: "paid" }] }, { $and: [{ mode: "paid", payment_status: "paid" }] }] },{ startDate: { "$gt": today } }]}).limit(limit).skip(skip)
        } else if (status === "completed") {
            contests = await Contest.find({ $and: [{ isApproved: { $eq: true }, $or: [{ $and: [{ mode: "free", payment_status: "paid" }] }, { $and: [{ mode: "paid", payment_status: "paid" }] }] },{ endDate: { "$lt": today } }]}).limit(limit).skip(skip)
        } else if (status == "voting") {
            contests = await Contest.find({ $and: [{ isApproved: { $eq: true }, $or: [{ $and: [{ mode: "free", payment_status: "paid" }] }, { $and: [{ mode: "paid", payment_status: "paid" }] }] },{ $and: [{ votingEnd: { "$gte": today } }, { votingStart: { "$lte": today } }] }]}).limit(limit).skip(skip)
        }
    }
    if(type){
        if (type == 'free') {
            contests = await Contest.find({ $and: [{ isApproved: { $eq: true }, $or: [{ $and: [{ mode: "free", payment_status: "paid" }] }, { $and: [{ mode: "paid", payment_status: "paid" }] }] },{ entryFee: { $eq: 0 } }]}).limit(limit).skip(skip)
        } else {
            contests = await Contest.find({ $and: [{ isApproved: { $eq: true }, $or: [{ $and: [{ mode: "free", payment_status: "paid" }] }, { $and: [{ mode: "paid", payment_status: "paid" }] }] },{ entryFee: { $gt: 0 } }]}).limit(limit).skip(skip)
        }
    }
    if(popularity){
        if (popularity == "asc") {
            contests = contestsLen.sort((a, b) => Number(b.peopleParticipated.length) - Number(a.peopleParticipated.length));
        } else {
            contests = contestsLen.sort((a, b) => Number(a.peopleParticipated.length) - Number(b.peopleParticipated.length));
        }  
    }
    if(prize){
        if (prize == "asc") {
            contests = contestsLen.sort((a, b) => Number(b.prizeMoney) - Number(a.prizeMoney));
        } else {
            contests = contestsLen.sort((a, b) => Number(a.prizeMoney) - Number(b.prizeMoney));
        } 
    }
    res.render("home", { page: "", contests: contests.reverse(),TotalContests })
})


router.get("/home", isLoggedIn, async (req, res) => {
    try {
        const filters = req.query;
        const filteredContests = Contest.filter(contestName => {
            let isValid = true;
            for (key in filters) {
                console.log(key, contestName[key], filters[key]);
                isValid = isValid && contestName[key] == filters[key];
            }
            return isValid;
        });
        console.log(filteredContests)
    } catch (err) {
    }
})


router.get("/dashboard", isLoggedIn, async (req, res) => {
    try {
        const { postedContests, participatedContest } = req.user;
        const postedCont = await Contest.find({ _id: { $in: postedContests } })
        let participatedCont = participatedContest.map(contest => (Contest.findOne({ _id: { $eq: contest.contestId } })))
        participatedCont = await Promise.all(participatedCont)
        
        const paymentDetails = await Payment.find({ status: { $eq: "requested" } })
        let payments = paymentDetails.map(async payment => {
            const { contestName } = await Contest.findOne({ _id: { $eq: payment.contestId } })
            return { payment, cName: contestName }
        })
        payments = await Promise.all(payments)
        const ReportedIssues = await ReportedIssue.find({ status: { $eq: "under review" } })
        const profileData = await Profile.find({username:{$eq:req.user.username}});
        res.render("userInfo/sidebar", { page: "sidebar", postedCont, participatedCont, payments,ReportedIssues,profileData })
    } catch (err) {
        console.log(err);
        res.redirect("/home?");
    }
})

router.get("/post-contest", isLoggedIn, (req, res) => {
    res.render("userInfo/PostContest", { page: "" })
})

router.post("/post-contest", isLoggedIn, upload.any(), async (req, res) => {
    try {
        const { contestName, motive, rules, startDate, endDate, votingStart,
            votingEnd, WinnerDate, description, category, subCategory, prizeMoney, entryFee
        } = req.body
        const { username, isEmailVerified } = req.user;
        if (!isEmailVerified) throw "U need to verify your email to perform this action.";
        const user = await User.findOne({ username: { $eq: username } })
        const newContest = new Contest({
            owner: username,
            contestName, motive, rules, startDate, endDate, votingStart, votingEnd, WinnerDate,
            description, category, subCategory, prizeMoney, entryFee
        })

        if (entryFee > 0) newContest.mode = "paid"

        newContest.coverPhoto = { url: req.files[0].path, filename: req.files[0].filename }
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

// create profile
router.get("/Profile", isLoggedIn, async (req, res) => {
    const details = await User.find({ username: { $eq: req.query.user } })
    const ContestDetails = details[0].participatedContest.map(async (contest) => {
        const Data = await Contest.findOne({ "_id": { "$eq": contest.contestId } });
        return Data;
    })
    var ContestData = await Promise.all(ContestDetails);
    details[0].profile = await Profile.find({username:{$eq:req.query.user}})
    res.render("userInfo/Profile/Profile", { page: " ", details, ContestData })
})

// update profile
router.get("/update-profileData", isLoggedIn , async(req,res)=>{
    const details = await Profile.find({username:{$eq:req.user.username}});
    res.render("userInfo/Profile/UpdateProfile2", { page: " ", details })
})

router.put("/update-profileData",isLoggedIn,async(req,res)=>{
    try{
    const {fullName,mobileNumber,Skills,LinkedInURL,descripton} = req.body;
    await Profile.findOneAndUpdate({username:{$eq:req.user.username} },{fullName,mobileNumber,Skills,LinkedInURL,descripton })
    req.flash("success", "Changes saved successfully")
    res.redirect("/dashboard")
    }catch(err){
        req.flash("error", "Oho no, somethng went wrong")
        res.redirect("/update-profileData")
    }
})

// update username and email
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