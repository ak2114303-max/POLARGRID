export type SystemStatus =
  | "NORMAL"
  | "WARNING"
  | "EMERGENCY";

export type ForecastPoint = {
  label: string;
  load: number;
  solar: number;
  wind: number;
  renewable: number;
};

export type SimulationData = {
  // Time
  simulationTime: number;

  // Weather
  temperature: number;
  windSpeed: number;
  solarIrradiance: number;
  humidity: number;
  cloudCover: number;
  occupancy: number;

  // Loads
  currentLoad: number;
  heatingLoad: number;
  laboratoryLoad: number;
  communicationLoad: number;
  lightingLoad: number;
  waterLoad: number;

  // Renewable generation
  solarGeneration: number;
  windGeneration: number;
  renewableGeneration: number;
  renewablePercentage: number;

  // Battery
  batterySoc: number;
  batteryPower: number;
  batteryCapacity: number;

  // Diesel generator
  dieselOutput: number;
  fuelRate: number;
  fuelRemaining: number;

  // System
  systemStatus: SystemStatus;
  alert: string;
};

/*
 * =========================================================
 * HELPER FUNCTIONS
 * =========================================================
 */

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(
  min: number,
  max: number
): number {
  return min + Math.random() * (max - min);
}

/*
 * =========================================================
 * INITIAL SIMULATION
 * =========================================================
 */

export function createInitialSimulation(): SimulationData {
  const temperature = -18;
  const windSpeed = 8.5;
  const solarIrradiance = 480;
  const humidity = 62;
  const cloudCover = 34;
  const occupancy = 28;

  const heatingLoad = 24;
  const laboratoryLoad = 21;
  const communicationLoad = 8;
  const lightingLoad = 12;
  const waterLoad = 7;

  const currentLoad =
    heatingLoad +
    laboratoryLoad +
    communicationLoad +
    lightingLoad +
    waterLoad;

  const solarGeneration =
    solarIrradiance * 0.075;

  const windGeneration =
    windSpeed * 2.15;

  const renewableGeneration =
    solarGeneration + windGeneration;

  const batterySoc = 71;

  const batteryPower =
    renewableGeneration > currentLoad
      ? Math.min(
          (renewableGeneration - currentLoad) * 0.6,
          15
        )
      : -Math.min(
          (currentLoad - renewableGeneration) * 0.35,
          12
        );

  const dieselOutput = Math.max(
    0,
    currentLoad -
      renewableGeneration -
      Math.max(-batteryPower, 0)
  );

  const fuelRate =
    dieselOutput > 0
      ? 2.8 + dieselOutput * 0.14
      : 0;

  return {
    simulationTime: 0,

    temperature,
    windSpeed,
    solarIrradiance,
    humidity,
    cloudCover,
    occupancy,

    currentLoad,
    heatingLoad,
    laboratoryLoad,
    communicationLoad,
    lightingLoad,
    waterLoad,

    solarGeneration,
    windGeneration,
    renewableGeneration,

    renewablePercentage:
      currentLoad > 0
        ? Math.min(
            (renewableGeneration / currentLoad) *
              100,
            100
          )
        : 0,

    batterySoc,
    batteryPower,
    batteryCapacity: 500,

    dieselOutput,
    fuelRate,

    // 1000 L simulated diesel tank
    fuelRemaining: 1000,

    systemStatus: "NORMAL",

    alert:
      "All major energy systems are operating normally.",
  };
}

/*
 * =========================================================
 * UPDATE SIMULATION
 * =========================================================
 */

