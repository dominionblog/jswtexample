let chai = require('chai');
let {assert, expect} = chai
let chaiHtpp = require('chai-http')
let chaiAsPromised = require('chai-as-promised')
let app = require("../app")
let dotenv = require('dotenv')
dotenv.config()
let crypto = require('crypto')

chai.use(chaiHtpp)
chai.use(chaiAsPromised)

let agent = chai.request.agent(app).keepOpen()

let User = require("../models/user");
const mongoose = require('mongoose');

describe("Tests for user auth", () => {
    before("Connects to the database", done => {
        mongoose.connect(process.env.MONGODBURI).then(_ => {
            console.log('connected!')
            done()
        }).catch(err => {
            done(err)
        })
    })
    before("Empties the database", done => {
        mongoose.connection.db.dropCollection("users").then(_ => {
            done()
        }).catch(err => {
            if (err.code == 26) {
                done() // Collection does not exist
            } else {
                done(err)
            }
        })
    })
    it("Registers the user", done => {
        let passHash = crypto.createHash(process.env.CRYPTOALGO)
        let originalUser = {
            username: 'user',
            password: "12345"
        }
        agent.post("/auth/register").type("form")
        .send(originalUser)
        .then(async res => {
            expect(res).to.have.status(200)
            let user = await User.findOne({username: 'user'})
            expect(user).to.be.an('object')
            let hashedPass = passHash.update(originalUser.password).digest("hex")
            expect(user.password).to.be.equal(hashedPass)
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Fails creating a user with the same username", done => {
        let dupUser = {
            username: 'user',
            password: '54321'
        }
        agent.post("/auth/register")
        .type('form')
        .send(dupUser)
        .then(async res => {
            expect(res).to.have.status(400)
            done()
        }).catch(err => {
            done(err)
        })
    })
    it("Fails to create an account with empty credentials", done => {
        let bad = {
            username: "",
            password: ""
        }
        expect(agent.post("/auth/register")
        .type('form')
        .send(bad)).to.eventually.have.status(400).notify(async () => {
            let badUser = await User.find({username: ""})
            expect(badUser).to.have.length(0)
            done()
        })
    })
    it("Fails to create an account with a bunch of bad credentials", () => {
        let badUsers = ["   ed   ", "13       ","     aaa","   "]
        let badPasswords = ["     passs    ","   pa","sss   ", " pa     "]
        let userAccounts = [{}]
        for (let i = 0; i < badUsers.length; i++) {
            for (let v = 0; v < badPasswords.length; v++) {
                userAccounts.push({
                    username: badUsers[i],
                    password: badUsers[v]
                })
            }
        }
        let requests = []
        userAccounts.forEach(userAccount => {
            requests.push(agent.post("/auth/register")
            .type('form')
            .send(userAccount))
        })
        Promise.all(requests).then(res => {
            res.forEach(x => {
                expect(x).to.have.status(400)
            })
            done()
        })
    })
})