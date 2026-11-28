import React, { useState } from "react";
import "./protocol_proposal.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SplitLeaseLogo from "../../assets/splitlease-blank-background-logo.png";
import { getCurrentUser } from "../login/authApi";

const ProtocolProposal = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    protocol_name: "",
    protocol_description: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.protocol_name.trim() || !formData.protocol_description.trim()) {
      alert("Please enter both a proposal name and description.");
      return;
    }

    const currentUser = getCurrentUser();
    const proposedBy = currentUser
              ? `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()
              : "";

    axios
      .post("/api/protocols", {
        ...formData,
        proposed_by: proposedBy,
      })
      .then((response) => {
        console.log("Proposal created:", response.data);
        navigate("/protocols");
      })
      .catch((err) => {
        console.error("Error creating proposal:", err);
        alert("Failed to submit proposal. Please try again.");
      });
  };

  return (
    <div className="protocolContainer">
      <header className="protocolHeader">
        <div className="protocolHeaderTop">
          <img
            src={SplitLeaseLogo}
            alt="SplitLease Logo"
            className="protocolLogo"
            onClick={() => navigate("/home")}
          />
          <button
            type="button"
            className="backButton"
            onClick={() => navigate("/protocols")}
          >
            Back
          </button>
        </div>
        <h1 className="protocolTitle">Propose a Protocol</h1>
      </header>

      <form className="proposalForm" onSubmit ={handleSubmit}>
        <div className="proposalCard">
          <h2 className="proposalLabel">Proposal Name:</h2>
          <input 
            type="text" 
            className="proposalInput"
            name="protocol_name"
            value={formData.protocol_name}
            placeholder="e.g. Quiet hours after 11pm"
            onChange={handleChange}
            />
        </div>

        <div className="proposalCard">
          <h2 className="proposalLabel">Proposal Description:</h2>
          <textarea
            className="proposalInput proposalTextarea"
            type="text"
            name="protocol_description"
            value={formData.protocol_description}
            placeholder="Describe the rules and expectations..."
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="proposalSubmit">
          Submit Proposal
        </button>
      </form>
    </div>
  );
};

export default ProtocolProposal;