export function updateSimulation(
  previous: SimulationData,
  elapsedMinutes = 5
): SimulationData {
  const newTime =
    previous.simulationTime + elapsedMinutes;

  /*
   * -------------------------------------------------------
   * WEATHER
   * -------------------------------------------------------
   */

  const timeOfDay =
    (newTime / 60) % 24;

  /*
   * Temperature follows a slow natural variation.
   */

  const temperature = clamp(
    previous.temperature +
      Math.sin(newTime / 55) * 0.35 +
      randomBetween(-0.25, 0.25),
    -35,
    2
  );

  /*
   * Wind variation.
   */

  const windSpeed = clamp(
    previous.windSpeed +
      randomBetween(-0.8, 0.8) +
      Math.sin(newTime / 40) * 0.4,
    1,
    22
  );

  /*
   * -------------------------------------------------------
   * SOLAR
   * -------------------------------------------------------
   */

  /*
   * Antarctica can have unusual daylight patterns.
   * For the demo we simulate a long daylight period.
   */

  const daylightFactor =
    Math.max(
      0,
      Math.sin(
        ((timeOfDay - 5) / 14) *
          Math.PI
      )
    );

  const cloudCover = clamp(
    previous.cloudCover +
      randomBetween(-5, 5),
    5,
    95
  );

  const solarIrradiance = clamp(
    650 *
      daylightFactor *
      (1 - cloudCover / 130) +
      randomBetween(-20, 20),
    0,
    750
  );

  /*
   * -------------------------------------------------------
   * HUMIDITY
   * -------------------------------------------------------
   */

  const humidity = clamp(
    previous.humidity +
      randomBetween(-2.5, 2.5),
    35,
    90
  );

  /*
   * -------------------------------------------------------
   * OCCUPANCY
   * -------------------------------------------------------
   */

  let occupancy = previous.occupancy;

  /*
   * Occasionally change station occupancy.
   */

  if (Math.random() < 0.25) {
    occupancy = Math.round(
      clamp(
        occupancy +
          randomBetween(-2, 2),
        12,
        45
      )
    );
  }

  /*
   * -------------------------------------------------------
   * LOAD CALCULATION
   * -------------------------------------------------------
   */

  /*
   * Heating increases when temperature falls.
   */

  const heatingLoad = clamp(
    18 +
      Math.max(
        0,
        -temperature - 5
      ) *
        0.75 +
      randomBetween(-1.5, 1.5),
    16,
    42
  );

  /*
   * Laboratory load depends partly on occupancy.
   */

  const laboratoryLoad = clamp(
    15 +
      occupancy * 0.22 +
      Math.sin(newTime / 30) * 2 +
      randomBetween(-1, 1),
    15,
    30
  );

  /*
   * Communication systems remain fairly stable.
   */

  const communicationLoad = clamp(
    7 +
      Math.sin(newTime / 25) * 1.2 +
      randomBetween(-0.5, 0.5),
    5,
    11
  );

  /*
   * Lighting load increases during darker periods.
   */

  const lightingLoad = clamp(
    7 +
      (1 - daylightFactor) * 7 +
      randomBetween(-0.8, 0.8),
    6,
    15
  );

  /*
   * Water system load.
   */

  const waterLoad = clamp(
    6 +
      occupancy * 0.06 +
      randomBetween(-0.7, 0.7),
    5,
    10
  );

  const currentLoad =
    heatingLoad +
    laboratoryLoad +
    communicationLoad +
    lightingLoad +
    waterLoad;

  /*
   * -------------------------------------------------------
   * RENEWABLE GENERATION
   * -------------------------------------------------------
   */

  const solarGeneration = clamp(
    solarIrradiance * 0.075,
    0,
    52
  );

  const windGeneration = clamp(
    windSpeed * 2.15,
    0,
    48
  );

  const renewableGeneration =
    solarGeneration + windGeneration;

  /*
   * -------------------------------------------------------
   * ENERGY BALANCE
   * -------------------------------------------------------
   */

  const renewableSurplus =
    renewableGeneration - currentLoad;

  let batterySoc = previous.batterySoc;
  let batteryPower = 0;
  let dieselOutput = 0;

  /*
   * Renewable surplus:
   * charge battery.
   */

  if (renewableSurplus > 0) {
    if (batterySoc < 95) {
      batteryPower = Math.min(
        renewableSurplus * 0.65,
        20
      );

      /*
       * Convert power into SOC change.
       */

      batterySoc +=
        (batteryPower *
          (elapsedMinutes / 60) *
          100) /
        500;
    }
  }

  /*
   * Renewable deficit:
   * discharge battery first.
   */

  else {
    const deficit =
      Math.abs(renewableSurplus);

    if (batterySoc > 25) {
      const availableBatteryPower =
        Math.min(
          deficit * 0.65,
          22
        );

      batteryPower =
        -availableBatteryPower;

      batterySoc -=
        (Math.abs(batteryPower) *
          (elapsedMinutes / 60) *
          100) /
        500;
    }

    /*
     * Remaining deficit goes to diesel.
     */

    const batterySupport =
      Math.abs(batteryPower);

    dieselOutput = Math.max(
      0,
      deficit - batterySupport
    );
  }

  /*
   * Keep battery inside safe limits.
   */

  batterySoc = clamp(
    batterySoc,
    20,
    95
  );

  /*
   * -------------------------------------------------------
   * DIESEL GENERATOR
   * -------------------------------------------------------
   */

  if (batterySoc <= 21) {
    dieselOutput = Math.max(
      dieselOutput,
      currentLoad -
        renewableGeneration
    );
  }

  dieselOutput = clamp(
    dieselOutput,
    0,
    65
  );

  /*
   * Generator fuel consumption model.
   */

  const fuelRate =
    dieselOutput > 0
      ? 2.8 +
        dieselOutput * 0.14
      : 0;

  /*
   * -------------------------------------------------------
   * FUEL TANK
   * -------------------------------------------------------
   */

  const fuelUsed =
    fuelRate *
    (elapsedMinutes / 60);

  const fuelRemaining = clamp(
    previous.fuelRemaining -
      fuelUsed,
    0,
    1000
  );

  /*
   * -------------------------------------------------------
   * RENEWABLE PERCENTAGE
   * -------------------------------------------------------
   */

  const renewablePercentage =
    currentLoad > 0
      ? Math.min(
          (Math.min(
            renewableGeneration,
            currentLoad
          ) /
            currentLoad) *
            100,
          100
        )
      : 0;

  /*
   * -------------------------------------------------------
   * SYSTEM STATUS
   * -------------------------------------------------------
   */

  let systemStatus: SystemStatus =
    "NORMAL";

  let alert =
    "All major energy systems are operating normally.";

  if (batterySoc < 30) {
    systemStatus = "WARNING";

    alert =
      "Battery state of charge is approaching the minimum reserve threshold.";
  }

  if (fuelRemaining < 150) {
    systemStatus = "WARNING";

    alert =
      "Diesel fuel reserve is becoming limited. Renewable utilization should be prioritized.";
  }

  if (
    batterySoc < 22 &&
    dieselOutput > 55
  ) {
    systemStatus = "EMERGENCY";

    alert =
      "High diesel dependency detected while battery reserve is critically low.";
  }

  /*
   * -------------------------------------------------------
   * RETURN UPDATED STATE
   * -------------------------------------------------------
   */

  return {
    simulationTime: newTime,

    temperature,
    windSpeed,
    solarIrradiance,
    humidity,
    cloudCover,
    occupancy,

    currentLoad,

    heatingLoad,
    laboratoryLoad,
    communicationLoad,
    lightingLoad,
    waterLoad,

    solarGeneration,
    windGeneration,
    renewableGeneration,
    renewablePercentage,

    batterySoc,
    batteryPower,
    batteryCapacity: 500,

    dieselOutput,
    fuelRate,
    fuelRemaining,

    systemStatus,
    alert,
  };
}

