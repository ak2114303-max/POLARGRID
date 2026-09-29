import { useMemo, useState } from "react";
import type { SimulationData } from "../simulation";

type DigitalTwinProps = {
  simulation: SimulationData;
};

type ScenarioResult = {
  load: number;
  solar: number;
  wind: number;
  renewable: number;
  battery: number;
  diesel: number;
  fuelRate: number;
  fuelRemaining: number;
  renewableShare: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
};

function DigitalTwin({ simulation }: DigitalTwinProps) {
  const [temperatureDelta, setTemperatureDelta] = useState(0);
  const [windSpeed, setWindSpeed] = useState(18);
  const [solarIrradiance, setSolarIrradiance] = useState(55);
  const [cloudCover, setCloudCover] = useState(35);
  const [occupancy, setOccupancy] = useState(70);
  const [batterySoc, setBatterySoc] = useState(
    Math.round(simulation.batterySoc)
  );
  const [fuelLimit, setFuelLimit] = useState(500);

  const [scenarioApplied, setScenarioApplied] = useState(false);

  const baseValues = useMemo(() => {
    return {
      load: simulation.currentLoad,
      solar: simulation.solarGeneration,
      wind: simulation.windGeneration,
      battery: simulation.batterySoc,
      diesel: simulation.dieselOutput,
      fuelRate: simulation.fuelRate,
    };
  }, [simulation]);

  const scenario: ScenarioResult = useMemo(() => {
    /*
     * LOAD MODEL
     *
     * Higher temperature -> more heating demand.
     * Higher occupancy -> more laboratory,
     * communication and general station demand.
     */

    const temperatureEffect =
      temperatureDelta * 0.85;

    const occupancyEffect =
      (occupancy - 50) * 0.12;

    const scenarioLoad = Math.max(
      25,
      baseValues.load +
        temperatureEffect +
        occupancyEffect
    );

    /*
     * SOLAR MODEL
     *
     * Irradiance increases solar generation.
     * Cloud cover reduces available solar.
     */

    const cloudFactor =
      Math.max(0.1, 1 - cloudCover / 100);

    const solarFactor =
      Math.max(0, solarIrradiance / 55);

    const scenarioSolar = Math.max(
      0,
      baseValues.solar *
        solarFactor *
        cloudFactor
    );

    /*
     * WIND MODEL
     */

    const windFactor =
      Math.max(0.15, windSpeed / 18);

    const scenarioWind = Math.max(
      0,
      baseValues.wind * windFactor
    );

    const renewable =
      scenarioSolar + scenarioWind;

    /*
     * ENERGY BALANCE
     */

    const renewableUsed = Math.min(
      renewable,
      scenarioLoad
    );

    let batteryPower = 0;
    let diesel = 0;

    const surplus =
      Math.max(
        renewable - scenarioLoad,
        0
      );

    const deficit =
      Math.max(
        scenarioLoad - renewable,
        0
      );

    if (surplus > 0) {
      /*
       * Charge battery when renewable
       * generation exceeds demand.
       */
      batteryPower = Math.min(
        surplus * 0.7,
        20
      );

      diesel = 0;
    } else {
      /*
       * Battery supports demand before diesel.
       */
      if (batterySoc > 25) {
        batteryPower = -Math.min(
          deficit * 0.6,
          20
        );
      }

      diesel = Math.max(
        0,
        deficit - Math.abs(batteryPower)
      );
    }

    /*
     * Fuel model
     */

    const fuelRate =
      diesel > 0
        ? 2.8 + diesel * 0.14
        : 0;

    /*
     * Approximate fuel remaining after
     * one simulated operating hour.
     */

    const fuelRemaining = Math.max(
      0,
      fuelLimit - fuelRate
    );

    const renewableShare =
      scenarioLoad > 0
        ? (renewableUsed / scenarioLoad) *
          100
        : 0;

    let status: ScenarioResult["status"] =
      "NORMAL";

    if (
      batterySoc < 30 ||
      diesel > scenarioLoad * 0.45 ||
      fuelRemaining < 50
    ) {
      status = "WARNING";
    }

    if (
      batterySoc < 22 ||
      diesel > scenarioLoad * 0.7 ||
      fuelRemaining < 20
    ) {
      status = "CRITICAL";
    }

    return {
      load: scenarioLoad,
      solar: scenarioSolar,
      wind: scenarioWind,
      renewable,
      battery: batteryPower,
      diesel,
      fuelRate,
      fuelRemaining,
      renewableShare,
      status,
    };
  }, [
    baseValues,
    temperatureDelta,
    windSpeed,
    solarIrradiance,
    cloudCover,
    occupancy,
    batterySoc,
    fuelLimit,
  ]);

  const resetScenario = () => {
    setTemperatureDelta(0);
    setWindSpeed(18);
    setSolarIrradiance(55);
    setCloudCover(35);
    setOccupancy(70);
    setBatterySoc(
      Math.round(simulation.batterySoc)
    );
    setFuelLimit(500);
    setScenarioApplied(false);
  };

  const applyScenario = () => {
    setScenarioApplied(true);
  };

  const getStatusClass = () => {
    if (scenario.status === "CRITICAL") {
      return "twin-status critical";
    }

    if (scenario.status === "WARNING") {
      return "twin-status warning";
    }

    return "twin-status normal";
  };

  return (
    <div className="module-page digital-twin-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="module-header">

        <div>
          <div className="eyebrow">
            DIGITAL TWIN / WHAT-IF SIMULATION
          </div>

          <h1>DIGITAL TWIN</h1>

          <p>
            Simulate changing polar conditions and
            observe their impact on station energy
            demand, renewable generation, battery
            operation and diesel dependency.
          </p>
        </div>

        <div className={getStatusClass()}>
          <span></span>
          {scenario.status}
        </div>

      </section>

      {/* =====================================================
          SCENARIO CONTROL PANEL
          ===================================================== */}

      <section className="panel twin-control-panel">

        <div className="panel-header">

          <div>
            <h2>Scenario Parameters</h2>

            <p>
              Adjust environmental and operational
              conditions
            </p>
          </div>

          <div className="panel-live">
            <span></span>
            SIMULATION
          </div>

        </div>

        <div className="twin-controls-grid">

          {/* TEMPERATURE */}

          <ScenarioSlider
            title="Temperature Change"
            value={temperatureDelta}
            min={-20}
            max={20}
            step={1}
            unit="°C"
            description="Heating demand impact"
            onChange={setTemperatureDelta}
          />

          {/* WIND */}

          <ScenarioSlider
            title="Wind Speed"
            value={windSpeed}
            min={0}
            max={40}
            step={1}
            unit="m/s"
            description="Wind generation potential"
            onChange={setWindSpeed}
          />

          {/* SOLAR */}

          <ScenarioSlider
            title="Solar Irradiance"
            value={solarIrradiance}
            min={0}
            max={100}
            step={1}
            unit="%"
            description="Available solar resource"
            onChange={setSolarIrradiance}
          />

          {/* CLOUD */}

          <ScenarioSlider
            title="Cloud Cover"
            value={cloudCover}
            min={0}
            max={100}
            step={1}
            unit="%"
            description="Solar reduction factor"
            onChange={setCloudCover}
          />

          {/* OCCUPANCY */}

          <ScenarioSlider
            title="Station Occupancy"
            value={occupancy}
            min={10}
            max={100}
            step={1}
            unit="%"
            description="Operational load factor"
            onChange={setOccupancy}
          />

          {/* BATTERY */}

          <ScenarioSlider
            title="Battery SOC"
            value={batterySoc}
            min={20}
            max={95}
            step={1}
            unit="%"
            description="Available energy reserve"
            onChange={setBatterySoc}
          />

          {/* FUEL */}

          <ScenarioSlider
            title="Diesel Fuel Reserve"
            value={fuelLimit}
            min={20}
            max={1000}
            step={10}
            unit="L"
            description="Available backup fuel"
            onChange={setFuelLimit}
          />

        </div>

        <div className="twin-actions">

          <button
            className="twin-apply"
            onClick={applyScenario}
          >
            ▶ RUN SCENARIO
          </button>

          <button
            className="twin-reset"
            onClick={resetScenario}
          >
            ↻ RESET
          </button>

        </div>

      </section>

      {/* =====================================================
          SCENARIO STATUS
          ===================================================== */}

      <section className="twin-status-banner">

        <div className="twin-status-icon">
          ◈
        </div>

        <div>
          <strong>
            {scenarioApplied
              ? "SCENARIO ACTIVE"
              : "SCENARIO PREVIEW"}
          </strong>

          <p>
            {scenarioApplied
              ? "The selected environmental conditions are being evaluated by the local POLARGRID simulation engine."
              : "Adjust the parameters above to explore a hypothetical station operating condition."}
          </p>
        </div>

      </section>

      {/* =====================================================
          IMPACT SUMMARY
          ===================================================== */}

      <section className="twin-results-grid">

        <TwinResultCard
          title="Projected Load"
          value={`${scenario.load.toFixed(1)} kW`}
          base={`Base ${baseValues.load.toFixed(1)} kW`}
          type="load"
          icon="⚡"
        />

        <TwinResultCard
          title="Renewable Generation"
          value={`${scenario.renewable.toFixed(1)} kW`}
          base={`Base ${(baseValues.solar + baseValues.wind).toFixed(1)} kW`}
          type="renewable"
          icon="☀"
        />

        <TwinResultCard
          title="Battery Action"
          value={`${Math.abs(scenario.battery).toFixed(1)} kW`}
          base={
            scenario.battery < 0
              ? "Discharging"
              : "Charging"
          }
          type="battery"
          icon="🔋"
        />

        <TwinResultCard
          title="Diesel Requirement"
          value={`${scenario.diesel.toFixed(1)} kW`}
          base={`Current ${baseValues.diesel.toFixed(1)} kW`}
          type="diesel"
          icon="⚙"
        />

      </section>

      {/* =====================================================
          DEMAND VS SUPPLY
          ===================================================== */}

      <section className="twin-analysis-grid">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Scenario Energy Balance</h2>

              <p>
                Projected demand and available supply
              </p>
            </div>

            <div className="panel-live">
              <span></span>
              LIVE MODEL
            </div>

          </div>

          <TwinBar
            label="Station Demand"
            value={scenario.load}
            max={120}
            display={`${scenario.load.toFixed(1)} kW`}
            className="demand"
          />

          <TwinBar
            label="Solar Generation"
            value={scenario.solar}
            max={80}
            display={`${scenario.solar.toFixed(1)} kW`}
            className="solar"
          />

          <TwinBar
            label="Wind Generation"
            value={scenario.wind}
            max={80}
            display={`${scenario.wind.toFixed(1)} kW`}
            className="wind"
          />

          <TwinBar
            label="Diesel Support"
            value={scenario.diesel}
            max={80}
            display={`${scenario.diesel.toFixed(1)} kW`}
            className="diesel"
          />

        </div>

        {/* OPERATIONAL IMPACT */}

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Operational Impact</h2>

              <p>
                Key indicators from the scenario
              </p>
            </div>

          </div>

          <div className="twin-impact-list">

            <ImpactRow
              label="Renewable Share"
              value={`${scenario.renewableShare.toFixed(0)}%`}
              positive={
                scenario.renewableShare >= 60
              }
            />

            <ImpactRow
              label="Battery SOC"
              value={`${batterySoc}%`}
              positive={batterySoc >= 40}
            />

            <ImpactRow
              label="Diesel Fuel Rate"
              value={`${scenario.fuelRate.toFixed(1)} L/h`}
              positive={scenario.fuelRate < 5}
            />

            <ImpactRow
              label="Fuel Reserve"
              value={`${scenario.fuelRemaining.toFixed(0)} L`}
              positive={scenario.fuelRemaining > 100}
            />

            <ImpactRow
              label="System Condition"
              value={scenario.status}
              positive={scenario.status === "NORMAL"}
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          BEFORE / AFTER
          ===================================================== */}

      <section className="panel twin-comparison">

        <div className="panel-header">

          <div>
            <h2>Baseline vs Scenario</h2>

            <p>
              Compare current simulation with the
              selected operating condition
            </p>
          </div>

        </div>

        <div className="comparison-table">

          <div className="comparison-row comparison-heading">
            <span>PARAMETER</span>
            <span>BASELINE</span>
            <span>SCENARIO</span>
            <span>CHANGE</span>
          </div>

          <ComparisonRow
            label="Station Load"
            baseline={baseValues.load}
            scenario={scenario.load}
            unit="kW"
          />

          <ComparisonRow
            label="Solar Generation"
            baseline={baseValues.solar}
            scenario={scenario.solar}
            unit="kW"
          />

          <ComparisonRow
            label="Wind Generation"
            baseline={baseValues.wind}
            scenario={scenario.wind}
            unit="kW"
          />

          <ComparisonRow
            label="Diesel Output"
            baseline={baseValues.diesel}
            scenario={scenario.diesel}
            unit="kW"
          />

          <ComparisonRow
            label="Fuel Rate"
            baseline={baseValues.fuelRate}
            scenario={scenario.fuelRate}
            unit="L/h"
          />

        </div>

      </section>

      {/* =====================================================
          AI ADVISOR
          ===================================================== */}

      <section className="forecast-recommendation twin-advisor">

        <div className="recommendation-symbol">
          ✦
        </div>

        <div>

          <strong>
            Digital Twin Recommendation
          </strong>

          <p>
            {scenario.status === "CRITICAL"
              ? "Critical operating conditions detected. Protect essential loads, preserve battery reserve and prepare backup generation."
              : scenario.status === "WARNING"
                ? "The scenario increases operational stress. Maintain additional battery and diesel reserve."
                : scenario.renewableShare >= 65
                  ? "Renewable availability is favorable. Prioritize renewable energy and use excess generation to charge the battery."
                  : "The scenario remains within normal operating limits. Continue renewable-first dispatch and maintain reserve capacity."}
          </p>

        </div>

      </section>

      {/* =====================================================
          DEMO NOTICE
          ===================================================== */}

      <section className="demo-notice">

        <div className="demo-notice-icon">
          ◈
        </div>

        <div>

          <strong>
            DIGITAL TWIN / LOCAL SIMULATION
          </strong>

          <p>
            This scenario simulator uses synthetic
            operating conditions generated locally in
            the POLARGRID frontend. It does not connect
            to live Bharati or Maitri station telemetry.
          </p>

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   SLIDER
   ========================================================= */

function ScenarioSlider({
  title,
  value,
  min,
  max,
  step,
  unit,
  description,
  onChange,
}: {
  title: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
  onChange: (value: number) => void;
}) {
  const percentage =
    ((value - min) / (max - min)) * 100;

  return (
    <div className="scenario-control">

      <div className="scenario-control-header">

        <div>
          <strong>{title}</strong>

          <span>{description}</span>
        </div>

        <b>
          {value}
          {unit}
        </b>

      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            Number(event.target.value)
          )
        }
        style={{
          background: `linear-gradient(
            to right,
            #398fae ${percentage}%,
            #e2e8eb ${percentage}%
          )`,
        }}
      />

      <div className="scenario-range-labels">

        <span>
          {min}
          {unit}
        </span>

        <span>
          {max}
          {unit}
        </span>

      </div>

    </div>
  );
}

