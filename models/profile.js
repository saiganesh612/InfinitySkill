const mongoose = require("mongoose")

const profileschema = new mongoose.Schema({
    fullName: String,
    mobileNumber: String,
    Skills: String,
    LinkedInURL: String,
    descripton: String,
    profilePhoto:{
        url: String,
        filename: String
    }
})

module.exports = mongoose.model("Profile", profileschema)
