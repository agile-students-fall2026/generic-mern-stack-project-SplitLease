import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SplitLeaseLogo from "../../assets/splitlease-blank-background-logo.png";
import { getCurrentUser } from "../login/authApi";
import "./AssetList.css";
import Header from "../../components/Header";

const AssetList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [assets, setAssets] = useState([]);
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);

  const loadAssets = () => {
    const user = getCurrentUser();
    if (!user?.householdId) return;

    axios
      .get(`/api/households/${user.householdId}/assets`, {
        params: { memberId: user.id },
      })
      .then((response) => setAssets(response.data))
      .catch((err) => console.error("Error getting assets:", err));
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleDelete = (asset) => {
    setOpenMenuId(null);

    axios
      .delete(`/api/assets/${asset.id}`, {
        data: { memberId: getCurrentUser()?.id },
      })
      .then(() => loadAssets())
      .catch((err) =>
        alert(err.response?.data?.message || "Could not delete the asset."),
      );
  };

  const filteredAssets = assets.filter((asset) =>
    asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()),
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
                  <div className="asset-menu">
                    <button
                      type="button"
                      className="asset-menu-button"
                      aria-label="Asset options"
                      onClick={() =>
                        setOpenMenuId(openMenuId === asset.id ? null : asset.id)
                      }
                    >
                      Options
                    </button>

                    {openMenuId === asset.id && (
                      <div className="asset-menu-dropdown">
                        <button
                          type="button"
                          onClick={() => navigate(`/assets/${asset.id}/edit`)}
                        >
                          Edit Asset
                        </button>
                        <button
                          type="button"
                          className="asset-menu-delete"
                          onClick={() => handleDelete(asset)}
                        >
                          Delete Asset
                        </button>
                      </div>
                    )}
                  </div>

                  {asset.image && (
                    <img
                      src={asset.image}
                      alt={asset.asset_name}
                      className="asset-image"
                    />
                  )}

                  <div className="asset-info">
                    <h3 className="asset-name">{asset.asset_name}</h3>
                    <p className="asset-meta">
                      ${Number(asset.price).toFixed(2)}
                      {asset.paidBy && ` - paid by ${asset.paidBy}`}
                    </p>
                    <p className="asset-meta">
                      Current value: $
                      {Number(asset.current_value ?? asset.price).toFixed(2)}
                    </p>
                    {asset.description && (
                      <p className="asset-description">{asset.description}</p>
                    )}
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
