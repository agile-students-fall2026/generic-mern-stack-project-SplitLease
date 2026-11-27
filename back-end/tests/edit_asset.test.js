const chai = require("chai");
const chaiHttp = require("chai-http");

const { expect } = chai;
chai.use(chaiHttp);

const validEdit = () => ({
  name: "Robot Vacuum",
  price: "300.00",
  date: "03/01/2026",
  paidBy: "Demo, Jane Doe",
  description: "Moved to the hallway closet",
});

describe("Edit asset routes", () => {
  let app;
  beforeEach(() => {
    delete require.cache[require.resolve("../app")];
    delete require.cache[require.resolve("../services/purchase_asset")];
    delete require.cache[require.resolve("../services/edit_asset")];
    delete require.cache[require.resolve("../mock-data/assets.json")];
    app = require("../app");
  });

  const getAsset = (id) => chai.request(app).get(`/api/assets/${id}`);
  const putAsset = (id, body) =>
    chai.request(app).put(`/api/assets/${id}`).send(body);

  describe("GET /api/assets/:id", () => {
    it("returns the asset so the edit form can be pre-filled", async () => {
      const res = await getAsset(1);
      expect(res).to.have.status(200);
      expect(res.body).to.include({
        id: 1,
        asset_name: "Vacuum",
        price: 457.52,
        date: "05/18/2026",
      });
    });

    it("responds 404 for an asset that does not exist", async () => {
      const res = await getAsset(999);
      expect(res).to.have.status(404);
      expect(res.body.message).to.equal("Asset not found.");
    });
  });

  describe("PUT /api/assets/:id with a valid edit", () => {
    it("updates the asset and responds 200", async () => {
      const res = await putAsset(1, validEdit());
      expect(res).to.have.status(200);
      expect(res.body.status).to.equal("success");
      expect(res.body.asset).to.include({
        id: 1,
        asset_name: "Robot Vacuum",
        price: 300,
        date: "03/01/2026",
        paidBy: "Demo User, Jane Doe",
        description: "Moved to the hallway closet",
      });
    });

    it("saves the edit so the next GET returns the new values", async () => {
      await putAsset(1, validEdit());
      const res = await getAsset(1);
      expect(res.body.asset_name).to.equal("Robot Vacuum");
    });

    it("allows the description to be cleared", async () => {
      const res = await putAsset(1, { ...validEdit(), description: "" });
      expect(res).to.have.status(200);
      expect(res.body.asset.description).to.equal("");
    });
  });

  describe("PUT /api/assets/:id with invalid input", () => {
    const cases = [
      ["name", "", "Asset name is required."],
      ["price", "abc", "Price must be a number."],
      ["price", "-5", "Price cannot be negative."],
      ["date", "13/01/2024", "Month must be between 01 and 12."],
      ["paidBy", "Zed", "Not a household member: Zed."],
      [
        "description",
        "a".repeat(201),
        "Description cannot exceed 200 characters.",
      ],
    ];

    cases.forEach(([field, value, message]) => {
      it(`rejects ${field} = "${value.slice(0, 20)}"`, async () => {
        const res = await putAsset(1, { ...validEdit(), [field]: value });
        expect(res).to.have.status(400);
        expect(res.body.errors).to.deep.equal({ [field]: message });
      });
    });

    it("leaves the asset unchanged when the edit is rejected", async () => {
      await putAsset(1, { ...validEdit(), price: "abc" });
      const res = await getAsset(1);
      expect(res.body.asset_name).to.equal("Vacuum");
      expect(res.body.price).to.equal(457.52);
    });
  });

  describe("PUT /api/assets/:id for a nonexistent asset", () => {
    it("responds 404", async () => {
      const res = await putAsset(999, validEdit());
      expect(res).to.have.status(404);
      expect(res.body).to.deep.equal({
        status: "error",
        message: "Asset not found.",
      });
    });

    it("responds 404 even when the edit is also invalid", async () => {
      const res = await putAsset(999, { name: "" });
      expect(res).to.have.status(404);
    });

    it("responds 404 when the id is not a number", async () => {
      const res = await putAsset("abc", validEdit());
      expect(res).to.have.status(404);
    });
  });
});
