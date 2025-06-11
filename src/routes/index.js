let express = require("express");
let router = express.Router();
let controller = require("../controllers/index");
const validateRequest = require("../middlewares/validateRequest");
const jobSchema = require("../validators/jobCreate");

//All routes for the API
router
  .route("/jobs")
  .post(validateRequest(jobSchema), controller.jobCreate)
  .get(controller.jobAllGet);

router.post("/webhook", function (req, res) {
  console.log("Webhook method:", req.method);
  console.log("Webhook received:", req.body);
  res.status(200).send("Webhook received");
});
module.exports = router;
