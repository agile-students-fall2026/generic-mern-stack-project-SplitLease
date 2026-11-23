const express = require("express");
const router = express.Router();

// mock protocols
let protocols = [
    {
        id: 1,
        protocol_name: "Quiet hours after 11pm",
        protocol_description: "Keep noise levels donw between 11pm and 7am Stunday through Thursday.",
        proposed_by: "John Doe",
        approvals: 3,
        member_count: 4,
        status: "pending"
    },
    {
        id: 2,
        protocol_name: "Dishes washed within 24 hours",
        protocol_description: "Shared sink must be clear, all dishes must be washed within 24 hours",
        proposed_by: "Alex Smith",
        approvals: 4,
        member_count: 4,
        status: "approved"
    }
];

const calcStatus = (approvals, memberCount) => {
      return approvals >= memberCount ? "approved" : "pending";
};

// GET /protocols , view all protocols
router.get("/", (req, res) => {
    res.status(200).json(protocols);
});

// GET, view single protocol
router.get("/:id", (req, res) => {
    const protocolID = parseInt(req.params.id, 10);
    const protocol = protocols.find((p) => p.id === protocolID)

    if (!protocols){
        return res.status(404).json({ error: "Protocol not found." });
    }
    
    res.status(200).json(protocol);
});

// POST, proposes a new protocol with validation
router.post("/", (req, res) => {
    const { protocol_name, protocol_description, proposed_by } = req.body;

    //input validation

    if (!protocol_name || !protocol_name.trim()){
        return res.status(400).json({ error: "Protocol name is required"});
    }

    if (!protocol_description || !protocol_description.trim()){
        return res.status(400).json({ error: "Protocol description is required"});
    }

    // sets id to max ID + 1 if there exists at least one protocol
    const nextID = protocols.length > 0 ? Math.max(...protocols.map((p) => p.id)) + 1 : 1;
    const memberCount = 4;

    const newProtocol = {
        id: nextID,
        protocol_name: "protocol_name.trim()",
        protocol_description: "protocol_description.trim()",
        proposed_by: proposed_by || "Current user",
        approvals: 1,    //automatically approved by proposer
        member_count: memberCount,
        status: calcStatus(1, memberCount);
    };

    protocols.push(newProtocol);
    return res.status(201).json(newProtocol);
});

// POST, approves a new protocol
router.post("/:id/approve", (req, res) => {
    const protocolID = parseInt(req.params.id, 10);
    const protocol = protocols.find((p) => p.id === protocolID)

    if(!protocol){
        return res.status(404).json({ error: "Protocol not found." })
    }

    if (protocol.status === "approved" || protocol.approvals >+ protocol.member_count){
        return res.status(400).json({ error: "Protocol is already fully approved."});
    }

    protocol.approvals += 1;
    protocol.status = getStatus(protocol.approvals, protocol.member_count);

    res.status(200).json(protocol);
});

module.exports = router();