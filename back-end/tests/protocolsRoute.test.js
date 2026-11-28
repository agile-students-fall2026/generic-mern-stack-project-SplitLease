const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");

const { expect } = chai;
chai.use(chaiHttp);

describe("Protocols API (/api/protocols)", () => {
    it("GET /api/protocols returns all protocols", async () => {
        const res = await chai.request(app).get("/api/protocols");

        expect(res).to.have.status(200);
        expect(res.body).to.be.an("array").with.lengthOf.at.least(2);
        expect(res.body[0]).to.include({
          id: 1,
          protocol_name: "Quiet hours after 11pm",
          status: "pending",
        });
    });

    it("GET /api/protocols/:id returns a single protocol", async () => {
        const res = await chai.request(app).get("/api/protocols/1");

        expect(res).to.have.status(200);
        expect(res.body).to.include({
          id: 1,
          protocol_name: "Quiet hours after 11pm",
        });
    });

    it("GET /api/protocols/:id returns 404 for a nonexistent protocol", async () => {
        const res = await chai.request(app).get("/api/protocols/999");

        expect(res).to.have.status(404);
        expect(res.body).to.have.property("error", "Protocol not found.");
    });

    it("POST /api/protocols returns 400 when protocol_name is missing", async () => {
        const res = await chai.request(app).post("/api/protocols").send({
          protocol_name: "   ",
          protocol_description: "Clean up after yourself.",
        });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property("error", "Protocol name is required");
    });

    it("POST /api/protocols returns 400 when protocol_description is missing", async () => {
        const res = await chai.request(app).post("/api/protocols").send({
          protocol_name: "Clean Kitchen",
          protocol_description: "",
        });

        expect(res).to.have.status(400);
        expect(res.body).to.have.property(
          "error",
          "Protocol description is required",
        );
    });

    it("POST /api/protocols creates a new pending protocol with proposer name", async () => {
        const res = await chai.request(app).post("/api/protocols").send({
          protocol_name: "  Take out trash  ",
          protocol_description: "  Every Monday night  ",
          proposed_by: "Demo User",
        });

        expect(res).to.have.status(201);
        expect(res.body).to.include({
          protocol_name: "Take out trash",
          protocol_description: "Every Monday night",
          proposed_by: "Demo User",
          approvals: 1,
          member_count: 4,
          status: "pending",
        });
    });

    it("POST /api/protocols falls back to 'Current user' when proposed_by is omitted", async () => {
        const res = await chai.request(app).post("/api/protocols").send({
          protocol_name: "No loud music",
          protocol_description: "Keep volume low after 10pm",
        });

        expect(res).to.have.status(201);
        expect(res.body).to.have.property("proposed_by", "Current user");
    });

    it("POST /api/protocols/:id/approve increments approvals and updates status to approved", async () => {
        const res = await chai.request(app).post("/api/protocols/1/approve");

        expect(res).to.have.status(200);
        expect(res.body).to.include({
          id: 1,
          approvals: 4,
          member_count: 4,
          status: "approved",
        });
    });

    it("POST /api/protocols/:id/approve returns 400 if already fully approved", async () => {
        const res = await chai.request(app).post("/api/protocols/2/approve");

        expect(res).to.have.status(400);
        expect(res.body).to.have.property(
          "error",
          "Protocol is already fully approved.",
        );
    });

    it("POST /api/protocols/:id/approve returns 404 for a nonexistent protocol", async () => {
        const res = await chai.request(app).post("/api/protocols/999/approve");

        expect(res).to.have.status(404);
        expect(res.body).to.have.property("error", "Protocol not found.");
    });
});
