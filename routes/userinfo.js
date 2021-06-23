const express = require("express")
const router = express.Router()
const Contest = require("../models/contest")
const User = require("../models/user")
const multer = require("multer")
const { storage } = require("../cloudinary")
const upload = multer({ storage })
const { isLoggedIn } = require("../middlewares")
const { sortBy } = require("async")

router.get("/home", isLoggedIn, async (req, res) => {
    var url;
    const contests = await Contest.find({ isApproved: { $eq: true } })
    res.render("home", { page: "", contests: contests.reverse(),url})
})

router.get("/search",isLoggedIn,async (req,res)=>{
    try{
    const searchField = req.query.contestName;
    console.log("searver side",searchField);
    const contests = await  Contest.find({ contestName :{$regex: searchField ,$options:"$i" } })
    res.render("home", { page: "", contests: contests.reverse() })
    }catch(err){
        console.log(err)
        res.redirect("/home") 
    }
})

router.get("/sort", isLoggedIn, async (req, res) => {
    try {
        const { category } = req.query
        const contests = await Contest.find({ category: { $eq: category } })
        res.render("home", { page: "", contests })
    } catch (err) {
        console.log(err)
        res.redirect("/home")
    }
})

router.get("/filter", isLoggedIn, async (req, res) => {
    try {
       const { status } = req.query
       const dateObj = new Date();
       let month = dateObj.getUTCMonth() + 1; //months from 1-12
       const day = dateObj.getUTCDate();
       const year = dateObj.getUTCFullYear();
       month = month >= 10 ? month : `0${month}`
       today = `${year}-${month}-${day}`
       today = String(today)
        if(status==="Ongoing"){
            var contests = await Contest.find({ $and: [ {endDate: { "$gte": today}},{startDate :{"$lte": today}} ] })
            //start<=today<=end
       }else if(status==="Upcoming"){
           var contests = await Contest.find( { startDate: {"$gt":today} } )
           //startdate > today
       }else if(status==="completed"){
           var contests = await Contest.find( {  endDate: {"$lt":today} } )
           //end date > today
       }else if(status=="voting"){
           var contests = await Contest.find({ $and: [ {votingEnd: { "$gte": today}},{votingStart :{"$lte": today}} ] })
       }
        res.render("home", { page: " ",contests})
    } catch (err) {
        console.log(err)
        res.redirect("/home")
    }
})

router.get("/classify",isLoggedIn,async(req,res)=>{
    try{
         const {type} = req.query;
         if(type == 'free'){
            var contests = await Contest.find({entryFee :{$eq: 0}})
         }else{
            var contests = await Contest.find({entryFee :{$gt: 0}})
            console.log(contests)
         }
         res.render("home", { page: "", contests : contests.reverse() })
    }catch(err){
        res.redirect("/home")
    }
})

router.get("/class",isLoggedIn,async(req,res)=>{
    try{
        const {popularity} = req.query;
        var ans = await Contest.find()
        if(popularity=="asc"){
            var contests=ans.sort((a, b) => Number(a.peopleParticipated.length ) - Number(b.peopleParticipated.length));
        }else{
            var contests=ans.sort((a, b) => Number(b.peopleParticipated.length ) - Number(a.peopleParticipated.length)); 
        }
        res.render("home", { page: "", contests })
    }catch(err){
        console.log("EROR")
        res.redirect("/home")
    } 
})


router.get("/organise",isLoggedIn,async(req,res)=>{
    try{
        const {prize} = req.query;
        var ans = await Contest.find()
        var ans = await Contest.find()
        if(prize=="asc"){
            var contests=ans.sort((a, b) => Number(a.prizeMoney) - Number(b.prizeMoney));
        }else{
            var contests=ans.sort((a, b) => (b.prizeMoney) - (a.prizeMoney)); 
        }
        res.render("home", { page: "", contests })
    }catch(err){
        console.log("EROR")
        res.redirect("/home")
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
