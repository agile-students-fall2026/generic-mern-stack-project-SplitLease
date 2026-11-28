import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import SplitLeaseLogo from "../../assets/splitlease-blank-background-logo.png";
import "./HouseholdDashboard.css";
import axios from "axios";
import Header from '../../components/Header';
import { getCurrentUser } from "../login/authApi";

const HouseholdDashboard = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.get("/api/members");
        setMembers(response.data);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    fetchMembers();
  }, []);

  const currentUser = getCurrentUser();
  const [balance, setBalance] = useState(null);
  const [protocols, setProtocols] = useState([]);

    useEffect(() => {
      const fetchProtocols = async () => {
        try {
          const response = await axios.get("/api/protocols");
          setProtocols(response.data);
        } catch (error) {
          console.error("Error fetching protocols:", error);
        }
      };

      fetchProtocols();
    }, []);

    const pendingCount = protocols.filter((p) => p.status === "pending").length;
    const approvedCount = protocols.filter((p) => p.status === "approved").length;
    
  useEffect(() => {
    const fetchBalance = async () => {
      if (!currentUser) return;

      try {
        const response = await axios.get(
          `/api/households/${currentUser.householdId}/members/${currentUser.id}/balance`,
        );
        setBalance(response.data.owes);
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchBalance();
  }, []);

  return (
    <div className="mainContainer">
      <Header page_title="Household Dashboard" backTo="/home" />

      <div className="sectionContainer">
          <h2 className="sectionTitle">
            Members
          </h2>
          <input
            type="text"
            className="textField"
            placeholder="search members"
          />
          <div className="dashboardMembers">
            {members.length === 0 ? (
              <p className="dashboardEmpty">No members available.</p>
            ) : (
              members.map((member, index) => (
                <button
                  key={member.id || index}
                  type="button"
                  className="listRow"
                  onClick={() => console.log("Selected:", member.first_name || member)}
                >
                  {member.first_name || member}
                </button>
              ))
            )}
            <button
              className="primaryButton dashboardButton"
              onClick={() => navigate("/manage-members")}
            >
              Manage Members
            </button>
          </div>
                  {members.length > 4 && (
          <p className="scrollMessage">Scroll down to see more</p>
        )}
        </div>

        <div className="sectionContainer">
          <h1 className="sectionTitle">Assets</h1>
          <div className="assetsList">
            <button
              className="primaryButton"
              onClick={() => navigate("/assets")}
            >
              View Assets Page
            </button>
            <p className="assetQuickInfo"># of Assets: 5</p>
            <button
              className="primaryButton"
              onClick={() => navigate("/assets/create")}
            >
              Quick Create Asset
            </button>
          </div>
        </div>

        <div className="sectionContainer">
          <h1 className="sectionTitle">Expenses</h1>
          <div className="assetsList">
            <button
              className="primaryButton"
              onClick={() => navigate("/expenses")}>
              View Expenses Page
            </button>
            <button
              className="primaryButton"
              onClick={() => navigate("/settle")} >
              Settle Payment
            </button>
            <p className="fieldText">
              {balance === null
                ? "Log in to see your balance"
                : balance > 0
                  ? `You owe $${balance.toFixed(2)}`
                  : `You are owed $${Math.abs(balance).toFixed(2)}`}
            </p>
          </div>
        </div>

        <div className="sectionContainer">
          <h1 className="sectionTitle">Protocols</h1>
            <div className="assetsList">
              <button
                type="button"
                className="primaryButton"
                onClick={() => navigate("/protocols")}
              >
              View Protocols Page
              </button>
              <p className="fieldText">
                {pendingCount} pending · {approvedCount} approved
              </p>
            </div>
        </div>
    </div>
  );
};

export default HouseholdDashboard;