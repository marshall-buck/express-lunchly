"use strict";

/** Express app for Lunchly. */

const Express = require("express");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const routes = require("./routes");
const { NotFoundError } = require("./expressError");

const app = new Express();

// Parse body for urlencoded (traditional form) data
app.use(bodyParser.urlencoded());

nunjucks.configure("templates", {
  autoescape: true,
  express: app,
});

app.use(routes);


/** 404 handler: matches unmatched routes; raises NotFoundError. */
app.use(function (req, res, next) {
  throw new NotFoundError();
});

/** Error handler: logs stacktrace and returns JSON error message. */
app.use(function (err, req, res, next) {
  const status = err.status || 500;
  const message = err.message;
  if (process.env.NODE_ENV !== "test") console.error(status, err.stack);
  return res.status(status).json({ error: { message, status } });
});


module.exports = app;
