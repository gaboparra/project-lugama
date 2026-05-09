export const errorHandler = (error, req, res, next) => {
  console.error("Unhandled error:", error);

  return res.status(500).json({
    error: "Internal server error",
  });
};
