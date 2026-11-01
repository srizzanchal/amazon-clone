import { HttpError } from "../utils/httpError.js";

export const notFound = (req, res, next) => next(new HttpError(404, `Not found - ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body too large";
  } else if (err.name === "ValidationError" || err.name === "CastError") {
    status = 400;
  } else if (err.code === 11000) {
    status = 409;
    message = "That value is already in use";
  }

  const isProd = process.env.NODE_ENV === "production";
  if (status >= 500) {
    console.error(err);
    if (isProd) message = "Internal server error"; // never leak internals in production
  }
  res.status(status).json({ message, ...(!isProd && status >= 500 && { stack: err.stack }) });
};
