const express = require("express");

const trainService = require("../services/trainService");

const router = express.Router();


/* =====================================================
   GET FULL TRAIN DASHBOARD

   Example:
   GET /api/trains/12827/dashboard
   GET /api/trains/12827/dashboard?date=2026-08-13
===================================================== */

router.get(
  "/:number/dashboard",
  async (req, res, next) => {
    try {

      const trainNumber =
        req.params.number;

      const date =
        req.query.date || "";

      console.log("");
      console.log("======================================");
      console.log("TRAIN DASHBOARD REQUEST");
      console.log("TRAIN:", trainNumber);
      console.log("DATE:", date || "AUTO");
      console.log("======================================");

      const result =
        await trainService.getTrainDashboard(
          trainNumber,
          date
        );

      return res.status(200).json(result);

    } catch (error) {

      console.error(
        "Dashboard API ERROR:",
        error
      );

      next(error);
    }
  }
);


/* =====================================================
   GET LIVE TRAIN STATUS

   Example:
   GET /api/trains/12827/live

   Optional:
   GET /api/trains/12827/live?date=2026-08-13
===================================================== */

router.get(
  "/:number/live",
  async (req, res, next) => {
    try {

      const trainNumber =
        req.params.number;

      const date =
        req.query.date || "";

      console.log("");
      console.log("======================================");
      console.log("LIVE TRAIN REQUEST");
      console.log("TRAIN:", trainNumber);
      console.log("DATE:", date || "AUTO");
      console.log("======================================");

      const result =
        await trainService.getTrainDashboard(
          trainNumber,
          date
        );

      return res.status(200).json(result);

    } catch (error) {

      console.error(
        "Live Train API ERROR:",
        error
      );

      next(error);
    }
  }
);


/* =====================================================
   BETWEEN STATIONS

   Example:
   GET /api/trains/between/BQA/MASAGRAM

   Optional:
   GET /api/trains/between/BQA/MASAGRAM?date=2026-08-13
===================================================== */

router.get(
  "/between/:from/:to",
  async (req, res, next) => {
    try {

      const from =
        req.params.from;

      const to =
        req.params.to;

      const date =
        req.query.date || "";

      console.log("");
      console.log("======================================");
      console.log("BETWEEN STATIONS REQUEST");
      console.log("FROM:", from);
      console.log("TO:", to);
      console.log("DATE:", date || "AUTO");
      console.log("======================================");

      const result =
        await trainService.searchBetweenStations(
          from,
          to,
          date
        );

      return res.status(200).json(result);

    } catch (error) {

      console.error(
        "Between Stations API ERROR:",
        error
      );

      next(error);
    }
  }
);


/* =====================================================
   GET STATION LIST

   Example:
   GET /api/trains/stations

   This is useful if frontend needs station
   autocomplete/search.
===================================================== */

router.get(
  "/stations",
  async (req, res, next) => {
    try {

      const result =
        await trainService.getStationList();

      return res.status(200).json(result);

    } catch (error) {

      console.error(
        "Station List API ERROR:",
        error
      );

      next(error);
    }
  }
);


/* =====================================================
   ROUTER ERROR HANDLER

   This keeps API errors in JSON format.
===================================================== */

router.use(
  (error, req, res, next) => {

    console.error(
      "TRAIN ROUTE ERROR:",
      error
    );

    const status =
      Number(error.status) >= 400 &&
      Number(error.status) < 600
        ? Number(error.status)
        : 500;

    return res.status(status).json({

      success: false,

      error:
        error.message ||
        "Unable to fetch train information.",

      message:
        error.message ||
        "Unable to fetch train information."

    });
  }
);


/* =====================================================
   EXPORT
===================================================== */

module.exports = router;