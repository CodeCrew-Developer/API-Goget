const shopifyApi = require("../configs/shopify");
const apiClient = require("../configs/axios");
const orderDetails = require("../models/orderDetails");
const moment = require("moment-timezone");

module.exports = {
  async jobCreate(req, res) {
    try {
      const startAt = moment
        .tz(req.body.pickUpDateAndTime, "YYYY-MM-DD HH:mm", "Asia/Singapore")
        .utc()
        .format();
      console.log("Request body:", JSON.stringify(req.body));
      const data = {
        pickup: {
          name: req.body.item,
          location: req.body.pickUpLocation,
          location_lat: parseFloat(req.body.pickUpLatitude),
          location_long: parseFloat(req.body.pickUpLongitude),
          parking: false,
          start_at: startAt,
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
      console.log("Job created successfully:", job);
      // const customerEmail = req.body.order?.customer?.email || "";

      const shopifyReponse = await shopifyApi.create({
        fulfillmentOrders: req.body.order.fulfillmentOrders,
        trackingNumber: job.tracking_id,
        trackingUrl: job.tracking_url,
        trackingCompany: "GoGet",
      });

      if (shopifyReponse?.userErrors && shopifyReponse?.userErrors.length > 0) {
        throw new Error(shopifyReponse.userErrors[0].message);
      }
      const shopifyFulfillmentId = shopifyReponse.fulfillment.id;
      // if (customerEmail) {
      //   await transporter.sendMail({
      //     from: process.env.EMAIL_FROM,
      //     to: customerEmail,
      //     subject: "Order Confirmation",
      //     text: `Your order for ${req.body.item} has been created successfully. Your job ID is ${job.id}. Tracking url is ${job.tracking_url}.`,
      //   });
      // }

      const orderData = {
        job_id: job.id,
        item: req.body.item,
        order: req.body.order,
        pickUpDateAndTime: startAt,
        fulfillmentId: shopifyFulfillmentId || "",
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
        const orderData = await orderDetails.findOne({
          job_id: jobId,
        });
        await shopifyApi.cancel({
          fulfillmentId: orderData.fulfillmentId,
        });
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
  async webhook(req, res) {
    try {
      const data = req.body;
      let orderData;
      console.log("Webhook received with data:", data);
      if (data.status === "cancelled") {
        orderData = await orderDetails.findOne({
          job_id: data.id,
        });
        await shopifyApi.cancel({
          fulfillmentId: orderData.fulfillmentId,
        });
        await orderDetails.updateOne(
          { job_id: data.id },
          { job_status: "cancelled" }
        );
      } else if (data.status === "completed") {
        orderData = await orderDetails.findOne({
          job_id: data.id,
          job_status: { $ne: "completed" },
        });
        if (!orderData) {
          console.log("No order found for job_id:", data.id);
          return;
        }

        await orderDetails.updateOne(
          { job_id: data.id },
          { job_status: "completed", dropOffDateAndTime: data.completed_at }
        );
      } else if (data.status === "in_progress") {
        orderData = await orderDetails.findOne({
          job_id: data.id,
          job_status: { $ne: "completed" },
        });

        await orderDetails.updateOne(
          { job_id: data.id },
          { job_status: "in_progress" }
        );
      } else if (data.status === "approved") {
        orderData = await orderDetails.findOne({
          job_id: data.id,
          job_status: { $ne: "completed" },
        });

        await orderDetails.updateOne(
          { job_id: data.id },
          { job_status: "accepted" }
        );
      } else {
        console.log("Webhook received with data:", data);
      }
      res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
      console.error("Webhook error:", error);
    }
  },
  async handleShopifyOrderWebhook(req, res) {
    try {
      const order = req.body;
      console.log("Webhook received with shopify data:", JSON.stringify(order));
      fetch("https://ba02-223-182-182-207.ngrok-free.app/api/goget-webhook", {
        body: JSON.stringify(order),
        headers: { "ngrok-skip-browser-warning": true },
      });

      // Extract core info
      const lineItem = order.line_items[0]; // assumes one item per order
      const shipping = order.shipping_address;

      if (!shipping) throw new Error("No shipping address found.");

      // Dummy pickup details (replace with real data or static values)
      const pickUpLocation = "Warehouse, City"; // your fixed pickup location
      const pickUpLatitude = 1.3521;
      const pickUpLongitude = 103.8198;

      const startAt = moment().tz("Asia/Singapore").utc().format();

      const jobData = {
        pickup: {
          name: lineItem.name,
          location: pickUpLocation,
          location_lat: pickUpLatitude,
          location_long: pickUpLongitude,
          parking: false,
          start_at: startAt,
          reference: order.name,
          location_notes: "Pick up from warehouse.",
        },
        dropoff: [
          {
            location: `${shipping.address1}, ${shipping.city}, ${shipping.zip}`,
            location_lat: 0, // optional, can geocode if needed
            location_long: 0, // optional
            parking: false,
            recipient_name: `${shipping.first_name} ${shipping.last_name}`,
            recipient_phone_num: shipping.phone || "00000000",
            sender_name: "Your Shop Name",
            location_notes: shipping.address2 || "",
          },
        ],
        ride_id: 1, // default vehicle ID
        bulky: false,
        reference: order.name,
        non_halal: false,
      };

      const ggtRes = await apiClient.post("/jobs", jobData);
      const job = ggtRes.data.data.job;

      // Fetch fulfillment orders for this order (required to fulfill)
      const fulfillmentOrders = await shopifyApi.getFulfillmentOrders(order.id);

      const shopifyResponse = await shopifyApi.create({
        fulfillmentOrders,
        trackingNumber: job.tracking_id,
        trackingUrl: job.tracking_url,
        trackingCompany: "GoGet",
      });

      if (shopifyResponse.userErrors?.length) {
        throw new Error(shopifyResponse.userErrors[0].message);
      }

      const fulfillmentId = shopifyResponse.fulfillment.id;

      // Optionally, store locally
      await orderDetails.create({
        job_id: job.id,
        item: lineItem.name,
        order,
        pickUpDateAndTime: startAt,
        fulfillmentId,
      });

      res.status(200).json({ message: "Job and fulfillment created." });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(500).json({ error: error?.message || "Internal error" });
    }
  },
};
