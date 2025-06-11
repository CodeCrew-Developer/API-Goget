const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessages = error.details.map((err) => err.message);
      return res.status(400).json({ errors: errorMessages[0] });
    }

    req.body = value;
    next();
  };
};


module.exports = validateRequest;
