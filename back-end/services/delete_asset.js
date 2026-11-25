const express = require("express");
const { getAssets, removeAsset } = require("./purchase_asset");
const members = require("../mock-data/members.json");

const router = express.Router();

router.delete("/api/assets/:id", (req, res) => {
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
      message: "Only members of this household can delete its items.",
    });
  }

  removeAsset(asset.id);
  res.json({ status: "success", deletedId: asset.id });
});

module.exports = router;
