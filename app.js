let express = require('express')
let mongoose = require('mongoose')
let methodOverride = require("method-override")
let dotenv = require("dotenv")
let path = require('path')
let bodyParser = require('body-parser')
let app = express()
let cookieParser = require("cookie-parser")
let processRedirect = require('./global_functions/processRedirect')

if (process.env.NODE_ENV != 'production') {
    dotenv.config()
}

mongoose.connect(process.env.MONGODBURI).then(_ => {
    console.log("DB Connected!")
}).catch(err => {
    console.log("databse connection failed", err)
})

let auth = require("./routes/auth.js")
let users = require("./routes/users")

let authenticate = require("./middleware/authenticate")

app.set("view engine","ejs")

app.use(express.static(path.join(__dirname,"public")))
app.use("/module",express.static(path.join(__dirname,"node_modules")))
app.use(bodyParser.urlencoded({extended: true}))
app.use(methodOverride('_method'))
app.use(cookieParser())
app.use("/auth", auth)
app.use("/users", authenticate, users)
app.use("/", (req, res) => {
    if (req.cookies.auth) {
        return res.redirect("/users/view/all") // User is already logged in
    }
    processRedirect(req)
    res.render('index',req.query)
})

module.exports = app