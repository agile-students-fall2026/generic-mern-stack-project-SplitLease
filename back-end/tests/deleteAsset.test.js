const chai = require("chai");
const chaiHttp = require("chai-http");

const { expect } = chai;
chai.use(chaiHttp);

describe("DELETE /api/assets/:id", () => {
  let app;
  beforeEach(() => {
    delete require.cache[require.resolve("../app")];
    delete require.cache[require.resolve("../services/purchase_asset")];
    delete require.cache[require.resolve("../services/edit_asset")];
    delete require.cache[require.resolve("../services/delete_asset")];
    delete require.cache[require.resolve("../services/item_value")];
    delete require.cache[require.resolve("../mock-data/assets.json")];
    app = require("../app");
  });

  const deleteAsset = (id, body) =>
    chai.request(app).delete(`/api/assets/${id}`).send(body);

  it("lets a household member delete an asset", async () => {
    const res = await deleteAsset(1, { memberId: 2 });
    expect(res).to.have.status(200);
    expect(res.body.status).to.equal("success");
    expect(res.body.deletedId).to.equal(1);

    const after = await chai.request(app).get("/api/assets/1");
    expect(after).to.have.status(404);
  });

  it("returns 404 for an asset that does not exist", async () => {
    const res = await deleteAsset(99999, { memberId: 2 });
    expect(res).to.have.status(404);
    expect(res.body.message).to.equal("Asset not found.");
  });

  it("returns 403 for someone outside the household and keeps the asset", async () => {
    const res = await deleteAsset(1, { memberId: 4 });
    expect(res).to.have.status(403);

    const after = await chai.request(app).get("/api/assets/1");
    expect(after).to.have.status(200);
  });
});
