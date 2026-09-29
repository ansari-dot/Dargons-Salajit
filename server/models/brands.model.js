const mongoose = require("mongoose")

const brandSchema = new mongoose.Schema({
    logoUrl: {
        type: String,
        required: true,

    },
    fileName: {
        type: String,
        required: true
    },
     fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
        type: String,
        required: true,
        enum: ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"],
    }
},  {
    timestamps: true,
  })


module.exports = mongoose.module('BrandLogo',brandSchema)