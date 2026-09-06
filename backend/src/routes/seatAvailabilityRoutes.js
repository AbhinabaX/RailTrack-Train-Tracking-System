const express = require("express");

const {
    getSeatAvailability
} = require("../services/seatAvailabilityService");


const router = express.Router();


/* =====================================================
   SEAT AVAILABILITY
   GET /api/seats/:trainNumber
===================================================== */

router.get(
    "/:trainNumber",
    async (req, res, next) => {

        try {

            const trainNumber =
                String(
                    req.params.trainNumber || ""
                ).trim();


            const source =
                String(
                    req.query.source || ""
                ).trim();


            const destination =
                String(
                    req.query.destination || ""
                ).trim();


            const journeyDate =
                String(
                    req.query.journeyDate || ""
                ).trim();


            const classCode =
                String(
                    req.query.classCode || ""
                ).trim();


            const quotaCode =
                String(
                    req.query.quotaCode || "GN"
                ).trim();


            console.log("");
            console.log(
                "======================================"
            );
            console.log(
                "SEAT AVAILABILITY ROUTE"
            );
            console.log(
                "TRAIN:",
                trainNumber
            );
            console.log(
                "SOURCE:",
                source
            );
            console.log(
                "DESTINATION:",
                destination
            );
            console.log(
                "JOURNEY DATE:",
                journeyDate
            );
            console.log(
                "CLASS:",
                classCode
            );
            console.log(
                "QUOTA:",
                quotaCode
            );
            console.log(
                "======================================"
            );


            /* =========================================
               BASIC VALIDATION
            ========================================= */

            if (
                !trainNumber ||
                !source ||
                !destination ||
                !journeyDate ||
                !classCode
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Train number, source, destination, journey date and class are required."

                });

            }


            /* =========================================
               CALL RAILRADAR SERVICE
            ========================================= */

            const data =
                await getSeatAvailability({

                    trainNumber,

                    source,

                    destination,

                    journeyDate,

                    classCode,

                    quotaCode

                });


            /* =========================================
               SUCCESS RESPONSE
            ========================================= */

            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "Seat Availability Route ERROR:",
                error
            );

            next(error);

        }

    }
);


module.exports = router;