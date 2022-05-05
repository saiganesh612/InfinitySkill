const express = require("express")
const router = express.Router()
const { isLoggedIn } = require("../middlewares/index")
const Profile = require("../models/profile")
const multer = require("multer")
const { storage, rekognition, generateParams, deleteImage } = require("../cloudinary")
const upload = multer({ storage })
const User = require("../models/user")
const Contest = require("../models/contest")

router.get("/create-profile", isLoggedIn, async (req, res) => {
    res.render("userInfo/Profile/CreateProfile", { page: "" })
})

router.post("/create-profile", isLoggedIn, upload.any(), async (req, res) => {
    try {
        const params = generateParams(req.files[0].key)
        rekognition.detectModerationLabels(params, async (err, data) => {
            if(err || data.ModerationLabels.length !== 0) {
                await deleteImage(req.files[0].key)
                req.flash("error", "Your Image contains inappropritate content.")
                res.redirect("/dashboard")
            }
            else {
                const { fullName, mobileNumber, Skills, LinkedInURL, gitHub, designation } = req.body;
                const profileDetails = new Profile({
                    fullName, mobileNumber, Skills, LinkedInURL, gitHub, designation
                })
                profileDetails.profilePhoto = { url: req.files[0].location, filename: req.files[0].key }
                profileDetails.username = req.user.username;
                await profileDetails.save()
                req.flash("success", "Your profile is succesfully created")
                res.redirect("/dashboard")
            }
        })
    } catch (err) {
        req.flash("error", err)
        res.redirect("/dashboard")
    }
})

module.exports = router
