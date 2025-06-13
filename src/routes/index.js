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

router.post("/webhook", controller.webhook);
module.exports = router;
