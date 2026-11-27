const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");

const { expect } = chai;
chai.use(chaiHttp);

const getItems = (householdId, memberId) =>
  chai
    .request(app)
    .get(`/api/households/${householdId}/assets`)
    .query({ memberId });

describe("GET /api/households/:householdId/assets", () => {
  it("returns the household's items for a member", async () => {
    const res = await getItems(1, 1);
    expect(res).to.have.status(200);
    expect(res.body).to.be.an("array").that.is.not.empty;
    res.body.forEach((item) => expect(item.household_id).to.equal(1));
  });

  it("returns an empty list when the household has no items", async () => {
    const res = await getItems(3, 11);
    expect(res).to.have.status(200);
    expect(res.body).to.deep.equal([]);
  });

  it("returns 403 for someone who is not a member", async () => {
    const res = await getItems(1, 4);
    expect(res).to.have.status(403);
  });
});
