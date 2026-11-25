const chai = require("chai")
const chaiHttp = require("chai-http")
const server = require("../app")

chai.use(chaiHttp)
chai.should()

describe("GET /api/households/:householdId/balances", () => {
  it("should return a balance for every member of the household", (done) => {
    chai
      .request(server)
      .get("/api/households/1/balances")
      .end((err, res) => {
        res.should.have.status(200)
        res.body.should.have.property("householdId", 1)
        res.body.balances.should.be.an("array").with.lengthOf(5)

        done()
      })
  })
  it("should split expenses evenly and credit the member who paid", (done) => {
    chai
      .request(server)
      .get("/api/households/1/balances")
      .end((err, res) => {
        const demo = res.body.balances.find((b) => b.memberId === 1)
        const jane = res.body.balances.find((b) => b.memberId === 2)

        demo.owes.should.equal(-1966)
        jane.owes.should.equal(364)

        done()
      })
  })

  it("should return 400 when the household id is not a number", (done) => {
    chai
      .request(server)
      .get("/api/households/abc/balances")
      .end((err, res) => {
        res.should.have.status(400)

        done()
      })
  })
  it("should return 404 when the household does not exist", (done) => {
    chai
      .request(server)
      .get("/api/households/99/balances")
      .end((err, res) => {
        res.should.have.status(404)

        done()
      })
  })
})

describe("POST /api/households/:householdId/settle", () => {
  it("should return 201 and the payment when the payment is valid", (done) => {
    chai
      .request(server)
      .post("/api/households/1/settle")
      .send({ fromMemberId: 3, toMemberId: 1, amount: 50 })
      .end((err, res) => {
        res.should.have.status(201)
        res.body.should.have.property("status", "success")
        res.body.payment.should.include({ fromMemberId: 3, toMemberId: 1, amount: 50 })

        done()
      })
  })

  it("should return 400 when a member tries to pay themselves", (done) => {
    chai
      .request(server)
      .post("/api/households/1/settle")
      .send({ fromMemberId: 3, toMemberId: 3, amount: 10 })
      .end((err, res) => {
        res.should.have.status(400)

        done()
      })
  })

  it("should return 400 when the amount is missing", (done) => {
    chai
      .request(server)
      .post("/api/households/1/settle")
      .send({ fromMemberId: 3, toMemberId: 1 })
      .end((err, res) => {
        res.should.have.status(400)

        done()
      })
  })
  it("should return 400 when the member does not owe anything", (done) => {
    chai
      .request(server)
      .post("/api/households/1/settle")
      .send({ fromMemberId: 1, toMemberId: 2, amount: 10 })
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.have.property("error", "Demo User does not owe anything")

        done()
      })
  })
  it("should return 400 when paying more than the member owes", (done) => {
    chai
      .request(server)
      .post("/api/households/1/settle")
      .send({ fromMemberId: 2, toMemberId: 1, amount: 400 })
      .end((err, res) => {
        res.should.have.status(400)
        res.body.should.have.property("error", "Jane Doe only owes $364.00")

        done()
      })
  })

  it("should return 404 when paying someone outside the household", (done) => {
    chai
      .request(server)
      .post("/api/households/1/settle")
      .send({ fromMemberId: 3, toMemberId: 4, amount: 10 })
      .end((err, res) => {
        res.should.have.status(404)

        done()
      })
  })
})