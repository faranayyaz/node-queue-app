const { getAuth } = require("firebase-admin/auth");

const isAuthenticated = (req, res, next) => {
  if (req.headers.authorization) {
    const idToken = req.headers.authorization.split(" ")[1];
    console.log("Verifying idToken...");
    // console.log("Id token: " + idToken);
    getAuth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        const uid = decodedToken.uid;
        console.log("uid retrieved");
        // console.log(`uid: ${uid}`);
        req.uid = uid;
        next();
      })
      .catch((error) => {
        const { errorInfo } = error;
        if (errorInfo) {
          console.log(errorInfo);
          return res
            .status(403)
            .setHeader("Content-Type", "application/json")
            .send({
              error: "Unauthorized",
              code: errorInfo.code,
              message: errorInfo.message,
            });
        } else {
          return res.status(500).send("An internal server error has occurred!");
        }
      });
  } else {
    res.sendStatus(400);
  }
};

module.exports = {
  isAuthenticated,
};
