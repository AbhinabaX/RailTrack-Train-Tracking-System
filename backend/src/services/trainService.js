const railRadar = require("./railRadarService");

/* =====================================================
   HELPERS
===================================================== */

function cleanTrainNumber(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "");
}

function cleanStation(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function unwrap(response) {
  if (!response) {
    return {};
  }

  if (response.data !== undefined) {
    return response.data;
  }

  return response;
}

function firstValue(...values) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}

function numberOrNull(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function stationCodeOf(stop) {
  return String(
    stop?.stationCode ||
    stop?.code ||
    stop?.station?.code ||
    ""
  ).toUpperCase();
}

function stationNameOf(stop) {
  return (
    stop?.stationName ||
    stop?.name ||
    stop?.station?.name ||
    ""
  );
}


/* =====================================================
   TIMING NORMALIZER
===================================================== */

function normalizeStop(stop) {
  if (!stop) {
    return null;
  }

  const scheduledArrival =
    firstValue(
      stop.scheduledArrival,
      stop.scheduledArrivalTime,
      stop.arrivalScheduled,
      stop.arrival
    );

  const scheduledDeparture =
    firstValue(
      stop.scheduledDeparture,
      stop.scheduledDepartureTime,
      stop.departureScheduled,
      stop.departure
    );

  const actualArrival =
    firstValue(
      stop.actualArrival,
      stop.actualArrivalTime,
      stop.arrivalActual
    );

  const actualDeparture =
    firstValue(
      stop.actualDeparture,
      stop.actualDepartureTime,
      stop.departureActual
    );

  const expectedArrival =
    firstValue(
      stop.expectedArrival,
      stop.expectedArrivalTime,
      stop.estimatedArrival,
      stop.eta
    );

  const expectedDeparture =
    firstValue(
      stop.expectedDeparture,
      stop.expectedDepartureTime,
      stop.estimatedDeparture,
      stop.etd
    );

  const delayArrival =
    numberOrNull(
      firstValue(
        stop.delayArrival,
        stop.arrivalDelay,
        stop.delayMinutes
      )
    );

  const delayDeparture =
    numberOrNull(
      firstValue(
        stop.delayDeparture,
        stop.departureDelay,
        stop.delayMinutes
      )
    );

  return {
    ...stop,

    sequence:
      numberOrNull(stop.sequence),

    stationCode:
      stationCodeOf(stop),

    stationName:
      stationNameOf(stop),

    lat:
      numberOrNull(
        firstValue(
          stop.lat,
          stop.latitude
        )
      ),

    lng:
      numberOrNull(
        firstValue(
          stop.lng,
          stop.longitude
        )
      ),

    distance:
      numberOrNull(stop.distance),

    scheduledArrival,

    scheduledDeparture,

    actualArrival,

    actualDeparture,

    expectedArrival,

    expectedDeparture,

    delayArrival,

    delayDeparture,

    delayMinutes:
      numberOrNull(
        firstValue(
          stop.delayMinutes,
          delayArrival,
          delayDeparture
        )
      ),

    platform:
      firstValue(
        stop.platform,
        stop.platformNumber
      ),

    status:
      stop.status || "",

    isHalt:
      stop.isHalt ?? true
  };
}


/* =====================================================
   MERGE ROUTE STOPS
===================================================== */

function mergeStops(liveStops, geometryStops) {
  const live =
    Array.isArray(liveStops)
      ? liveStops
      : [];

  const geometry =
    Array.isArray(geometryStops)
      ? geometryStops
      : [];

  const map = new Map();


  /* ---------------------------------------------
     ADD GEOMETRY STOPS FIRST
  --------------------------------------------- */

  geometry.forEach((stop) => {
    const normalized =
      normalizeStop(stop);

    if (!normalized) {
      return;
    }

    const key =
      normalized.sequence !== null
        ? `seq:${normalized.sequence}`
        : normalized.stationCode
          ? `code:${normalized.stationCode}`
          : `index:${map.size}`;

    map.set(
      key,
      normalized
    );
  });


  /* ---------------------------------------------
     ADD / MERGE LIVE STOPS
  --------------------------------------------- */

  live.forEach((stop, index) => {
    const normalized =
      normalizeStop(stop);

    if (!normalized) {
      return;
    }

    const key =
      normalized.sequence !== null
        ? `seq:${normalized.sequence}`
        : normalized.stationCode
          ? `code:${normalized.stationCode}`
          : `index:${index}`;

    const existing =
      map.get(key) || {};

    map.set(
      key,
      {
        ...existing,
        ...normalized,

        lat:
          normalized.lat ??
          existing.lat ??
          null,

        lng:
          normalized.lng ??
          existing.lng ??
          null,

        stationCode:
          normalized.stationCode ||
          existing.stationCode ||
          "",

        stationName:
          normalized.stationName ||
          existing.stationName ||
          ""
      }
    );
  });


  return Array.from(
    map.values()
  ).sort(
    (a, b) =>
      (a.sequence ?? 999999) -
      (b.sequence ?? 999999)
  );
}


/* =====================================================
   TRAIN NUMBER VALIDATION
===================================================== */

function validateTrainNumber(trainNumber) {
  const number =
    cleanTrainNumber(
      trainNumber
    );

  if (
    !/^\d{5}$/.test(number)
  ) {
    const error =
      new Error(
        "Train number must contain exactly 5 digits."
      );

    error.status = 400;

    throw error;
  }

  return number;
}


/* =====================================================
   FIND STOP
===================================================== */

function findStop(
  stops,
  reference
) {
  if (
    !Array.isArray(stops) ||
    !reference
  ) {
    return null;
  }

  const sequence =
    numberOrNull(
      reference.sequence
    );

  if (
    sequence !== null
  ) {
    const bySequence =
      stops.find(
        (stop) =>
          numberOrNull(
            stop.sequence
          ) === sequence
      );

    if (bySequence) {
      return bySequence;
    }
  }

  const code =
    String(
      reference.stationCode ||
      reference.code ||
      ""
    ).toUpperCase();

  if (code) {
    const byCode =
      stops.find(
        (stop) =>
          stationCodeOf(stop) === code
      );

    if (byCode) {
      return byCode;
    }
  }

  return null;
}


/* =====================================================
   GET FULL TRAIN DASHBOARD
===================================================== */

async function getTrainDashboard(
  trainNumber,
  date = ""
) {
  const number =
    validateTrainNumber(
      trainNumber
    );

  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "DASHBOARD REQUEST"
  );
  console.log(
    `TRAIN: ${number}`
  );
  console.log(
    `DATE: ${date || "AUTO"}`
  );
  console.log(
    "======================================"
  );


  /* ---------------------------------------------
     LIVE TRAIN DATA
  --------------------------------------------- */

  const liveResponse =
    await railRadar.getLiveTrain(
      number,
      date
    );

  const live =
    unwrap(
      liveResponse
    );


  /* ---------------------------------------------
     ROUTE / GEOMETRY
  --------------------------------------------- */

  let routeData = null;

  try {
    const routeResponse =
      await railRadar.getTrainRoute(
        number
      );

    routeData =
      unwrap(
        routeResponse
      );

  } catch (routeError) {

    console.log(
      "Route request failed:",
      routeError.message
    );
  }


  /* ---------------------------------------------
     LIVE STOPS
  --------------------------------------------- */

  const liveStops =
    Array.isArray(
      live.route
    )
      ? live.route
      : [];


  /* ---------------------------------------------
     GEOMETRY STOPS
  --------------------------------------------- */

  const geometryStops =
    Array.isArray(
      routeData?.stops
    )
      ? routeData.stops
      : [];


  /* ---------------------------------------------
     MERGE TIMING + COORDINATES
  --------------------------------------------- */

  const cleanStops =
    mergeStops(
      liveStops,
      geometryStops
    );


  console.log(
    `Route stops: ${cleanStops.length}`
  );


  const timingStops =
    cleanStops.filter(
      (stop) =>
        stop.scheduledArrival ||
        stop.scheduledDeparture ||
        stop.actualArrival ||
        stop.actualDeparture ||
        stop.expectedArrival ||
        stop.expectedDeparture
    );


  console.log(
    `Stops containing timing: ${timingStops.length}`
  );


  /* ---------------------------------------------
     TRAIN
  --------------------------------------------- */

  const train =
    live.train ||
    {};


  /* ---------------------------------------------
     CURRENT LOCATION
  --------------------------------------------- */

  const current =
    live.currentLocation ||
    {};


  /* ---------------------------------------------
     PREVIOUS STATION
  --------------------------------------------- */

  const previous =
    live.previousHalt ||
    null;


  /* ---------------------------------------------
     NEXT STATION
  --------------------------------------------- */

  const next =
    live.nextHalt ||
    null;


  /* ---------------------------------------------
     FIND ROUTE STATIONS
  --------------------------------------------- */

  const previousRouteStop =
    findStop(
      cleanStops,
      previous
    );

  const nextRouteStop =
    findStop(
      cleanStops,
      next
    );

  const currentRouteStop =
    findStop(
      cleanStops,
      current
    );


  /* ---------------------------------------------
     SPEED
  --------------------------------------------- */

  const speed =
    numberOrNull(
      firstValue(
        current.speedKmh,
        current.speed,
        live.speedKmh
      )
    );


  /* ---------------------------------------------
     SEGMENT PROGRESS
  --------------------------------------------- */

  const segmentProgress =
    numberOrNull(
      current.segmentProgress
    );


  /* ---------------------------------------------
     TOTAL DISTANCE
  --------------------------------------------- */

  const totalDistance =
    numberOrNull(
      firstValue(
        train.distance,
        train.distanceKm
      )
    );


  /* ---------------------------------------------
     CURRENT DISTANCE
  --------------------------------------------- */

  let currentDistance = null;

  if (
    previous?.distance != null &&
    next?.distance != null &&
    segmentProgress !== null
  ) {
    const start =
      Number(
        previous.distance
      );

    const end =
      Number(
        next.distance
      );

    if (
      Number.isFinite(start) &&
      Number.isFinite(end)
    ) {
      currentDistance =
        start +
        (
          end - start
        ) *
        segmentProgress;
    }
  }


  /* ---------------------------------------------
     PROGRESS
  --------------------------------------------- */

  let progress = null;

  if (
    totalDistance !== null &&
    currentDistance !== null &&
    totalDistance > 0
  ) {
    progress =
      Math.min(
        100,
        Math.max(
          0,
          (
            currentDistance /
            totalDistance
          ) *
          100
        )
      );
  }


  /* ---------------------------------------------
     FALLBACK PROGRESS
  --------------------------------------------- */

  if (
    progress === null &&
    cleanStops.length > 1 &&
    current.sequence != null
  ) {
    const sequence =
      Number(
        current.sequence
      );

    if (
      Number.isFinite(sequence)
    ) {
      const segment =
        segmentProgress !== null
          ? segmentProgress
          : 0;

      progress =
        (
          (
            Math.max(
              0,
              sequence - 1
            ) +
            Math.max(
              0,
              Math.min(
                1,
                segment
              )
            )
          ) /
          Math.max(
            1,
            cleanStops.length - 1
          )
        ) *
        100;
    }
  }


  /* ---------------------------------------------
     STATUS
  --------------------------------------------- */

  let status =
    live.status ||
    "unknown";

  if (
    status === "running"
  ) {
    status = "RUNNING";
  } else if (
    status === "completed"
  ) {
    status = "COMPLETED";
  } else if (
    status === "not-started"
  ) {
    status = "NOT STARTED";
  } else if (
    status === "cancelled"
  ) {
    status = "CANCELLED";
  }


  /* ---------------------------------------------
     NEXT STATION TIMING
  --------------------------------------------- */

  const nextTiming =
    nextRouteStop ||
    {};


  /* =================================================
     FINAL RESPONSE
  ================================================= */

  return {

    success: true,


    /* ---------------------------------------------
       TRAIN DETAILS
    --------------------------------------------- */

    train: {

      number:
        live.trainNumber ||
        train.number ||
        number,

      name:
        live.trainName ||
        train.name ||
        "Unknown Train",

      type:
        train.type ||
        "",

      category:
        train.category ||
        "",

      source:
        train.source ||
        null,

      destination:
        train.destination ||
        null,

      runDays:
        train.runDays ||
        [],

      avgSpeed:
        numberOrNull(
          firstValue(
            train.avgSpeed,
            train.avgSpeedKmh
          )
        ),

      maxSpeed:
        numberOrNull(
          firstValue(
            train.maxSpeed,
            train.maxSpeedKmh
          )
        ),

      distance:
        totalDistance,

      duration:
        numberOrNull(
          train.duration
        ),

      totalHalts:
        train.totalHalts ??
        cleanStops.length
    },


    /* ---------------------------------------------
       RUNNING INFORMATION
    --------------------------------------------- */

    running: {

      status,

      isLive:
        live.isLive === true,

      delayMinutes:
        numberOrNull(
          firstValue(
            live.delayMinutes,
            live.overallDelayMinutes,
            0
          )
        ) ?? 0,

      lastUpdatedAt:
        live.lastUpdatedAt ||
        live.updatedAt ||
        null,


      /* -----------------------------------------
         CURRENT STATION
      ----------------------------------------- */

      currentStation: {

        code:
          current.stationCode ||
          currentRouteStop?.stationCode ||
          "",

        name:
          current.stationName ||
          currentRouteStop?.stationName ||
          "",

        sequence:
          current.sequence ??
          currentRouteStop?.sequence ??
          null,

        status:
          current.status ||
          "",

        isActualPosition:
          current.isActualPosition ??
          false,

        speedKmh:
          speed,

        bearingDegrees:
          numberOrNull(
            current.bearingDegrees
          ),

        segmentProgress:
          segmentProgress
      },


      /* -----------------------------------------
         PREVIOUS STATION
      ----------------------------------------- */

      previousStation: {

        code:
          previous?.stationCode ||
          previousRouteStop?.stationCode ||
          "",

        name:
          previous?.stationName ||
          previousRouteStop?.stationName ||
          "",

        sequence:
          previous?.sequence ??
          previousRouteStop?.sequence ??
          null,

        distance:
          numberOrNull(
            previous?.distance ??
            previousRouteStop?.distance
          ),

        scheduledArrival:
          previousRouteStop?.scheduledArrival ||
          null,

        scheduledDeparture:
          previousRouteStop?.scheduledDeparture ||
          null,

        actualArrival:
          previousRouteStop?.actualArrival ||
          null,

        actualDeparture:
          previousRouteStop?.actualDeparture ||
          null,

        expectedArrival:
          previousRouteStop?.expectedArrival ||
          null,

        expectedDeparture:
          previousRouteStop?.expectedDeparture ||
          null,

        platform:
          previousRouteStop?.platform ||
          null
      },


      /* -----------------------------------------
         NEXT STATION
      ----------------------------------------- */

      nextStation: {

        code:
          next?.stationCode ||
          nextRouteStop?.stationCode ||
          "",

        name:
          next?.stationName ||
          nextRouteStop?.stationName ||
          "",

        sequence:
          next?.sequence ??
          nextRouteStop?.sequence ??
          null,

        distance:
          numberOrNull(
            next?.distance ??
            nextRouteStop?.distance
          ),


        /* SCHEDULED */

        scheduledArrival:
          nextTiming.scheduledArrival ||
          null,

        scheduledDeparture:
          nextTiming.scheduledDeparture ||
          null,


        /* EXPECTED */

        expectedArrival:
          nextTiming.expectedArrival ||
          null,

        expectedDeparture:
          nextTiming.expectedDeparture ||
          null,


        /* ACTUAL */

        actualArrival:
          nextTiming.actualArrival ||
          null,

        actualDeparture:
          nextTiming.actualDeparture ||
          null,


        /* DELAY */

        delayArrival:
          nextTiming.delayArrival ??
          null,

        delayDeparture:
          nextTiming.delayDeparture ??
          null,

        delayMinutes:
          nextTiming.delayMinutes ??
          null,


        /* PLATFORM */

        platform:
          nextTiming.platform ||
          null,

        status:
          nextTiming.status ||
          ""
      },


      currentDistance,

      progress
    },


    /* ---------------------------------------------
       TOP LEVEL STATION DATA
    --------------------------------------------- */

    currentStation:
      currentRouteStop || {

        stationCode:
          current.stationCode ||
          "",

        stationName:
          current.stationName ||
          ""
      },


    nextStation:
      nextRouteStop || {

        stationCode:
          next?.stationCode ||
          "",

        stationName:
          next?.stationName ||
          ""
      },


    previousStation:
      previousRouteStop || {

        stationCode:
          previous?.stationCode ||
          "",

        stationName:
          previous?.stationName ||
          ""
      },


    /* ---------------------------------------------
       DELAY
    --------------------------------------------- */

    delayMinutes:
      numberOrNull(
        firstValue(
          live.delayMinutes,
          live.overallDelayMinutes,
          0
        )
      ) ?? 0,


    lastUpdatedAt:
      live.lastUpdatedAt ||
      live.updatedAt ||
      null,


    /* ---------------------------------------------
       COMPLETE ROUTE
       TIMING + COORDINATES
    --------------------------------------------- */

    route:
      cleanStops,

    stops:
      cleanStops,


    /* ---------------------------------------------
       GEOJSON
    --------------------------------------------- */

    geojson:
      routeData?.geojson ||
      live.geojson ||
      null,

    routeGeometry:
      routeData?.geojson ||
      live.geojson ||
      null,


    /* ---------------------------------------------
       CURRENT MAP POSITION
    --------------------------------------------- */

    mapPosition:
      current.lat != null &&
      current.lng != null
        ? {

            lat:
              Number(
                current.lat
              ),

            lng:
              Number(
                current.lng
              )
          }
        : null,


    /* ---------------------------------------------
       EXCEPTIONS
    --------------------------------------------- */

    exceptions:
      Array.isArray(
        live.exceptions
      )
        ? live.exceptions
        : [],


    /* ---------------------------------------------
       API META
    --------------------------------------------- */

    meta:
      liveResponse?.meta ||
      {}
  };
}


