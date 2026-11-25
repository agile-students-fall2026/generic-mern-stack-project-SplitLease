const chai = require("chai")
const chaiHttp = require("chai-http")
const server = require("../app")

chai.use(chaiHttp)
chai.should()

describe("GET /api/households/:householdId/members/:memberId/balance", () => {
  it("should return how much the member owes", (done) => {
    chai
      .request(server)
      .get("/api/households/1/members/2/balance")
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.include({ memberId: 2, name: "Jane Doe", owes: 16 })

        done()
      })
  })

  it("should return a negative amount when the member is owed money", (done) => {
    chai
      .request(server)
      .get("/api/households/1/members/1/balance")
      .end((err, res) => {
        res.should.have.status(200)
        res.body.owes.should.equal(-304)

        done()
      })
  })

  it("should return 404 when the member is not in the household", (done) => {
    chai
      .request(server)
      .get("/api/households/1/members/4/balance")
      .end((err, res) => {
        res.should.have.status(404)

        done()
      })
  })

  it("should return 404 when the household does not exist", (done) => {
    chai
      .request(server)
      .get("/api/households/99/members/1/balance")
      .end((err, res) => {
        res.should.have.status(404)

        done()
      })
  })
})