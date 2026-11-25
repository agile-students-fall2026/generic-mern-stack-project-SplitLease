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
        <div className="membersListContainer">
          <div className="sectionTitle">
            <p className="fieldText">Members</p>
            <button
              className="primaryButton"
              onClick={() => navigate("/manage-members")}
            >
              Manage Members
            </button>
          </div>
          <input
            type="text"
            className="textInput"
            placeholder="search members"
          />
          <div className="membersList">
            {members.length === 0 ? (
              <p className="fieldText">No members available.</p>
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
          </div>
        </div>

        <div className="assetsContainer">
          <p className="fieldText">Assets</p>
          <div className="assetsList">
            <button
              className="viewAssetsButton"
              onClick={() => navigate("/assets")}
            >
              View Assets Page
            </button>
            <p className="assetQuickInfo"># of Assets: 5</p>
            <button
              className="fieldText"
              onClick={() => navigate("/assets/create")}
            >
              Quick Create Asset
            </button>
          </div>
        </div>

        <div className="assetsContainer">
          <p className="fieldText">Expenses</p>
          <div className="assetsList">
            <button
              className="viewAssetsButton"
              onClick={() => navigate("/expenses")}>
              View Expenses Page
            </button>
            <button
              className="viewAssetsButton"
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

        <div className="assetsContainer">
          <p className="fieldText">Protocols</p>
          <div className="assetsList">
            <button
              className="viewAssetsButton"
              onClick={() => navigate("/protocols")}
            >
              View Protocols Page
            </button>
            <p className="fieldText">Preview Protocols</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdDashboard;