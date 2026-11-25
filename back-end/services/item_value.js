const express = require("express");
const { getAssets } = require("./purchase_asset");
const members = require("../mock-data/members.json");

const router = express.Router();
const getCurrentValue = (asset) => asset.current_value ?? Number(asset.price);

const checkValue = (input) => {
  const v = String(input ?? "").trim();
  if (v === "") return "Value is required.";
  if (v.startsWith("-")) return "Value cannot be negative.";
  if (!/^\d+(\.\d{1,2})?$/.test(v))
    return "Value must be a number with at most two decimals.";
  return null;
};

router.get("/api/assets/:id/value", (req, res) => {
  const asset = getAssets().find((a) => a.id === Number(req.params.id));
  if (!asset) {
    return res
      .status(404)
      .json({ status: "error", message: "Asset not found." });
  }
  res.json({
    id: asset.id,
    asset_name: asset.asset_name,
    price: asset.price,
    currentValue: getCurrentValue(asset),
  });
});

router.put("/api/assets/:id/value", (req, res) => {
  const asset = getAssets().find((a) => a.id === Number(req.params.id));
  if (!asset) {
    return res
      .status(404)
      .json({ status: "error", message: "Asset not found." });
  }

  const memberId = Number(req.body?.memberId);
  const isMember = members.some(
    (m) => m.id === memberId && m.household_ids.includes(asset.household_id),
  );
  if (!isMember) {
    return res.status(403).json({
      status: "error",
      message: "Only members of this household can update its value.",
    });
  }

  const valueError = checkValue(req.body?.value);
  if (valueError) {
    return res
      .status(400)
      .json({ status: "error", errors: { value: valueError } });
  }

  asset.current_value = Number(req.body.value);

  res.json({
    status: "success",
    id: asset.id,
    asset_name: asset.asset_name,
    price: asset.price,
    currentValue: asset.current_value,
  });
});

module.exports = { router, getCurrentValue, checkValue };
