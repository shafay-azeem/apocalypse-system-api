const express = require("express");
const { survivorCreate, updateLocation, flagInfected, tradeItems, percentageInfectedSurvivor, percentageNonInfectedSurvivor, pointLoss, averageAmount } = require("../controllers/survivorController");



const router = express.Router();

// Survivor Controller functions

router.route("/createSurvivor").post(survivorCreate);// This endpoint handles creating a new survivor

router.route("/updateLocation/:survivorId").put(updateLocation); // This endpoint handles updating the location of a survivor

router.route("/flagInfected/:nonInfected").put(flagInfected); // This endpoint handles flagging a survivor as infected

router.route("/tradeItems").post(tradeItems);// This endpoint handles to do trade between noninfected survivors

//---------REPORT APIS--------------//


router.route("/percentageInfectedSurvivor").get(percentageInfectedSurvivor) // Percentage of infected survivors.

router.route("/percentageNonInfectedSurvivor").get(percentageNonInfectedSurvivor) //Percentage of non-infected survivors.

router.route("/pointLoss").get(pointLoss) //Points lost because of infected survivor.

router.route("/averageAmount").get(averageAmount) //Average amount of each kind of resource by survivor



module.exports = router;