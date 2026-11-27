const express = require("express");
const fs = require("fs");
const { getAssets, uploadImage, validateAsset } = require("./purchase_asset");

const router = express.Router();

const findAsset = (req, res, next) => {
  const asset = getAssets().find((a) => a.id === Number(req.params.id));

  if (!asset) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res
      .status(404)
      .json({ status: "error", message: "Asset not found." });
  }

  req.asset = asset;
  next();
};

router.get("/api/assets/:id", findAsset, (req, res) => {
  res.json(req.asset);
});

router.put(
  "/api/assets/:id",
  uploadImage,
  findAsset,
  validateAsset,
  (req, res) => {
    const asset = req.asset;
    const price = Number(req.body.price);
    const paidBy = req.paidByNames.join(", ");
    const description = String(req.body.description ?? "").trim();

    asset.asset_name = String(req.body.name).trim();
    asset.price = price;
    asset.date = String(req.body.date).trim();
    asset.paidBy = paidBy;
    asset.description = description;
    if (req.file) {
      asset.image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    res.json({ status: "success", asset });
  },
);

module.exports = router;
