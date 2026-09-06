"use strict";

const express = require("express");

const router = express.Router();

const {
    getPNRStatus
} = require("../services/pnrService");


/* =========================================================
   GET PNR STATUS
   GET /api/pnr/:pnr
========================================================= */

router.get(
    "/:pnr",
    async (req, res, next) => {

        try {

            const pnr =
                String(
                    req.params.pnr || ""
                ).trim();


            /* =============================================
               VALIDATE PNR
            ============================================= */

            if (!/^\d{10}$/.test(pnr)) {

                return res.status(400).json({

                    success: false,

                    error: {
                        code: "INVALID_PNR",
                        message:
                            "PNR must be exactly 10 digits."
                    }

                });

            }


            /* =============================================
               FETCH PNR STATUS
            ============================================= */

            const result =
                await getPNRStatus(pnr);


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
                "PNR ROUTE ERROR:",
                error
            );

            next(error);

        }

    }
);


module.exports = router;