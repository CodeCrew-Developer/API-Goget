const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    job_id: {
      type: String,
      required: true,
    },
    order: {
      id: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
      },
      customer: {
        firstName: {
          type: String,
          required: true,
        },
        lastName: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
        },
      },
      fulfillmentOrders: [
        {
          fulfillmentOrderId: {
            type: String,
          },
          fullfillmentOrderLineItems: [
            {
              id: {
                type: String,
                required: true,
              },
              quantity: {
                type: Number,
                required: true,
              },
            },
          ],
        },
      ],
    },
    fulfillmentId: {
      type: String,
    },
    pickUpDateAndTime: {
      type: String,
    },
    dropOffDateAndTime: {
      type: String,
    },
    job_status: {
      type: String,
      enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OrderDetails", orderSchema);
