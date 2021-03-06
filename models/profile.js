const mongoose = require("mongoose")

const profileschema = new mongoose.Schema({
    fullName: String,
    mobileNumber: String,
    Skills: String,
    LinkedInURL: String,
    designation: String,
    gitHub:String,
    profilePhoto:{
        url: String,
        filename: String
    },
    username:String
})

module.exports = mongoose.model("Profile", profileschema)
