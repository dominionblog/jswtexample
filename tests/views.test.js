let chai = require("chai")
let chaiHttp = require("chai-http")
chai.use(chaiHttp)
let jsdom = require("jsdom")
let {JSDOM} = jsdom
let app = require("../app")
let $ = require("jquery")
let agent = chai.request.agent(app).keepOpen()
let mongoose = require('mongoose')
let User = require("../models/user")
let {expect} = chai

describe("Tests for the index view", () => {
    before("connect to the DB", done => {
        mongoose.connect(process.env.MONGODBURI).then(_ => {
            done()
        }).catch(err => {
            done(err)
        })
    })
    before("drop DB", done => {
        mongoose.connection.dropCollection('users').then(_ => {
            done()
        }).catch(err => {
            if (err.code = 26) {
                done()
            } else {
                done(err)
            }
        })
    })
    it("shows the default views when the user is not logged in", () => {
        agent.get("/")
        .then(res => {
            let dom = new JSDOM(res.text)
            expect(dom.window.document.querySelector("body").innerHTML.includes("Welcome to a JWT example project!")).to.be.true
            expect(dom.window.document.querySelector("form.create-account-div h3").innerHTML.includes("Create an Account")).to.be.true
            expect(dom.window.document.querySelector("form.create-account-div .username").getAttribute("name") == "username").to.be.true
            expect(dom.window.document.querySelector("form.create-account-div .password").getAttribute("name") == "password").to.be.true
            done()
        })
    })
    let account = {
            username: "bob",
            password:"hey"
    }
    it("registers and logs in", done => {
        agent.post("/auth/register")
        .type('form')
        .send(account)
        .then(res => {
            agent.post("/auth/login")
            .type("form")
            .send(account)
            .then(res => {
                done()
            }).catch(err => {
                done(err)
            })
        }).catch(err => {
            done(err)
        })
    })
    it("tests the views with the user being logged in", done => {
        agent.get("/users/view/all")
        .then(async res => {
            let userDB = await User.findOne({username: account.username})
            let dom = new JSDOM(res.text);
            expect(dom.window.document.querySelector(".table-responsive").innerHTML.includes(account.username)).to.be.true
            expect(dom.window.document.querySelector(".row-" + userDB.get('id') + " form").getAttribute('action')).to.be.equal("/users/delete/" + userDB.get('id')+ "?_method=DELETE")
            expect(dom.window.document.querySelector(".row-" + userDB.get('id') + " .view-btn").getAttribute('href')).to.be.equal("/users/view/" + userDB.get('id'))
            expect(dom.window.document.querySelector(".username-header").innerHTML).to.include(userDB.get('username'))
            done()
        }).catch(err => {
            done(err)
        })
    })
})