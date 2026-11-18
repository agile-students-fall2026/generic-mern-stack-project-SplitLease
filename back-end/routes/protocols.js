const express = require("express");
const router = express.Router();

// mock protocols
let protocols = [
    {
        protocol_id: 1,
        protocol_name: "Quiet hours after 11pm",
        protocol_description: "Keep noise levels donw between 11pm and 7am Stunday through Thursday.",
        proposed_by: "John Doe",
        household_id: 1,
        protocol_status: "Agreed - Agreed - Agreed - [Declare Status]",
        approvals: 3,
        member_count: 4,
        status: "pending"
    },
    {
        protocol_id: 2,
        protocol_name: "Dishes washed within 24 hours",
        protocol_description: "Shared sink must be clear, all dishes must be washed within 24 hours",
        proposed_by: "Alex Smith",
        household_id: 1,
        protocol_status: "Agreed - Agreed - Agreed - Agreed",
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

// GET /protocols/:id , view single protocol
router.get("/:id", (req, res) => {
    const protocolID = parseInt(req.params.id, 10);
    const protocol = protocols.find((p) => p.protocol_id === protocolID)

    if (!protocols){
        return res.status(404).json({ error: "Protocol with ID ${protocolID} not found." });
    }
    
    res.status(200).json(protocol);
});

// POST /protocols, proposes a new protocol with validation
router.post("/", (req, res) => {
    const { protocol_name, protocol_description, proposed_by, member_count } = req.body;

    //checks to see if the input is valid

    if (!protocol_name || typeof protocol_name != "string"){
        return res.status(400).json({ error: "Validation Error: 'protocol_name' is required"});
    }

    if (!protocol_description || typeof protocol_description != "string"){
        return res.status(400).json({ error: "Validation Error: 'protocol_description' is required"});
    }
});