/* =========================================================
   RESULT CARD
   ========================================================= */

function TwinResultCard({
  title,
  value,
  base,
  type,
  icon,
}: {
  title: string;
  value: string;
  base: string;
  type: string;
  icon: string;
}) {
  return (
    <div className={`twin-result-card ${type}`}>

      <div className="twin-result-top">

        <span>{title}</span>

        <div className="twin-result-icon">
          {icon}
        </div>

      </div>

      <strong>{value}</strong>

      <small>{base}</small>

    </div>
  );
}

/* =========================================================
   BAR
   ========================================================= */

function TwinBar({
  label,
  value,
  max,
  display,
  className,
}: {
  label: string;
  value: number;
  max: number;
  display: string;
  className: string;
}) {
  const width = Math.min(
    Math.max((value / max) * 100, 0),
    100
  );

  return (
    <div className="twin-bar-row">

      <div className="twin-bar-header">

        <span>{label}</span>

        <strong>{display}</strong>

      </div>

      <div className="twin-bar-track">

        <div
          className={`twin-bar-fill ${className}`}
          style={{
            width: `${width}%`,
          }}
        />

      </div>

    </div>
  );
}

/* =========================================================
   IMPACT ROW
   ========================================================= */

function ImpactRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="twin-impact-row">

      <span>{label}</span>

      <strong
        className={
          positive
            ? "impact-positive"
            : "impact-warning"
        }
      >
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   COMPARISON ROW
   ========================================================= */

function ComparisonRow({
  label,
  baseline,
  scenario,
  unit,
}: {
  label: string;
  baseline: number;
  scenario: number;
  unit: string;
}) {
  const change = scenario - baseline;

  const percentage =
    baseline !== 0
      ? (change / baseline) * 100
      : 0;

  return (
    <div className="comparison-row">

      <span>{label}</span>

      <strong>
        {baseline.toFixed(1)} {unit}
      </strong>

      <strong>
        {scenario.toFixed(1)} {unit}
      </strong>

      <span
        className={
          change > 0
            ? "change-up"
            : change < 0
              ? "change-down"
              : "change-neutral"
        }
      >
        {change > 0 ? "+" : ""}
        {percentage.toFixed(1)}%
      </span>

    </div>
  );
}

export default DigitalTwin;