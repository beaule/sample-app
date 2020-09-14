/***********************************************************
 * Digital Progile API - Authorization
 ***********************************************************/
/***********************************
 * Module dependencies.
 * @private
 ************************************/

/***********************************
 * Private constants.
 ************************************/
const ROOT_PATH = "https://passport.datavillage.me/oauth/";

/***********************************
 * Private properties
 ************************************/

/***********************************
 * Private functions
 ************************************/
function _authorize(clientId, callback, consentReceiptUri) {
  return (
    ROOT_PATH +
    "authorize?client_id=" +
    clientId +
    "&redirect_uri=" +
    callback +
    "&response_type=code&scope=" +
    consentReceiptUri +
    "&state=empty"
  );
}

/***********************************
 * Module exports.
 ************************************/
module.exports = {
  ROOT_PATH: ROOT_PATH,
  authorize: function (clientId, callback, consentReceiptUri) {
    return _authorize(clientId, callback, consentReceiptUri);
  },
  deAuthorize: function () {
    return ROOT_PATH + "deauthorize";
  }
};
