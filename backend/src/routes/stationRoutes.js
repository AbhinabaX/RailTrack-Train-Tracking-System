const express =
  require("express");

const trainService =
  require("../services/trainService");


const router =
  express.Router();


router.get(
  "/",
  async (
    req,
    res,
    next
  ) => {

    try {

      const result =
        await trainService
          .getStationList();


      res.json(
        result
      );

    } catch (error) {

      next(error);

    }

  }
);


module.exports =
  router;