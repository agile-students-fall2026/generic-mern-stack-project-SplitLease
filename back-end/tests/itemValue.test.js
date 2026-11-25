const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");
const { getCurrentValue, checkValue } = require("../services/item_value");

const { expect } = chai;
chai.use(chaiHttp);

describe("getCurrentValue", () => {
  it("returns the price for a brand-new item with no value set", () => {
    expect(getCurrentValue({ price: 457.52 })).to.equal(457.52);
  });

  it("returns the manually entered value when one is set", () => {
    expect(getCurrentValue({ price: 457.52, current_value: 120 })).to.equal(
      120,
    );
  });

  it("returns 0 when the value was set to 0 (does not fall back to price)", () => {
    expect(getCurrentValue({ price: 457.52, current_value: 0 })).to.equal(0);
  });

  it("converts a string price to a number", () => {
    expect(getCurrentValue({ price: "99.99" })).to.equal(99.99);
  });
});

describe("checkValue", () => {
  it("accepts whole numbers and up to two decimals", () => {
    expect(checkValue("150")).to.equal(null);
    expect(checkValue("150.5")).to.equal(null);
    expect(checkValue("150.50")).to.equal(null);
    expect(checkValue("0")).to.equal(null);
  });

  it("rejects an empty value", () => {
    expect(checkValue("")).to.equal("Value is required.");
    expect(checkValue(undefined)).to.equal("Value is required.");
  });

  it("rejects a negative value", () => {
    expect(checkValue("-5")).to.equal("Value cannot be negative.");
  });

  it("rejects text and more than two decimals", () => {
    expect(checkValue("abc")).to.be.a("string");
    expect(checkValue("1.234")).to.be.a("string");
  });
});

describe("GET /api/assets/:id/value", () => {
  it("returns the price as the current value for an item never updated", async () => {
    const res = await chai.request(app).get("/api/assets/2/value");
    expect(res).to.have.status(200);
    expect(res.body.currentValue).to.equal(res.body.price);
  });

  it("returns 404 for an item that does not exist", async () => {
    const res = await chai.request(app).get("/api/assets/99999/value");
    expect(res).to.have.status(404);
  });
});

describe("PUT /api/assets/:id/value", () => {
  const putValue = (id, body) =>
    chai.request(app).put(`/api/assets/${id}/value`).send(body);

  it("lets a household member update the value without changing the price", async () => {
    const before = await chai.request(app).get("/api/assets/2/value");

    const res = await putValue(2, { value: "80", memberId: 2 });
    expect(res).to.have.status(200);
    expect(res.body.currentValue).to.equal(80);

    const after = await chai.request(app).get("/api/assets/2/value");
    expect(after.body.currentValue).to.equal(80);
    expect(after.body.price).to.equal(before.body.price);
  });

  it("returns 403 for someone outside the household", async () => {
    const res = await putValue(2, { value: "80", memberId: 4 });
    expect(res).to.have.status(403);
  });

  it("returns 400 for an invalid value", async () => {
    const res = await putValue(2, { value: "-5", memberId: 2 });
    expect(res).to.have.status(400);
    expect(res.body.errors.value).to.equal("Value cannot be negative.");
  });

  it("returns 404 for an item that does not exist", async () => {
    const res = await putValue(99999, { value: "80", memberId: 2 });
    expect(res).to.have.status(404);
  });
});
