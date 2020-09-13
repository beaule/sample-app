/***********************************
 * index route
 ************************************/
/***********************************
 * Module dependencies.
 * @private
 ************************************/
var express = require("express");
var router = express.Router();
import Consent from "../server/lib/utils/consent";
import request from "request";

/* POST generate privacy center widget */
router.get("/auth/demo/privacyCenter/createWidget", function (req, res, next) {
  var consentReceiptSelected = req.session.workbenchConsentReceiptSelected;
  Consent.getConsentReceiptChain(
    req.session.applicationAccessToken,
    consentReceiptSelected,
    null,
    function (consentReceipt) {
      if (consentReceipt != null) {
        renderPrivacyCenterWidget(
          req,
          res,
          consentReceiptSelected,
          consentReceipt
        );
      } else renderPrivacyCenterWidget(req, res, consentReceiptSelected);
    }
  );
});

/* GET generate privacy center widget */
router.get("/auth/workbench/privacyCenter/createWidgetCallback", function (
  req,
  res,
  next
) {
  var consentReceiptSelected = req.session.workbenchConsentReceiptSelected;
  //get authorization code
  var code = req.query.code;
  if (code != null) {
    //get token
    Authentication.getUserTokensFromCode(
      req,
      req.session.clientId,
      req.session.clientSecret,
      code,
      function (response) {
        if (response != null) {
          //store access token in session
          var applicationUser = Authentication.setApplicationUser(
            req,
            response
          );

          Consent.getConsentReceiptChain(
            req.session.applicationAccessToken,
            consentReceiptSelected,
            null,
            function (consentReceipt) {
              if (consentReceipt != null) {
                //store in session for second call to show the graph
                req.session.privacyCenterConsentReceipt = consentReceipt;
                Consent.getConsentsChain(
                  req.session.applicationAccessToken,
                  consentReceiptSelected,
                  applicationUser[consentReceiptSelected].user_id,
                  req.session.clientId,
                  function (consents) {
                    renderPrivacyCenterWidget(
                      req,
                      res,
                      consentReceiptSelected,
                      consentReceipt,
                      consents,
                      true,
                      applicationUser[consentReceiptSelected].user_id
                    );
                  }
                );
              } else
                renderPrivacyCenterWidget(req, res, consentReceiptSelected);
            }
          );
        } else renderError(req, res, "Error occur during authorization flow");
      }
    );
  } else renderError(req, res, "Error occur during authorization flow");
});

/* GET generate graph data sources for privacy center widget */
router.get("/auth/workbench/privacyCenter/graph", function (req, res, next) {
  renderPrivacyCenterGraph(req, res, req.session.privacyCenterConsentReceipt);
});
