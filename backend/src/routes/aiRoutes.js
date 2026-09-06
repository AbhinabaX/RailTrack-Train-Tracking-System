const express = require("express");

const router = express.Router();


/* =====================================================
   AI INTENT SERVICE
===================================================== */

const {
    parseUserIntent
} = require("../services/aiIntentService");


/* =====================================================
   POST /api/ai/chat
   RailTrack AI Assistant
===================================================== */

router.post(
    "/chat",
    async (req, res, next) => {

        try {

            const {
                message,
                trainNumber,
                trainData,
                journeyDate
            } = req.body;


            console.log("");

            console.log(
                "======================================"
            );

            console.log(
                "RAILTRACK AI REQUEST"
            );

            console.log(
                "MESSAGE:",
                message
            );

            console.log(
                "TRAIN:",
                trainNumber
            );

            console.log(
                "JOURNEY DATE:",
                journeyDate
            );

            console.log(
                "======================================"
            );


            /* =================================================
               VALIDATION
            ================================================= */

            if (
                !message ||
                !String(message).trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Message is required."

                });

            }


            /* =================================================
               BASIC CONTEXT
            ================================================= */

            const question =
                String(message).trim();


            const selectedTrain =
                trainNumber
                    ? String(trainNumber)
                    : null;


            const selectedJourneyDate =
                journeyDate
                    ? String(journeyDate)
                    : null;


            /* =================================================
               NATURAL LANGUAGE INTENT DETECTION
            ================================================= */

            const intentData =
                parseUserIntent(
                    question
                );


            console.log("");

            console.log(
                "======================================"
            );

            console.log(
                "AI INTENT:"
            );

            console.log(
                JSON.stringify(
                    intentData,
                    null,
                    2
                )
            );

            console.log(
                "======================================"
            );


            /* =================================================
               TEMPORARY RESPONSE
               
               এখন আমরা শুধু দেখছি AI user's
               natural language ঠিকভাবে বুঝতে পারছে কি না।

               পরের step-এ এই intent অনুযায়ী
               RailRadar API call করবো।
            ================================================= */

            let answer =
                "Intent understood successfully.";


            /* =================================================
               INTENT BASED BASIC RESPONSE
            ================================================= */

            if (
                intentData.intent ===
                "live_location"
            ) {

                if (
                    intentData.trainNumber ||
                    selectedTrain
                ) {

                    const number =
                        intentData.trainNumber ||
                        selectedTrain;

                    answer =
                        `I understand that you want to check the live location of train ${number}.`;

                } else {

                    answer =
                        "I understand that you want to check your train's live location. Please search or provide a train number.";

                }

            }


            else if (
                intentData.intent ===
                "delay"
            ) {

                if (
                    intentData.trainNumber ||
                    selectedTrain
                ) {

                    const number =
                        intentData.trainNumber ||
                        selectedTrain;

                    answer =
                        `I understand that you want to know whether train ${number} is late or delayed.`;

                } else {

                    answer =
                        "I understand that you want to check the train delay. Please select a train or provide its train number.";

                }

            }


            else if (
                intentData.intent ===
                "eta"
            ) {

                if (
                    intentData.trainNumber ||
                    selectedTrain
                ) {

                    const number =
                        intentData.trainNumber ||
                        selectedTrain;

                    answer =
                        `I understand that you want the ETA of train ${number}.`;

                } else {

                    answer =
                        "I understand that you want to know the train's arrival time. Please select a train or provide its train number.";

                }

            }


            else if (
                intentData.intent ===
                "next_station"
            ) {

                if (
                    intentData.trainNumber ||
                    selectedTrain
                ) {

                    const number =
                        intentData.trainNumber ||
                        selectedTrain;

                    answer =
                        `I understand that you want to know the next station of train ${number}.`;

                } else {

                    answer =
                        "I understand that you want to know the next station. Please select a train or provide its train number.";

                }

            }


            else if (
                intentData.intent ===
                "route"
            ) {

                if (
                    intentData.trainNumber ||
                    selectedTrain
                ) {

                    const number =
                        intentData.trainNumber ||
                        selectedTrain;

                    answer =
                        `I understand that you want to see the route of train ${number}.`;

                } else {

                    answer =
                        "I understand that you want train route information. Please select a train or provide its train number.";

                }

            }


            else if (
                intentData.intent ===
                "speed"
            ) {

                if (
                    intentData.trainNumber ||
                    selectedTrain
                ) {

                    const number =
                        intentData.trainNumber ||
                        selectedTrain;

                    answer =
                        `I understand that you want to know the current speed of train ${number}.`;

                } else {

                    answer =
                        "I understand that you want the train's current speed. Please select a train or provide its train number.";

                }

            }


            else if (
                intentData.intent ===
                "progress"
            ) {

                if (
                    intentData.trainNumber ||
                    selectedTrain
                ) {

                    const number =
                        intentData.trainNumber ||
                        selectedTrain;

                    answer =
                        `I understand that you want to know the journey progress of train ${number}.`;

                } else {

                    answer =
                        "I understand that you want to know the train's journey progress. Please select a train or provide its train number.";

                }

            }


            else if (
                intentData.intent ===
                "train_info"
            ) {

                if (
                    intentData.trainNumber ||
                    selectedTrain
                ) {

                    const number =
                        intentData.trainNumber ||
                        selectedTrain;

                    answer =
                        `I understand that you want information about train ${number}.`;

                } else {

                    answer =
                        "I understand that you want train information. Please select a train or provide its train number.";

                }

            }


            else if (
                intentData.intent ===
                "pnr"
            ) {

                if (
                    intentData.pnr
                ) {

                    answer =
                        `I understand that you want to check PNR ${intentData.pnr}.`;

                } else {

                    answer =
                        "I understand that you want to check PNR status. Please provide or search a PNR.";

                }

            }


            else if (
                intentData.intent ===
                "seat_availability"
            ) {

                const number =
                    intentData.trainNumber ||
                    selectedTrain;

                if (number) {

                    answer =
                        `I understand that you want to check seat availability for train ${number}.`;

                } else {

                    answer =
                        "I understand that you want to check seat availability.";

                }

            }


            else if (
                intentData.intent ===
                "coach_position"
            ) {

                const number =
                    intentData.trainNumber ||
                    selectedTrain;

                if (number) {

                    answer =
                        `I understand that you want the coach position of train ${number}.`;

                } else {

                    answer =
                        "I understand that you want to check coach position.";

                }

            }


            else if (
                intentData.intent ===
                "between_stations"
            ) {

                answer =
                    "I understand that you want to find trains between two stations.";

            }


            else if (
                intentData.intent ===
                "train_search"
            ) {

                const number =
                    intentData.trainNumber ||
                    selectedTrain;

                if (number) {

                    answer =
                        `I understand that you want information about train ${number}.`;

                } else {

                    answer =
                        "I understand that you want to search for a train.";

                }

            }


            else if (
                intentData.intent ===
                "help"
            ) {

                answer =
                    "I can help with train location, delay, ETA, next station, route, speed, progress, PNR, seat availability, coach position and trains between stations.";

            }


            else {

                answer =
                    "I understand your question, but I need a little more information to determine which RailTrack feature you need.";

            }


            /* =================================================
               RESPONSE
            ================================================= */

            return res.status(200).json({

                success: true,

                answer,

                intent: intentData,

                data: {

                    trainNumber:
                        selectedTrain,

                    journeyDate:
                        selectedJourneyDate,

                    question,

                    trainData:
                        trainData || null

                }

            });

        }


        catch (error) {

            console.error(
                "RailTrack AI API ERROR:",
                error
            );

            next(error);

        }

    }
);


/* =====================================================
   EXPORT ROUTER
===================================================== */

module.exports = router;