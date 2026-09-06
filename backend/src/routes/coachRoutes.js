"use strict";

const express = require("express");

const router = express.Router();

const {
    getCoachPosition
} = require("../services/coachService");


/* =========================================================
   GET COACH POSITION
   GET /api/coaches/:trainNumber/:stationCode
========================================================= */

router.get(
    "/:trainNumber/:stationCode",
    async (req, res, next) => {

        try {

            const trainNumber =
                String(
                    req.params.trainNumber || ""
                ).trim();


            const stationCode =
                String(
                    req.params.stationCode || ""
                )
                    .trim()
                    .toUpperCase();


            /* =============================================
               FETCH COACH POSITION
            ============================================= */

            const result =
                await getCoachPosition(
                    trainNumber,
                    stationCode
                );


            /* =============================================
               SUCCESS RESPONSE
            ============================================= */

            return res.status(200).json({

                success: true,

                data:
                    result.data || result

            });

        } catch (error) {

            console.error(
                "Coach Position Route ERROR:",
                error
            );

            next(error);

        }

    }
);


module.exports = router;