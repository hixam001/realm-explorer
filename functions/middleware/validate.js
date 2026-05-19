function validate(requiredFields) {
  return function (req, res, next) {
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        return res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
      }
    }
    next();
  };
}

module.exports = validate;
