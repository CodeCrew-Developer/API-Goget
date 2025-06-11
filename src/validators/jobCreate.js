const Joi = require("joi");

const jobSchema = Joi.object({
  item: Joi.string().required().messages({
    "string.base": "Item must be a string.",
    "any.required": "Item is required.",
  }),
  order: Joi.object().optional(),
  pickUpDateAndTime: Joi.string().required().messages({
    "any.required": "Pick-up date and time is required.",
    "string.base": "Pick-up date and time must be a string.",
  }),
  pickUpLocation: Joi.string().required().messages({
    "string.base": "Pick-up location must be a string.",
    "any.required": "Pick-up location is required.",
  }),
  pickUpLatitude: Joi.string().required().messages({
    "string.base": "Pick-up latitude must be a string.",
    "any.required": "Pick-up latitude is required.",
  }),
  pickUpLongitude: Joi.string().required().messages({
    "string.base": "Pick-up longitude must be a string.",
    "any.required": "Pick-up longitude is required.",
  }),
  dropOffLocation: Joi.string().required().messages({
    "string.base": "Drop-off location must be a string.",
    "any.required": "Drop-off location is required.",
  }),
  dropOffLatitude: Joi.string().required().messages({
    "string.base": "Drop-off latitude must be a string.",
    "any.required": "Drop-off latitude is required.",
  }),
  dropOffLongitude: Joi.string().required().messages({
    "string.base": "Drop-off longitude must be a string.",
    "any.required": "Drop-off longitude is required.",
  }),
  receiverName: Joi.string().required().messages({
    "string.base": "Receiver name must be a string.",
    "any.required": "Receiver name is required.",
  }),
  receiverPhone: Joi.string().required().messages({
    "string.base": "Receiver phone must be a string.",
    "any.required": "Receiver phone is required.",
  }),
  senderName: Joi.string().required().messages({
    "string.base": "Sender name must be a string.",
    "any.required": "Sender name is required.",
  }),
  senderPhone: Joi.string().required().messages({
    "string.base": "Sender Phone must be a string.",
    "any.required": "Sender Phone is required.",
  }),
  reference: Joi.string().required().messages({
    "string.base": "Reference must be a string.",
    "any.required": "Reference is required.",
  }),
  bulky: Joi.boolean().optional(),
  nonHalal: Joi.boolean().optional(),
  vehicle: Joi.number().required().messages({
    "number.base": "Vehicle must be a number.",
    "any.required": "Vehicle is required.",
  }),
  pickUpLocationNote: Joi.string().optional().allow(""),
  dropOffLocationNote: Joi.string().optional().allow("")
});

module.exports = jobSchema;