/*
 * =========================================================
 * LOAD FORECAST
 * =========================================================
 */

export function generateForecast(
  simulation: SimulationData
): ForecastPoint[] {
  const forecast: ForecastPoint[] = [];

  const labels = [
    "NOW",
    "+1H",
    "+2H",
    "+3H",
    "+4H",
    "+5H",
    "+6H",
  ];

  labels.forEach((label, index) => {
    const hour = index;

    /*
     * Expected load pattern.
     */

    const heatingEffect =
      Math.max(
        0,
        -simulation.temperature - 5
      ) *
      0.7;

    const occupancyEffect =
      simulation.occupancy * 0.15;

    const dailyPattern =
      Math.sin(
        ((hour + 4) / 24) *
          Math.PI *
          2
      ) *
      5;

    const load = clamp(
      simulation.currentLoad +
        heatingEffect +
        occupancyEffect +
        dailyPattern +
        randomBetween(-2.5, 2.5),
      50,
      135
    );

    /*
     * Solar forecast.
     */

    const daylight =
      Math.max(
        0,
        Math.sin(
          ((hour + 2) / 14) *
            Math.PI
        )
      );

    const solar = clamp(
      simulation.solarGeneration +
        daylight * 12 -
        simulation.cloudCover * 0.04 +
        randomBetween(-2, 2),
      0,
      55
    );

    /*
     * Wind forecast.
     */

    const wind = clamp(
      simulation.windGeneration +
        Math.sin(hour / 2) * 3 +
        randomBetween(-2, 2),
      0,
      50
    );

    const renewable =
      solar + wind;

    forecast.push({
      label,
      load,
      solar,
      wind,
      renewable,
    });
  });

  return forecast;
}