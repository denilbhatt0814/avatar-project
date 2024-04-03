const mongoose = require("mongoose");
const { object, string, enum: _enum, number } = require("zod");

const avatarZodSchema = object({
  name: string().max(100),
  gender: _enum(["M", "F", "O"]),
  description: string().max(500).optional(),
  heightInCM: number().min(120).max(215),
});

const avatarSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxLen: [100, "Avatar name should be less than 100 characters."],
      required: [true, "Avatar name missing."],
    },
    gender: {
      type: String,
      enum: ["M", "F", "O"],
      required: [true, "Avatar's gender must be specified."],
    },
    description: {
      type: String,
      maxLen: [500, "Avatar's description should be less than 500 characters."],
      default: "N/A",
    },
    heightInCM: {
      type: Number,
      validate: {
        validator: function (_height) {
          // keeping height b/w 4ft - 7ft
          return _height >= 120 && _height <= 215;
        },
        message: "Avatar's height should be between 120cm to 215cm.",
      },
      required: [true, "Avatar's height is missing."],
    },
    image: {
      id: { type: String },
      secure_url: { type: String, default: selectRandomImage },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

function selectRandomImage() {
  let url = "https://avatar-internship-assignment.s3.ap-south-1.amazonaws.com/";
  listOfImages = ["avatar-random-1.webp", "avatar-random-2.webp"];
  let image =
    url + listOfImages[Math.floor(Math.random() * listOfImages.length)];
  return image;
}

const validateData = function (data) {
  return avatarZodSchema.safeParse(data);
};

module.exports = {
  Avatar: mongoose.model("Avatar", avatarSchema),
  validateAvatar: validateData,
};
