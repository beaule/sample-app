/***********************************
 * session singleton to access and initialize http session
 ************************************/

/***********************************
 * Module dependencies.
 * @private
 ************************************/

/***********************************
 * Private constants.
 ************************************/

/***********************************
 * Private properties
 ************************************/

/***********************************
 * Module exports.
 ************************************/
module.exports = {
  setUserAccessToken: function (req, userAccessToken) {
    req.session.userAccessToken = userAccessToken;
  },
  getUserAccessToken: function (req) {
    return req.session.userAccessToken;
  }
};
