const express =
  require("express");


const router =
  express.Router();


router.get(
  "/",
  (req, res) => {

    res.json({

      success: true,

      service:
        "RailTrack Backend",

      status:
        "connected",

      time:
        new Date().toISOString()

    });

  }
);


module.exports =
  router;