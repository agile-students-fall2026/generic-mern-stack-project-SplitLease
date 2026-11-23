import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SplitLeaseLogo from "../../assets/splitlease-blank-background-logo.png";
import "./Protocols.css";
import axios from "axios";

const Protocols = () => {
  const navigate = useNavigate();

  const [protocols, setProtocols] = useState([]);
  const [approvedByMe, setApprovedByMe] = useState([]);

  useEffect(() => {
    axios("http://localhost:3000/protocols")
    .then((response) => {
      console.log("API Response:", response.data);
      setProtocols(response.data);
    })
    .catch((err) => {
      console.error("Error getting protocols:", err);
    });
  }, []);

  const pending = protocols.filter((p) => p.status === "pending");
  const approved = protocols.filter((p) => p.status === "approved");

  const handleApprove = (id) => {
    axios
      .post(`http://localhost:3000/protocols/${id}/approve`)
      .then((response) => {
        console.log("Approved protocol:", response.data);
        setApprovedByMe([...approvedByMe, id]);
        setProtocols(
          protocols.map((protocol) =>
            protocol.id === id ? response.data : protocol)
        );
      })
      .catch((err) => {
        console.error("Error approving protocol:", err);
      });
  };

  return (
    <div className="protocolsContainer">
      <header className="protocolsHeader">
        <img
          src={SplitLeaseLogo}
          alt="SplitLease logo"
          className="protocolsLogo"
          onClick={() => navigate("/home")}
        />
        <button
          type="button"
          className="protocolsBack"
          onClick={() => navigate("/household")}
        >
          Back
        </button>
      </header>

      <section className="protocolsBanner">
        <h1 className="protocolsTitle">Protocols</h1>
        <p className="protocolsCount">
          {protocols.length} protocols · {approved.length} approved ·{" "}
          {pending.length} pending
        </p>
        <button
          type="button"
          className="protocolsPrimary"
          onClick={() => navigate("/new_protocol")}
        >
          Propose New Protocol
        </button>
      </section>

      <section className="protocolsCard">
        <h2 className="protocolsSectionTitle">Pending Protocols</h2>
        {pending.length === 0 ? (
          <p className="protocolsEmpty">No protocols waiting for approval.</p>
        ) : (
        <ul className="protocolsList">
          {pending.map((p) => {
            const alreadyApproved = approvedByMe.includes(p.id);
            return (
              <li key={p.id} className="protocolsRow">
                <div className="protocolsInfo">
                  <span className="protocolsName">{p.protocol_name}</span>
                  <span className="protocolsMeta">
                    Proposed by {p.proposed_by} · {p.approvals}/{p.member_count}
                    approved
                  </span>
                </div>
                <div className="protocolsActions">
                  <button
                    type="button"
                    className="protocolsSecondary"
                    onClick={() => navigate("/individualprotocol", { state: {protcoolId: p.id } })}
                    
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="protocolsApprove"
                    onClick={() => handleApprove(p.id)}
                    disabled={alreadyApproved}
                  >
                    {alreadyApproved ? "Approved" : "Approve"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        )}
      </section>

      <section className="protocolsCard">
        <h2 className="protocolsSectionTitle">Household Protocols</h2>
        {approved.length === 0 ? (
          <p className="protocolsEmpty">No approved protocols yet.</p>
        ) : (
        <ul className="protocolsList">
          {approved.map((p) => (
            <li key={p.id} className="protocolsRow">
              <div className="protocolsInfo">
                <span className="protocolsName">{p.protocol_name}</span>
                <span className="protocolsMeta">
                  Proposed by {p.proposed_by} · Approved by everyone
                </span>
              </div>
              <div className="protocolsActions">
                <button
                  type="button"
                  className="protocolsSecondary"
                  onClick={() => navigate ("/individual-protocol", { state: { protocolId: protocol.id } })}
                >
                  View
                </button>
              </div>
            </li>
          ))}
        </ul>
        )}
      </section>
    </div>
  );
};

export default Protocols;
