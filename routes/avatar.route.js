const express = require("express");
const {
  getAllAvatars,
  createAvatar,
  getAvatarByID,
  updateAvatarByID,
  deleteAvatarByID,
  updateAvatarIMGByID,
} = require("../controllers/avatar.controller");
const router = express.Router();

router.route("/").get(getAllAvatars).post(createAvatar);

router.route("/img/:avatarID").patch(updateAvatarIMGByID);

router
  .route("/:avatarID")
  .get(getAvatarByID)
  .patch(updateAvatarByID)
  .delete(deleteAvatarByID);

module.exports = router;
