const shopifyApi = require("../configs/shopify");
const apiClient = require("../configs/axios");
const transporter = require("../configs/nodemailer");
const orderDetails = require("../models/orderDetails");

function parseCustomDate(dateString) {
  const normalized =
    dateString.includes(":") && dateString.split(":").length === 2
      ? `${dateString}:00`
      : dateString;

  const isoString = normalized.replace(" ", "T") + "Z";
  return new Date(isoString);
}

module.exports = {
  async jobCreate(req, res) {
    try {
      const data = {
        pickup: {
          name: req.body.item,
          location: req.body.pickUpLocation,
          location_lat: parseFloat(req.body.pickUpLatitude),
          location_long: parseFloat(req.body.pickUpLongitude),
          parking: false,
          start_at: parseCustomDate(req.body.pickUpDateAndTime),
          reference: req.body.reference,
          location_notes: req.body.pickUpLocationNote,
        },
        dropoff: [
          {
            location: req.body.dropOffLocation,
            location_lat: parseFloat(req.body.dropOffLatitude),
            location_long: parseFloat(req.body.dropOffLongitude),
            parking: false,
            recipient_name: req.body.receiverName,
            recipient_phone_num: req.body.receiverPhone,
            sender_name: req.body.senderName,
            location_notes: req.body.dropOffLocationNote,
          },
        ],
        ride_id: Number(req.body.vehicle),
        bulky: req.body.bulky,
        reference: req.body.reference,
        non_halal: req.body.nonHalal,
      };
      const response = await apiClient.post("/jobs", data);
      const job = response.data.data.job;
      const customerEmail = req.body.order?.customer?.email || "";
      if (customerEmail) {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: customerEmail,
          subject: "Order Confirmation",
          text: `Your order for ${req.body.item} has been created successfully. Your job ID is ${job.id}. Tracking url is ${job.tracking_url}.`,
        });
      }
      const orderData = {
        job_id: job.id,
        item: req.body.item,
        order: req.body.order,
        pickUpDateAndTime: parseCustomDate(req.body.pickUpDateAndTime),
      };

      await orderDetails.create(orderData);
      res.status(200).json({ message: "Order details created successfully" });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: error?.response?.data?.data.errors || error.message });
    }
  },
  async jobAllGet(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalJobs = await orderDetails.countDocuments();

      const jobs = await orderDetails
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.status(200).json({
        data: jobs,
        pagination: {
          total: totalJobs,
          page,
          limit,
          totalPages: Math.ceil(totalJobs / limit),
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
  async jobCancel(req, res) {
    try {
      const jobId = req.params.id;
      const response = await apiClient.delete(`/jobs/${jobId}`);
      if (response.status === 200) {
        await orderDetails.updateOne(
          { job_id: jobId },
          { job_status: "cancelled" }
        );
        res.status(200).json({ message: "Job cancelled successfully" });
      } else {
        res.status(response.status).json({ error: response.data.message });
      }
    } catch (error) {
      console.log(error.response?.data);
      res
        .status(500)
        .json({ error: error.response?.data.data[0] || error.message });
    }
  },
  async fullFilled() {},
  async webhook(req, res) {
    try {
      const data = req.body;
      switch (data.status) {
        // case "cancelled":
        //   await orderDetails.updateOne(
        //     { job_id: data.id },
        //     { job_status: "cancelled" }
        //   );
        case "cancelled":
          const orderData = await orderDetails.findOne({
            job_id: data.id,
            status: { $ne: "completed" },
          });
          if (!orderData) {
            console.log("No order found for job_id:", data.id);
            return;
          }
          await shopifyApi.create({
            fulfillmentOrderId: orderData.order.fulfillmentOrderId,
            lineItems: orderData.order.lineItems.map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),
            trackingNumber: data.tracking_id,
            trackingUrl: data.tracking_url,
            trackingCompany: "GoGet",
          });
          
          await orderDetails.updateOne({ job_id: data.id }, { job_status: "completed" });

        default:
          console.log("Webhook received with data:", data);
      }
    } catch (error) {
      console.error("Webhook error:", error);
    }
  },
};
