import React, { useState, useEffect } from "react";
import axios from "axios";
import SplitLeaseLogo from "../../assets/splitlease-blank-background-logo.png";
import { useNavigate } from "react-router-dom";
import "./UserHomePage.css";
import { getCurrentUser, saveCurrentUser } from "../login/authApi";
import HeaderHome from "../../components/HeaderHome";

function UserHomePage() {
  const userName = getCurrentUser()?.firstName || "";
  const navigate = useNavigate();

  const [households, setHouseholds] = useState([]);

  useEffect(() => {
    const fetchHouseholds = async () => {
      try {
        const response = await axios.get("/api/households");
        const uniqueHouseholds = response.data.filter(
          (household, index, self) =>
            index ===
            self.findIndex(
              (h) => h.household_name === household.household_name,
            ),
        );
        const user = getCurrentUser();
        const mine = uniqueHouseholds.filter((h) =>
          user?.householdIds?.includes(h.id),
        );
        setHouseholds(mine);
      } catch (error) {
        console.error("Error fetching households:", error);
      }
    };

    fetchHouseholds();
  }, []);

  return (
    <div className="mainContainer">
      <HeaderHome user={userName} />

      <div className="sectionContainer">
        <p className="sectionTitle">My Households</p>
        <input
          type="text"
          className="textField"
          placeholder="Search households"
        />

        <div className="householdList">
          {households.length === 0 ? (
            <p className="householdEmpty">No households available.</p>
          ) : (
            households.map((household, index) => (
              <button
                key={household.id || index}
                type="button"
                className="listRow"
                onClick={() => {
                  saveCurrentUser({
                    ...getCurrentUser(),
                    householdId: household.id,
                  });
                  navigate("/household");
                }}
              >
                {household.household_name || household.name || household}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="sectionContainer homeActions">
        <button
          className="primaryButton"
          type="button"
          onClick={() => navigate("/create")}
        >
          Create Household
        </button>
        <button
          className="primaryButton"
          type="button"
          onClick={() => navigate("/join-household")}
        >
          Join Household
        </button>
      </div>
    </div>
  );
}

export default UserHomePage;
