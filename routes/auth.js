let express = require('express')
let router = express.Router()
let User = require("../models/user")
let jwt = require("jsonwebtoken")
let crypto = require('crypto')
let dotenv = require("dotenv")
let queryString = require("query-string")
if (process.env.NODE_ENV != 'production') {
    dotenv.config()
}

router.post("/login", async (req, res) => {
    let passHash = crypto.createHash(process.env.CRYPTOALGO)
    // Check if the user exists
    let user = await User.findOne({username: req.body.username})
    if (!user) {
        res.status(401)
        res.render("index",{err: "No user exists with that username", success: null})
    }
    // Check if password is correct
    if (passHash.update(req.body.password).digest('hex') != user.get('password')) {
        res.status(401)
        res.render("index", {err: "This password is incorrect", success: null})
    }
    // Create and sign the JWT
    res.cookie(process.env.AUTHCOOKIENAME,jwt.sign({
        username: user.get('username'),
        id: user.get("id")
    },process.env.SECRET, {expiresIn: "3h"}))
    // Redirect the user to the right page
    res.redirect("/users/view/all")
})

router.get("/logout", (req, res) => {
    // Expire the cookie
    res.clearCookie(process.env.AUTHCOOKIENAME)
    // Redirect the user
    let params = {
        success: "You have successfully logged out."
    }
    res.redirect("/?" + queryString.stringify(params))
})

router.post("/register", async (req, res) => {
    try {
        // Does the username already exist? (this is very annoying to put in other parts of the code)
        if ((await  User.find({username: req.body.username})).length > 0) {
            throw Error("username-taken")
        }
        // Save the user
        await User.create({
            username: req.body.username,
            password: req.body.password
        })
        res.render("index",{err: null, success: "You have successfully created an account. Please log in using these same credentials"})
    } catch(err) {
        if (err.name == 'ValidationError') {
            let errorFields = Object.keys(err.errors)
            let errorString = errorFields.join(", ")
            res.status(400)
            return res.render("index",{err: "Please fill the following fields: " + errorString, success: null})
        }
        if (err.message == "username-taken") {
            res.status(400)
            return res.render("index",{err: "Username has already been taken.", success: null})
        }
        if (err.message == "bad-password") {
            res.status(400)
            return res.render("index",{err: "The password you have inputted does not respect the criteria", success: null})
        }
        if (err.message == "bad-username") {
            res.status(400)
            return res.render("index",{err: "The username you have inputted does not respect the criteria", success: null})
        }
        res.status(500)
        res.end()
    }
})

router.put("/updatepassword/:id", async (req, res) => {
    let user = await User.findById({_id: req.params.id})
    user.set('password',req.body.password)
    user.save().then(_ => { // Must use update as save will run the hook
        let params = queryString.stringify({
            err: null,
            success: "You have updated the user's password successfully."
        })
        res.redirect("/users/view/" + req.params.id + "?" + params)
    }).catch(err => {
        if (err.name == 'ValidationError' || err.message == "bad-password") {
            let params = {
                err: "The password you have inputted does not respect the criteria", 
                success: null
            }
            return res.redirect("/users/view/" + req.params.id + "?" + params)
        }
        let params = {
            err: "An unknown error occured and the password could not be changed", 
            success: null
        }
        return res.redirect("/users/view/" + req.params.id + "?" + queryString.stringify(params))
    })
})

module.exports = router