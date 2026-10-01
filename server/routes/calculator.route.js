const express = require("express");

const {
    calculateCostController,
    getCalculatorOptionsController
} = require("../controllers/calculator.controller");


const router = express.Router();


router.get(
    "/options",
    getCalculatorOptionsController
);


router.post(
    "/calculate",
    calculateCostController
);


module.exports = router;