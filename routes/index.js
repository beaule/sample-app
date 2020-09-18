/***********************************
 * index route
 ************************************/
/***********************************
 * Module dependencies.
 * @private
 ************************************/
var express = require("express");
var router = express.Router();
var Session = require("../lib/session.js");
var Authorization = require("../lib/api/authorization.js");
var Consents = require("../lib/api/consents.js");
var Cages = require("../lib/api/cages.js");

/* get home */
router.get("/", function (req, res, next) {
  //get consent user access token from refresh token if any
  Session.getUserRefreshToken(function (userRefreshToken) {
    if (userRefreshToken != null) {
      Authorization.refreshUserAccessToken(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        Consents.ROOT_PATH_CONSENT_RECEIPT + process.env.CONSENT_RECEIPT_ID,
        userRefreshToken,
        function (response) {
          if (response != null) {
            //store access token in session
            Session.setUserAccessToken(req, response.access_token);
            //store refresh token in file
            Session.storeUserRefreshToken(response.refresh_token);
          } else {
            //set access token in session to null
            Session.setUserAccessToken(req, null);
            //remove refresh token from file
            Session.deleteUserRefreshToken();
          }
          renderHome(req, res);
        }
      );
    } else renderHome(req, res);
  });
});

/* Authorize callback and Import data*/
router.get("/callback", function (req, res, next) {
  var code = req.query.code;
  if (code != null) {
    //get consent user access token from code
    Authorization.getUserAccessToken(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      code,
      function (response) {
        if (response != null) {
          //store access token in session
          Session.setUserAccessToken(req, response.access_token);
          //store refresh token in file
          Session.storeUserRefreshToken(response.refresh_token);
          //import personal data into the personal data store
          Cages.importData(
            Session.getUserAccessToken(req),
            process.env.CONSENT_RECEIPT_ID,
            process.env.IMPORT_START_DATE,
            process.env.IMPORT_END_DATE,
            function (response) {
              if (response != null) {
                renderHome(req, res);
              } else
                renderError(req, res, "Error occur during import data flow");
            }
          );
        } else renderError(req, res, "Error occur during authorization flow");
      }
    );
  } else renderError(req, res, "Error occur during authorization flow");
});

/* Load data */
router.get("/loadAndEnrich", function (req, res, next) {
  //Load data from the personal data store into the data cage (confidenital graph engine)
  Cages.loadData(
    Session.getUserAccessToken(req),
    process.env.CONSENT_RECEIPT_ID,
    function (response) {
      if (response != null) {
        //apply enrichment on the graph if needed
        //example apply temporal enrichment
        Cages.applyTemporalEnrichment(
          Session.getUserAccessToken(req),
          function (response) {
            if (response != null) {
              renderHome(req, res);
            } else
              renderError(
                req,
                res,
                "Error occur during temporal enrichment flow"
              );
          }
        );
      } else
        renderError(req, res, "Error occur during load data and enrich flow");
    }
  );
});

/* simple query digital twin  */
router.get("/simpleQueryDigitalTwin", function (req, res, next) {
  //query digital twin into the data cage (confidenital graph engine)
  var query = {
    query:
      "{  Person  {    uri     actions    {      uri      type      description      distance      startTime      {        year        month        day        hour        minute        second        formatted      }      endTime      {        year        month        day        hour        minute        second        formatted      }      physicalActivity      {        uri        category        additionalType      }    }  }}",
    variables: {}
  };

  Cages.queryDigitalTwin(Session.getUserAccessToken(req), query, function (
    response
  ) {
    if (response != null) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response.data));
    } else res.writeHead(401, { "Content-Type": "application/json" });
    res.end("Error occur during query digital twin flow");
  });
});

/* advanced query digital twin  */
router.get("/advancedQueryDigitalTwin", function (req, res, next) {
  //query digital twin into the data cage (confidenital graph engine)
  var query = {
    query:
      '{  Person  {    uri     actions (filter: {startTime_lt: { year: 2020 } physicalActivity:{category: "Running"}})    {      description      distance      startTime       {        year      }      physicalActivity       {        category      }    }  }}',
    variables: {}
  };

  Cages.queryDigitalTwin(Session.getUserAccessToken(req), query, function (
    response
  ) {
    if (response != null) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response.data));
    } else res.writeHead(401, { "Content-Type": "application/json" });
    res.end("Error occur during query digital twin flow");
  });
});

/**
 * render  home
 * @param {req} request
 * @param {res} response
 */
function renderHome(req, res) {
  res.render("home", {
    layout: "master",
    actionActivateConsent: Authorization.authorize(
      process.env.CLIENT_ID,
      process.env.APP_URL + "callback",
      Consents.ROOT_PATH_CONSENT_RECEIPT + process.env.CONSENT_RECEIPT_ID
    ),
    actionRevokeConsent: Authorization.deAuthorize()
  });
}

/**
 * render error
 * @param {req} request
 * @param {res} response
 */
function renderError(req, res, error) {
  res.render("error", {
    layout: "master",
    title: "Error",
    message: error
  });
}

module.exports = router;
