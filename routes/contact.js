const express = require("express")
const router = express.Router()
const contact = require("../models/contact")
const { isLoggedIn } = require("../middlewares")



router.get("/contact-form",isLoggedIn,async(req,res)=>{
    res.render("contact", { page: ""})
})

router.post("/contact-form", isLoggedIn, async (req, res) => {
    try{
    const {name,email,phoneNumber,subject,message,queryType} = req.body;
    console.log(name)
    const ContactDetails = await new contact({
        name : name,
        email:email,
        phoneNumber:phoneNumber,
        subject:subject,
        message:message,
        queryType:queryType,
    })
    await ContactDetails.save();
    req.flash('success','Your query has been submitted succesfully.We will get back to you soon')   
    res.status(201).redirect("/contact-form")
    }catch(err){
        res.status(400).redirect("/contact-form")
    }
})

module.exports = router
