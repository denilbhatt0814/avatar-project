const { Avatar, validateAvatar } = require("../models/avatar.model");
const HTTPError = require("../utils/HTTPError");
const HTTPResponse = require("../utils/HTTPResponse");
const sharp = require("sharp");
const uploadToS3 = require("../utils/uploadToS3");

exports.createAvatar = async (req, res) => {
  try {
    const data = req.body;

    const validationResult = validateAvatar(data);
    if (!validationResult.success) {
      return new HTTPError(
        res,
        400,
        "Field validation failed!",
        validationResult.error.flatten().fieldErrors
      );
    }

    const { name, gender, description, heightInCM } = data;

    const newAvatar = await Avatar.create({
      name,
      gender,
      description,
      heightInCM,
    });

    return new HTTPResponse(
      res,
      true,
      201,
      "Avatar created successfully!",
      null,
      { avatar: newAvatar }
    );
  } catch (error) {
    console.log(error);
    return new HTTPError(res, 500, error, "internal server error");
  }
};

exports.getAllAvatars = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filter = {
      isAvailable: true, // this can be modified further with RBAC
    };

    const totalAvatars = await Avatar.countDocuments(filter);
    const totalPages = Math.ceil(totalAvatars / limit);
    const skip = (page - 1) * limit;
    const avatars = await Avatar.find(filter)
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit);

    return new HTTPResponse(res, true, 200, null, null, {
      result: avatars,
      count: avatars.length,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log("getAllAvatars:", error);
    return HTTPError(res, 500, error, "internal server error");
  }
};

exports.getAvatarByID = async (req, res) => {
  try {
    const avatarID = req.params.avatarID;
    const avatar = await Avatar.findById(avatarID);

    if (!avatar) {
      return new HTTPError(
        res,
        404,
        `Avatar with ID [${avatarID}] does not exist.`,
        "resource not found"
      );
    } else if (!avatar.isAvailable) {
      // This can be further modified based on RBAC
      return new HTTPError(
        res,
        403,
        `Avatar with ID [${avatarID}] not available.`,
        "resource not accessible"
      );
    }

    return new HTTPResponse(res, true, 200, null, null, {
      avatar,
    });
  } catch (error) {
    console.log("getAvatarByID:", error);
    return new HTTPError(res, 500, error, "internal server error");
  }
};

exports.updateAvatarByID = async (req, res) => {
  try {
    const avatarID = req.params.avatarID;
    const { name, gender, description, heightInCM } = req.body;

    // input validation
    if (!name && !gender && !description && !heightInCM) {
      return new HTTPError(
        res,
        400,
        "At least one field (name, gender, description, heightInCM) must be provided for update.",
        "insufficient data"
      );
    }

    // check if the avatar exists
    const existingAvatar = await Avatar.findById(avatarID);
    if (!existingAvatar) {
      return new HTTPError(
        res,
        404,
        `Avatar with ID [${avatarID}] not available.`,
        "avatar not found"
      );
    }

    // Update fields if provided
    if (name) existingAvatar.name = name;
    if (gender) existingAvatar.gender = gender;
    if (description) existingAvatar.description = description;
    if (heightInCM) existingAvatar.heightInCM = heightInCM;

    const validationResult = validateAvatar(existingAvatar);
    if (!validationResult.success) {
      return new HTTPError(
        res,
        400,
        "Field validation failed!",
        validationResult.error.flatten().fieldErrors
      );
    }

    const updatedAvatar = await existingAvatar.save();

    return new HTTPResponse(
      res,
      true,
      200,
      "Avatar updated successfully!",
      null,
      { avatar: updatedAvatar }
    );
  } catch (error) {
    console.error("updateAvatarByID:", error);
    return new HTTPError(res, 500, error, "Internal server error.");
  }
};

exports.deleteAvatarByID = async (req, res) => {
  try {
    const avatarID = req.params.avatarID;

    const avatar = await Avatar.findByIdAndDelete(avatarID);
    if (!avatar) {
      return new HTTPError(
        res,
        404,
        `Avatar with ID [${avatarID}] does not exist.`,
        "resource not found"
      );
    } else if (!avatar.isAvailable) {
      // This can be further modified based on RBAC
      return new HTTPError(
        res,
        403,
        `Avatar with ID [${avatarID}] not available.`,
        "resource not accessible"
      );
    }

    return new HTTPResponse(
      res,
      true,
      200,
      "Mission deleted successfully!",
      null,
      {
        avatar,
      }
    );
  } catch (error) {
    console.log("deleteAvatarByID: ", error);
    return new HTTPError(res, 500, error, "internal server error");
  }
};

exports.updateAvatarIMGByID = async (req, res) => {
  try {
    const avatarID = req.params.avatarID;
    let avatar = await Avatar.findById(avatarID);

    if (!avatar) {
      return new HTTPError(
        res,
        404,
        `Avatar with ID [${avatarID}] does not exist.`,
        "resource not found"
      );
    } else if (!avatar.isAvailable) {
      // This can be further modified based on RBAC
      return new HTTPError(
        res,
        403,
        `Avatar with ID [${avatarID}] not available.`,
        "resource not accessible"
      );
    }
    if (!("image" in req.files)) {
      return new HTTPError(
        res,
        400,
        "image not found in request",
        "bad request"
      );
    }

    const saveResp = await storeAvatarImage(avatar, req.files.image);
    // save link and id for the new image
    avatar.image = {
      id: saveResp.ETag.replaceAll('"', ""), // need to remove some extra char.
      secure_url: saveResp.object_url,
    };

    avatar = await avatar.save();
    return new HTTPResponse(
      res,
      true,
      200,
      "Avatar image updated successfully!",
      null,
      {
        avatar,
      }
    );
  } catch (error) {
    console.log(error);
    return new HTTPError(res, 500, error, "internal server error");
  }
};

const storeAvatarImage = async (avatar, image) => {
  try {
    const convertedBuffer = await sharp(image.data).toFormat("webp").toBuffer();
    let data = await uploadToS3(
      "avatar-internship-assignment",
      avatar._id + ".webp", // converting to webp since optimized for web
      convertedBuffer
    );
    return data;
  } catch (error) {
    throw error;
  }
};
