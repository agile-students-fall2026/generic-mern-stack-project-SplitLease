const chai = require("chai")
const chaiHttp = require("chai-http")
const server = require("../app")

chai.use(chaiHttp)
chai.should()

describe("GET /api/households/:householdId/debts", () => {
  it("should return a list of who owes whom", (done) => {
    chai
      .request(server)
      .get("/api/households/2/debts")
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.have.property("householdId", 2)
        res.body.debts.should.be.an("array").with.lengthOf(5)

        done()
      })
  })
  it("should split one person's debt between two people when needed", (done) => {
    chai
      .request(server)
      .get("/api/households/2/debts")
      .end((err, res) => {
        res.body.debts[0].should.include({ fromMemberId: 1, toMemberId: 4, amount: 18.33 })
        res.body.debts[2].should.include({ fromMemberId: 9, toMemberId: 4, amount: 15.01 })
        res.body.debts[3].should.include({ fromMemberId: 9, toMemberId: 7, amount: 3.32 })

        done()
      })
  })
  it("should return an empty list when everyone is even", (done) => {
    chai
      .request(server)
      .get("/api/households/3/debts")
      .end((err, res) => {
        res.should.have.status(200)
        res.body.debts.should.be.an("array").that.is.empty

        done()
      })
  })

  it("should return 400 when the household id is not a number", (done) => {
    chai
      .request(server)
      .get("/api/households/abc/debts")
      .end((err, res) => {
        res.should.have.status(400)

        done()
      })
  })
  it("should return 404 when the household does not exist", (done) => {
    chai
      .request(server)
      .get("/api/households/99/debts")
      .end((err, res) => {
        res.should.have.status(404)

        done()
      })
  })
})