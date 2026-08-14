require("dotenv").config();


const path =
  require("path");


const express =
  require("express");


const cors =
  require("cors");


const trainRoutes =
  require("./routes/trainRoutes");


const stationRoutes =
  require("./routes/stationRoutes");


const healthRoutes =
  require("./routes/healthRoutes");


const app =
  express();


const PORT =
  Number(
    process.env.PORT || 5000
  );


/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
  cors({
    origin: true
  })
);


app.use(
  express.json({
    limit: "1mb"
  })
);


app.use(
  express.urlencoded({
    extended: true
  })
);


/* =====================================================
   HEALTH
===================================================== */

app.use(
  "/api/health",
  healthRoutes
);


/* =====================================================
   TRAIN API
===================================================== */

app.use(
  "/api/trains",
  trainRoutes
);


/* =====================================================
   STATION API
===================================================== */

app.use(
  "/api/stations",
  stationRoutes
);


/* =====================================================
   API INFORMATION
===================================================== */

app.get(
  "/api",
  (req, res) => {

    res.json({

      success: true,

      name:
        "RailTrack API",

      version:
        "1.0.0",

      endpoints: {

        health:
          "/api/health",

        dashboard:
          "/api/trains/12827/dashboard",

        live:
          "/api/trains/12827/live",

        between:
          "/api/trains/between/BQA/MASAGRAM",

        stations:
          "/api/stations"

      }

    });

  }
);


/* =====================================================
   FRONTEND
===================================================== */

const frontendDirectory =
  path.join(
    __dirname,
    "../../frontend"
  );


app.use(
  express.static(
    frontendDirectory
  )
);


/* =====================================================
   FRONTEND FALLBACK
===================================================== */

app.get(
  "/{*splat}",
  (req, res) => {

    if (
      req.path.startsWith(
        "/api/"
      )
    ) {

      return res
        .status(404)
        .json({

          success: false,

          error: {
            message:
              "API endpoint not found."
          }

        });

    }


    res.sendFile(
      path.join(
        frontendDirectory,
        "index.html"
      )
    );

  }
);


/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {

    console.error("");
    console.error(
      "================ API ERROR ================"
    );


    console.error(
      error.message
    );


    if (
      error.details
    ) {

      console.error(
        JSON.stringify(
          error.details,
          null,
          2
        )
      );

    }


    console.error(
      "============================================"
    );


    const status =
      Number(
        error.status
      ) || 500;


    res
      .status(status)
      .json({

        success: false,

        error: {

          message:
            error.message ||
            "Internal server error",

          code:
            error.code ||
            null

        }

      });

  }
);


/* =====================================================
   START SERVER
===================================================== */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      "🚆 RailTrack Backend Running"
    );

    console.log(
      `🌐 http://localhost:${PORT}`
    );

    console.log(
      `❤️ Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      `🚆 Train API: http://localhost:${PORT}/api/trains`
    );

    console.log(
      "=========================================="
    );

  }
);