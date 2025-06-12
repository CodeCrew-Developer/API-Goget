let express = require("express");
let router = express.Router();
let controller = require("../controllers/index");
const validateRequest = require("../middlewares/validateRequest");
const jobSchema = require("../validators/jobCreate");
const api = require("../configs/shopify");

//All routes for the API
router
  .route("/jobs")
  .post(validateRequest(jobSchema), controller.jobCreate)
  .get(controller.jobAllGet);
  
router.delete("/jobs/cancel/:id", controller.jobCancel);

// api.create().then(() => {
//   console.log("Fulfillment created successfully");
// }).catch((error) => {
//   console.error("Error creating fulfillment:", error);
// });
router.post("/webhook", function (req, res) {
  console.log("Webhook method:", req.method);
  console.log("Webhook received:", req.body);
  res.status(200).send("Webhook received");
});
module.exports = router;
