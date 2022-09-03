function errorHandler(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res
      .status(401)
      .send({ message: "The user is not authorized", error: err });
  }
}

export default errorHandler;
