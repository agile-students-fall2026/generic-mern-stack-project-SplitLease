import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SplitLeaseLogo from "../../assets/splitlease-blank-background-logo.png";
import "./AssetList.css";
import Header from '../../components/Header';

const AssetList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [assets, setAssets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios("http://localhost:3000/api/assets")
      .then((response) => {
        console.log("API Response:", response.data);
        setAssets(response.data);
      })
      .catch((err) => {
        console.error("Error getting assets:", err);
      });
  }, []);

  const filteredAssets = assets.filter((asset) =>
    asset.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="asset-page-container">

      <Header page_title="Assets" backTo="/household" />

      <main className="mainContainer">
        {/* Outer box */}

          <div className="action-container">
            <div className="create-container">
              <button
                className="primaryButton"
                onClick={() => navigate("/assets/create")}
              >
                Create Asset
              </button>
            </div>

            {/* Search bar */}
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search assets"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {/* Create asset button */}

          {/* Inner box with grid */}
          <div className="asset-inner-container">
            <div className="asset-grid">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <div key={asset.id} className="asset-card">
                    <div className="asset-square">
                      <div className="asset-name">{asset.name}</div>
                      <img
                        src={
                          "https://picsum.photos/id/" +
                          asset.id * 20 +
                          "/100/100"
                        }
                        alt={asset.name}
                        className="asset-image"
                      />
                      <div className="asset-description">
                        {asset.description}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-assets">No assets found.</p>
              )}
            </div>
        </div>
      </main>
    </div>
  );
};

export default AssetList;
