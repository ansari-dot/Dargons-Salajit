const express = require("express");

const {

   createCalculatorRequestController,
    getAllCalculatorRequestsController,
    getCalculatorRequestByIdController,
    updateCalculatorRequestStatusController,
    getUserRequestsController
} = require("../controllers/calculatorRequest.controller");


const router = express.Router();


// User submits quotation request

router.post(
    "/",
    createCalculatorRequestController
);


// Admin gets all quotation requests

router.get(
    "/admin",
    getAllCalculatorRequestsController
);


// Get single quotation request

router.get(
    "/:id",
    getCalculatorRequestByIdController
);


// Admin approves / rejects

router.patch(
    "/:id/status",
    updateCalculatorRequestStatusController
);


// User gets their requests

router.get(
    "/user/:userId",
    getUserRequestsController
);


module.exports = router;