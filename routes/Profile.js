const express = require("express")
const router = express.Router()
const { isLoggedIn } = require("../middlewares/index")
const Profile = require("../models/profile")
const multer = require("multer")
const { storage } = require("../cloudinary")
const upload = multer({ storage })
const User = require("../models/user")
const Contest = require("../models/contest")



router.get("/create-profile", isLoggedIn, async (req, res) => {
    res.render("userInfo/Profile/CreateProfile",{page:""})
})

router.post("/create-profile",isLoggedIn,upload.any(), async(req,res)=>{
    try{
    const {fullName,mobileNumber,Skills,LinkedInURL,descripton} = req.body;
    const profileDetails = new Profile({
        fullName,mobileNumber,Skills,LinkedInURL,descripton
    })
     profileDetails.profilePhoto = { url: req.files[0].path, filename: req.files[0].filename }
     profileDetails.username = req.user.username;
    await profileDetails.save()
    req.flash("success", "Your profile is succesfully created")
    res.redirect("/home?")
    }catch(err){
        console.log(err)
    }  
})

router.get("/Profile", isLoggedIn, async (req, res) => {
    const Details = await User.find({ username: { $eq: req.query.user } })
    // Details.profile = await Profile.find({username:{$eq:req.query.user}})
    const ContestDetails = Details[0].participatedContest.map(async (contest) => {
        const Data = await Contest.findOne({ "_id": { "$eq": contest.contestId } });
        return Data;
    })
    var ContestData = await Promise.all(ContestDetails);
    res.render("userInfo/Profile/Profile", { page: " ", Details, ContestData })
})

module.exports = router