/* =====================================================
   BETWEEN STATIONS
===================================================== */

async function searchBetweenStations(
  from,
  to,
  date = ""
) {
  const source =
    cleanStation(from);

  const destination =
    cleanStation(to);


  /* ---------------------------------------------
     VALIDATION
  --------------------------------------------- */

  if (!source) {

    const error =
      new Error(
        "From station is required."
      );

    error.status = 400;

    throw error;
  }


  if (!destination) {

    const error =
      new Error(
        "Destination station is required."
      );

    error.status = 400;

    throw error;
  }


  if (
    source === destination
  ) {

    const error =
      new Error(
        "From and destination stations cannot be the same."
      );

    error.status = 400;

    throw error;
  }


  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "BETWEEN STATIONS REQUEST"
  );
  console.log(
    `FROM: ${source}`
  );
  console.log(
    `TO: ${destination}`
  );
  console.log(
    `DATE: ${date || "AUTO"}`
  );
  console.log(
    "LIVE MODE: FALSE"
  );
  console.log(
    "======================================"
  );


  let response;


  /* =================================================
     IMPORTANT FIX

     DO NOT request live=true here.

     Between-station search should first return
     the train list quickly.

     Individual train live information is loaded
     later through getTrainDashboard().
  ================================================= */

  try {

    response =
      await railRadar.getBetweenStations(
        source,
        destination,
        date,
        false
      );

  } catch (error) {

    console.log(
      "Between-stations request failed:",
      error.message
    );


    /* ---------------------------------------------
       DATE FALLBACK

       If selected date has no result,
       retry automatically without date.
    --------------------------------------------- */

    if (
      error.status === 404 &&
      date
    ) {

      console.log(
        "Retrying between-stations search without date..."
      );

      response =
        await railRadar.getBetweenStations(
          source,
          destination,
          "",
          false
        );

    } else {

      throw error;
    }
  }


  const data =
    unwrap(response);


  const trains =
    Array.isArray(
      data.trains
    )
      ? data.trains
      : [];


  console.log(
    `Trains found: ${trains.length}`
  );


  /* =================================================
     RETURN TRAIN LIST
  ================================================= */

  return {

    success: true,

    from:
      data.from || {
        code: source
      },

    to:
      data.to || {
        code: destination
      },

    count:
      data.count ??
      trains.length,


    trains:

      trains.map(
        (item) => {

          const train =
            item.train ||
            {};

          const fromInfo =
            item.from ||
            {};

          const toInfo =
            item.to ||
            {};

          const live =
            item.live ||
            {};


          return {

            train: {

              number:
                train.number ||
                "",

              name:
                train.name ||
                "Unknown Train",

              type:
                train.type ||
                "",

              category:
                train.category ||
                "",

              source:
                train.source ||
                null,

              destination:
                train.destination ||
                null,

              runDays:
                train.runDays ||
                []
            },


            from: {

              departure:
                fromInfo.departure ||
                null,

              day:
                fromInfo.day ??
                null,

              sequence:
                fromInfo.sequence ??
                null
            },


            to: {

              arrival:
                toInfo.arrival ||
                null,

              day:
                toInfo.day ??
                null,

              sequence:
                toInfo.sequence ??
                null
            },


            distance:
              item.distance ??
              null,


            duration:
              item.duration ??
              null,


            totalHaltsBetween:
              item.totalHaltsBetween ??
              null,


            live: {

              type:
                live.type ||
                "",

              startDate:
                live.startDate ||
                null,

              expectedArrivalTime:
                live.expectedArrivalTime ||
                null,

              expectedDepartureTime:
                live.expectedDepartureTime ||
                null,

              platform:
                live.platform ||
                null,

              delayMinutes:
                live.delayMinutes ??
                0
            }
          };
        }
      ),


    meta:
      response?.meta ||
      {}
  };
}


/* =====================================================
   STATIONS
===================================================== */

async function getStationList() {

  const response =
    await railRadar.getStations();

  const data =
    unwrap(response);


  return {

    success: true,

    stations:
      data || {},

    meta:
      response?.meta ||
      {}
  };
}


/* =====================================================
   EXPORTS
===================================================== */

module.exports = {

  getTrainDashboard,

  searchBetweenStations,

  getStationList
};