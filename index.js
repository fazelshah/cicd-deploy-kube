"use strict";
const querystring = require("querystring");
const { requestHandler } = require("./requestHandler");
const { responseHandler } = require("./responseHandler");
const { HttpNotFoundError } = require("./errors");

const routeRegex = new RegExp(
  /^\/v3(\/[0-9a-f]{8}-[0-9a-f]{4}-[1-9][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}){1,2}\/[\(\)\[\]a-zA-Z0-9_.-]{3,256}$/i
);

exports.handler = async function (event, context, callback) {
  const cryptlexRequestHeaders = { "Content-Type": "application/json" };
  const { config, request, response } = event.Records[0].cf;

  // Function to add CORS headers to response
  const addCorsHeaders = (response) => {
    const corsHeaders = {
      "access-control-allow-origin": [
        { key: "Access-Control-Allow-Origin", value: "*" },
      ],
      "access-control-allow-methods": [
        {
          key: "Access-Control-Allow-Methods",
          value: "GET, POST, OPTIONS, PUT, DELETE",
        },
      ],
      "access-control-allow-headers": [
        {
          key: "Access-Control-Allow-Headers",
          value: "Content-Type, Authorization",
        },
      ],
      "access-control-max-age": [
        { key: "Access-Control-Max-Age", value: "86400" },
      ], // 24 hours
      // Vary header should be added regardless, for best practices
      vary: [{ key: "vary", value: "Origin" }],
    };

    // Check for each CORS header and add if not present
    Object.keys(corsHeaders).forEach((headerKey) => {
      if (!response.headers[headerKey]) {
        // Header is not present, so add it
        response.headers[headerKey] = corsHeaders[headerKey];
      }
    });
    return response;
  };
  try {
    const queryParams = querystring.parse(request.querystring);
    if (request.headers["authorization"]) {
      cryptlexRequestHeaders["Authorization"] =
        request.headers["authorization"][0].value;
    }
    if (request.headers["x-forwarded-for"]) {
      cryptlexRequestHeaders["X-Forwarded-For"] =
        request.headers["x-forwarded-for"][0].value;
    }
    if (config.eventType == "origin-request") {
      if (request.method == "OPTIONS") {
        callback(null, request);
      } else if (!routeRegex.test(request.uri)) {
        console.log("Invalid request url:", request.uri);
        throw new HttpNotFoundError();
      } else {
        const updatedRequest = await requestHandler(
          request,
          queryParams,
          cryptlexRequestHeaders
        );
        callback(null, updatedRequest);
      }
    } else if (config.eventType == "origin-response") {
      if (request.method == "OPTIONS") {
        callback(null, response);
      } else {
        const updatedResponse = await responseHandler(
          request,
          response,
          cryptlexRequestHeaders
        );
        updatedResponse.headers["cache-control"] = [
          { key: "Cache-Control", value: "max-age=0" },
        ];
        callback(null, addCorsHeaders(updatedResponse));
      }
    }
  } catch (error) {
    console.log("Request:", request);
    console.log("Request Headers:", JSON.stringify(request.headers));
    console.log("Response:", response);
    console.log("Error:", error);
    const errorResponse = {
      status: error.status || "500",
      statusDescription: error.statusDescription || "Internal Server Error",
      headers: {
        "cache-control": [{ key: "Cache-Control", value: "max-age=0" }],
      },
    };
    callback(null, addCorsHeaders(errorResponse));
  }
};
