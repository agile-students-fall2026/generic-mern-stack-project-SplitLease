import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import "./CreateAsset.css";
import "./EditAsset.css";

const fields = [
  { name: "name", label: "Asset Name" },
  { name: "description", label: "Description" },
  { name: "price", label: "Total Price ($)" },
  { name: "date", label: "Date Purchased (MM/DD/YYYY)" },
  { name: "paidBy", label: "Person(s) Who Paid" },
];

const EditAsset = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState(null);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    axios
      .get(`/api/assets/${id}`)
      .then((res) => {
        const asset = res.data;
        setFormData({
          name: asset.asset_name,
          description: asset.description || "",
          price: String(asset.price),
          date: asset.date,
          paidBy: asset.paidBy || "",
          image: asset.image,
        });
      })
      .catch(() => setErrors({ form: "Asset not found." }));
  }, [id]);
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    fields.forEach((f) => data.append(f.name, formData[f.name]));
    if (image) data.append("image", image);

    axios
      .put(`/api/assets/${id}`, data)
      .then(() => navigate("/assets"))
      .catch((err) =>
        setErrors(
          err.response?.data?.errors || { form: "Could not save the asset." },
        ),
      );
  };

  return (
    <div className="create-page-container">
      <Header page_title="Edit Asset" backTo="/assets" />

      <main className="form-main-container">
        {!formData ? (
          <p className="edit-status">{errors.form || "Loading…"}</p>
        ) : (
          <form className="asset-form" onSubmit={handleSubmit}>
            {fields.map((f) => (
              <div className="form-group" key={f.name}>
                <label htmlFor={f.name}>{f.label}</label>
                <input
                  id={f.name}
                  name={f.name}
                  value={formData[f.name]}
                  onChange={handleChange}
                />
                {errors[f.name] && (
                  <p className="errorText">{errors[f.name]}</p>
                )}
              </div>
            ))}

            <div className="form-group">
              <label htmlFor="image">Picture (optional)</label>
              {formData.image && (
                <img
                  src={formData.image}
                  alt={formData.name}
                  className="image-preview"
                />
              )}
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
              />
              {errors.image && <p className="errorText">{errors.image}</p>}
            </div>

            {errors.form && <p className="errorText">{errors.form}</p>}

            <button type="submit" className="submit-button">
              Save Changes
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default EditAsset;
