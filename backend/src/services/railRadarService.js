const BASE_URL =
  process.env.RAILRADAR_BASE_URL ||
  "https://api.railradar.in/v1";

const API_KEY =
  process.env.RAILRADAR_API_KEY;


/* =====================================================
   COMMON REQUEST
===================================================== */

async function apiRequest(
  endpoint,
  options = {}
) {

  const url =
    `${BASE_URL}${endpoint}`;

  console.log("");
  console.log("======================================");
  console.log("RailRadar Request:");
  console.log(url);
  console.log("======================================");


  if (!API_KEY) {

    throw new Error(
      "RAILRADAR_API_KEY is missing in backend/.env"
    );

  }


  const response =
    await fetch(
      url,
      {
        method:
          options.method || "GET",

        headers: {
          "Accept":
            "application/json",

          "Authorization":
            `Bearer ${API_KEY}`
        }
      }
    );


  const text =
    await response.text();


  let data;


  try {

    data =
      text
        ? JSON.parse(text)
        : {};

  } catch {

    data = {
      success: false,

      error: {
        message:
          text ||
          "Invalid JSON response"
      }
    };

  }


  if (!response.ok) {

    const error =
      new Error(
        data?.error?.message ||
        data?.message ||
        `RailRadar returned HTTP ${response.status}`
      );


    error.status =
      response.status;


    error.code =
      data?.error?.code;


    error.details =
      data;


    throw error;

  }


  return data;

}


/* =====================================================
   LIVE TRAIN
===================================================== */

async function getLiveTrain(
  trainNumber,
  date = ""
) {

  const params =
    new URLSearchParams();


  if (date) {

    params.set(
      "date",
      date
    );

  }


  params.set(
    "geometry",
    "true"
  );


  params.set(
    "format",
    "geojson"
  );


  params.set(
    "includeCoordinates",
    "true"
  );


  const query =
    params.toString();


  return apiRequest(
    `/trains/${encodeURIComponent(
      trainNumber
    )}/live?${query}`
  );

}


/* =====================================================
   TRAIN ROUTE
===================================================== */

async function getTrainRoute(
  trainNumber
) {

  return apiRequest(
    `/trains/${encodeURIComponent(
      trainNumber
    )}/route?format=geojson&stops=true`
  );

}


/* =====================================================
   BETWEEN STATIONS
===================================================== */

async function getBetweenStations(
  from,
  to,
  date = "",
  live = true
) {

  const params =
    new URLSearchParams();


  if (date) {

    params.set(
      "date",
      date
    );

  }


  params.set(
    "live",
    live
      ? "true"
      : "false"
  );


  params.set(
    "byCity",
    "false"
  );


  return apiRequest(
    `/trains/between/${encodeURIComponent(
      from
    )}/${encodeURIComponent(
      to
    )}?${params.toString()}`
  );

}


/* =====================================================
   STATION LOOKUP
===================================================== */

async function getStations() {

  return apiRequest(
    "/lookup/stations"
  );

}


module.exports = {

  apiRequest,

  getLiveTrain,

  getTrainRoute,

  getBetweenStations,

  getStations

};