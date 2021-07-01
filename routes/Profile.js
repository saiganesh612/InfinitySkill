const express = require("express")
const router = express.Router()
const { isLoggedIn } = require("../middlewares/index")
const Profile = require("../models/profile")

router.get("/create-profile", isLoggedIn, async (req, res) => {
    res.render("userInfo/Profile/CreateProfile",{page:""})
})

router.post("/create-profile",isLoggedIn, async(req,res)=>{
    try{
    const {fullName,mobileNumber,Skills,LinkedInURL,descripton} = req.body;
    const profileDetails = new Profile({
        fullName,mobileNumber,Skills,LinkedInURL,descripton
    })
    // profileDetails.profilePhoto = { url: req.files[0].path, filename: req.files[0].filename }
    await profileDetails.save()
    console.log("pROFILE",profileDetails);
    }catch(err){
        console.log(err)
    }
    
})
module.exports = router