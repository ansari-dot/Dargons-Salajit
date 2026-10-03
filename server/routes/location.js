const express = require("express");

const router = express.Router();

const {
    getLocationController,
} = require("../controllers/locationController.controller");

// GET /api/location?ip=1.2.3.4
router.get(
    "/",
    getLocationController
);

module.exports = router;