import React, { useState } from "react";
import "./protocol_proposal.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SplitLeaseLogo from "../../assets/splitlease-blank-background-logo.png";

const API_URL = "http://localhost:3000";


const ProtocolProposal = () => {
  const navigate = useNavigate();
  
  const [formData, setData] = useState({
    protocol_name: "",
    protocol_description: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ..prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.protocol_name.trim() || !formData.protocol_description.trim()) {
      alert("Please enter both a proposal name and description.");
      return;
    }

    axios
      .post("http://localhost:3000/protocols", formData)
      .then((response) => {
        console.log("Proposal created:", response.data);
        navaigate("/protocols")l
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

      <div className="proposalForm" onSubmit ={handleSubmit}>
        <div className="proposalCard">
          <h2 className="proposalLabel">Proposal Name:</h2>
          <input 
            type="text" 
            className="proposalInput"
            name="protocol_name"
            value={formData.protocl_name}
            placeholder="e.g. Quiet hours after 11pm"
            onChange={handleChange}
            />
        </div>

        <div className="proposalCard">
          <h2 className="proposalLabel">Proposal Description:</h2>
          <textarea 
          className="proposalInput proposalTextarea"
          name="protocol_description"
          value={formData.protocol_description}
          placeholder="Describe the rules and expectations..."
          onChange={handleChange}
          ></textarea>
        </div>

        <div className="resourceActions">
          <button type="button" className="resourceButton">
            Upload additional resources
          </button>
          <button type="button" className="resourceButton">
            Link additional resources
          </button>
        </div>

        <div className="proposalCard resourcesCard">
          <p className="resourcesTitle">Resources attached to this proposal</p>
          <div className="resourceRow"></div>
          <div className="resourceRow"></div>
          <div className="resourceRow"></div>
          <div className="resourceRow"></div>
        </div>

        <button type="button" className="proposalSubmit">
          Submit Proposal
        </button>
      </div>
    </div>
  );
};

export default ProtocolProposal;
