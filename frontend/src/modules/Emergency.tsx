import { useMemo, useState } from "react";
import type { SimulationData } from "../simulation";

type EmergencyProps = {
  simulation: SimulationData;
};

type EmergencyScenario =
  | "none"
  | "low-battery"
  | "renewable-loss"
  | "load-spike"
  | "generator-failure"
  | "full-emergency";

type EmergencyResult = {
  load: number;
  renewable: number;
  battery: number;
  diesel: number;
  fuelRate: number;
  criticalLoad: number;
  flexibleLoad: number;
  renewableShare: number;
  reserve: number;
  severity: "NORMAL" | "WARNING" | "CRITICAL";
};

function Emergency({
  simulation,
}: EmergencyProps) {
  const [scenario, setScenario] =
    useState<EmergencyScenario>("none");

  const [emergencyActive, setEmergencyActive] =
    useState(false);

  const [criticalProtection, setCriticalProtection] =
    useState(true);

  const result = useMemo<EmergencyResult>(() => {
    const baseLoad = simulation.currentLoad;

    const baseRenewable =
      simulation.renewableGeneration;

    let load = baseLoad;
    let renewable = baseRenewable;
    let battery = simulation.batterySoc;
    let diesel = simulation.dieselOutput;
    let fuelRate = simulation.fuelRate;

    /*
     * ---------------------------------------------------------
     * CRITICAL LOAD MODEL
     * ---------------------------------------------------------
     */

    const criticalLoad =
      baseLoad * 0.42;

    let flexibleLoad =
      baseLoad - criticalLoad;

    /*
     * ---------------------------------------------------------
     * SCENARIO EFFECTS
     * ---------------------------------------------------------
     */

    if (scenario === "low-battery") {
      battery = 18;

      diesel = Math.max(
        35,
        baseLoad * 0.48
      );

      fuelRate =
        2.8 + diesel * 0.14;
    }

    if (scenario === "renewable-loss") {
      renewable = 0;

      diesel =
        Math.max(
          0,
          baseLoad - battery * 0.18
        );

      fuelRate =
        diesel > 0
          ? 2.8 + diesel * 0.14
          : 0;
    }

    if (scenario === "load-spike") {
      load =
        baseLoad * 1.55;

      flexibleLoad =
        load - criticalLoad;

      diesel =
        Math.max(
          0,
          load -
            renewable -
            battery * 0.15
        );

      fuelRate =
        diesel > 0
          ? 2.8 + diesel * 0.14
          : 0;
    }

    if (scenario === "generator-failure") {
      diesel = 0;
      fuelRate = 0;

      load = baseLoad;

      renewable = baseRenewable;
    }

    if (scenario === "full-emergency") {
      load =
        baseLoad * 1.45;

      renewable =
        baseRenewable * 0.15;

      battery = 15;

      diesel = 0;

      fuelRate = 0;

      flexibleLoad =
        load - criticalLoad;
    }

    /*
     * ---------------------------------------------------------
     * CRITICAL LOAD PROTECTION
     * ---------------------------------------------------------
     */

    if (
      emergencyActive &&
      criticalProtection
    ) {
      flexibleLoad =
        Math.max(
          flexibleLoad * 0.35,
          0
        );

      load =
        criticalLoad +
        flexibleLoad;
    }

    /*
     * ---------------------------------------------------------
     * RENEWABLE SHARE
     * ---------------------------------------------------------
     */

    const renewableShare =
      load > 0
        ? Math.min(
            (renewable / load) * 100,
            100
          )
        : 0;

    /*
     * ---------------------------------------------------------
     * RESERVE
     * ---------------------------------------------------------
     */

    const reserve =
      Math.max(
        0,
        renewable +
          diesel +
          battery * 0.15 -
          load
      );

    /*
     * ---------------------------------------------------------
     * SEVERITY
     * ---------------------------------------------------------
     */

    let severity:
      EmergencyResult["severity"] =
      "NORMAL";

    if (
      scenario !== "none" ||
      battery < 30
    ) {
      severity = "WARNING";
    }

    if (
      scenario === "full-emergency" ||
      scenario === "generator-failure" ||
      battery < 20 ||
      reserve < -20
    ) {
      severity = "CRITICAL";
    }

    return {
      load,
      renewable,
      battery,
      diesel,
      fuelRate,
      criticalLoad,
      flexibleLoad,
      renewableShare,
      reserve,
      severity,
    };
  }, [
    simulation,
    scenario,
    emergencyActive,
    criticalProtection,
  ]);

  const activateScenario = (
    selected: EmergencyScenario
  ) => {
    setScenario(selected);
    setEmergencyActive(
      selected !== "none"
    );
  };

  const clearEmergency = () => {
    setScenario("none");
    setEmergencyActive(false);
    setCriticalProtection(true);
  };

  const getScenarioTitle = () => {
    switch (scenario) {
      case "low-battery":
        return "CRITICAL BATTERY LEVEL";

      case "renewable-loss":
        return "TOTAL RENEWABLE LOSS";

      case "load-spike":
        return "SUDDEN LOAD SPIKE";

      case "generator-failure":
        return "DIESEL GENERATOR FAILURE";

      case "full-emergency":
        return "FULL STATION EMERGENCY";

      default:
        return "SYSTEM NORMAL";
    }
  };

  const getScenarioDescription = () => {
    switch (scenario) {
      case "low-battery":
        return "Battery reserve has fallen below the safe operating threshold.";

      case "renewable-loss":
        return "Solar and wind generation have been completely lost.";

      case "load-spike":
        return "Station demand has suddenly increased beyond normal operating conditions.";

      case "generator-failure":
        return "Backup diesel generation is unavailable.";

      case "full-emergency":
        return "Multiple simultaneous failures require immediate critical-load protection.";

      default:
        return "No emergency condition is currently active.";
    }
  };

  return (
    <div className="module-page emergency-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="module-header">

        <div>

          <div className="eyebrow">
            CRITICAL POWER MANAGEMENT
          </div>

          <h1>
            EMERGENCY MODE
          </h1>

          <p>
            Simulate critical station failures and
            automatically evaluate emergency energy
            management responses.
          </p>

        </div>

        <div
          className={`emergency-state ${
            emergencyActive
              ? "active"
              : "standby"
          }`}
        >

          <span></span>

          {emergencyActive
            ? "EMERGENCY ACTIVE"
            : "SYSTEM STANDBY"}

        </div>

      </section>

      {/* =====================================================
          ACTIVE EMERGENCY BANNER
          ===================================================== */}

      <section
        className={`emergency-banner ${
          emergencyActive
            ? "emergency-on"
            : "emergency-off"
        }`}
      >

        <div className="emergency-symbol">
          !
        </div>

        <div className="emergency-banner-content">

          <strong>
            {getScenarioTitle()}
          </strong>

          <p>
            {getScenarioDescription()}
          </p>

        </div>

        <div
          className={`emergency-severity ${
            result.severity.toLowerCase()
          }`}
        >
          {result.severity}
        </div>

      </section>

      {/* =====================================================
          SCENARIO CONTROLS
          ===================================================== */}

      <section className="panel emergency-control-panel">

        <div className="panel-header">

          <div>

            <h2>
              Emergency Scenarios
            </h2>

            <p>
              Select a failure condition to test
              POLARGRID response logic
            </p>

          </div>

          <div className="panel-live emergency-live">

            <span></span>

            SIMULATION

          </div>

        </div>

        <div className="emergency-scenarios">

          <EmergencyButton
            title="Low Battery"
            description="Battery SOC drops below safe reserve"
            icon="🔋"
            active={
              scenario === "low-battery"
            }
            onClick={() =>
              activateScenario(
                "low-battery"
              )
            }
          />

          <EmergencyButton
            title="Renewable Loss"
            description="Solar and wind generation unavailable"
            icon="☀"
            active={
              scenario === "renewable-loss"
            }
            onClick={() =>
              activateScenario(
                "renewable-loss"
              )
            }
          />

          <EmergencyButton
            title="Load Spike"
            description="Sudden increase in station demand"
            icon="⚡"
            active={
              scenario === "load-spike"
            }
            onClick={() =>
              activateScenario(
                "load-spike"
              )
            }
          />

          <EmergencyButton
            title="Generator Failure"
            description="Diesel backup unavailable"
            icon="⛽"
            active={
              scenario === "generator-failure"
            }
            onClick={() =>
              activateScenario(
                "generator-failure"
              )
            }
          />

          <EmergencyButton
            title="Full Emergency"
            description="Multiple simultaneous system failures"
            icon="🚨"
            active={
              scenario === "full-emergency"
            }
            danger
            onClick={() =>
              activateScenario(
                "full-emergency"
              )
            }
          />

        </div>

        <div className="emergency-actions">

          <label className="protection-toggle">

            <input
              type="checkbox"
              checked={criticalProtection}
              onChange={(event) =>
                setCriticalProtection(
                  event.target.checked
                )
              }
            />

            <span className="toggle-slider"></span>

            <div>

              <strong>
                Critical Load Protection
              </strong>

              <small>
                Automatically reduce flexible
                loads during emergencies
              </small>

            </div>

          </label>

          <button
            className="clear-emergency"
            onClick={clearEmergency}
          >
            ↻ CLEAR EMERGENCY
          </button>

        </div>

      </section>

      {/* =====================================================
          EMERGENCY METRICS
          ===================================================== */}

      <section className="emergency-metrics">

        <EmergencyMetric
          title="Projected Demand"
          value={`${result.load.toFixed(1)} kW`}
          subtitle={`Normal ${simulation.currentLoad.toFixed(
            1
          )} kW`}
          type="load"
          icon="⚡"
        />

        <EmergencyMetric
          title="Renewable Supply"
          value={`${result.renewable.toFixed(1)} kW`}
          subtitle={`${result.renewableShare.toFixed(
            0
          )}% of demand`}
          type="renewable"
          icon="☀"
        />

        <EmergencyMetric
          title="Battery Reserve"
          value={`${result.battery.toFixed(0)}%`}
          subtitle={
            result.battery < 25
              ? "CRITICAL"
              : "AVAILABLE"
          }
          type="battery"
          icon="🔋"
        />

        <EmergencyMetric
          title="Diesel Support"
          value={`${result.diesel.toFixed(1)} kW`}
          subtitle={`${result.fuelRate.toFixed(
            1
          )} L/h`}
          type="diesel"
          icon="⛽"
        />

      </section>

      {/* =====================================================
          LOAD PROTECTION
          ===================================================== */}

      <section className="emergency-analysis-grid">

        <div className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Load Protection
              </h2>

              <p>
                Critical versus flexible station demand
              </p>

            </div>

          </div>

          <EmergencyLoadBar
            label="Critical Loads"
            value={result.criticalLoad}
            total={result.load}
            className="critical-load"
          />

          <EmergencyLoadBar
            label="Flexible Loads"
            value={result.flexibleLoad}
            total={result.load}
            className="flexible-load"
          />

          <div className="protection-note">

            <div className="protection-icon">
              🛡
            </div>

            <div>

              <strong>
                Critical systems protected
              </strong>

              <p>
                Laboratory equipment,
                communications, safety systems
                and essential station services
                receive priority power.
              </p>

            </div>

          </div>

        </div>

        {/* ===================================================
            POWER BALANCE
            =================================================== */}

        <div className="panel">

          <div className="panel-header">

            <div>

              <h2>
                Emergency Power Balance
              </h2>

              <p>
                Available supply versus projected demand
              </p>

            </div>

          </div>

          <PowerBalanceRow
            label="Station Demand"
            value={result.load}
            max={120}
            type="demand"
          />

          <PowerBalanceRow
            label="Renewable"
            value={result.renewable}
            max={120}
            type="renewable"
          />

          <PowerBalanceRow
            label="Diesel"
            value={result.diesel}
            max={120}
            type="diesel"
          />

          <PowerBalanceRow
            label="Reserve"
            value={Math.max(
              result.reserve,
              0
            )}
            max={50}
            type="reserve"
          />

        </div>

      </section>

      {/* =====================================================
          RESPONSE ACTIONS
          ===================================================== */}

      <section className="panel emergency-response">

        <div className="panel-header">

          <div>

            <h2>
              Automated Emergency Response
            </h2>

            <p>
              Recommended actions generated by
              the local POLARGRID control logic
            </p>

          </div>

          <div className="response-status">
            AI RESPONSE
          </div>

        </div>

        <div className="response-grid">

          <ResponseAction
            number="01"
            title="Protect Critical Loads"
            description="Maintain uninterrupted supply to essential station systems."
            active={
              criticalProtection &&
              emergencyActive
            }
          />

          <ResponseAction
            number="02"
            title="Preserve Battery Reserve"
            description="Prevent battery discharge below the emergency reserve threshold."
            active={
              result.battery < 30
            }
          />

          <ResponseAction
            number="03"
            title="Prioritize Available Renewable"
            description="Use every available renewable source before backup generation."
            active={
              result.renewable > 0
            }
          />

          <ResponseAction
            number="04"
            title="Prepare Backup Generation"
            description="Maintain diesel capacity for critical load continuity."
            active={
              result.diesel > 0 ||
              scenario === "generator-failure"
            }
          />

        </div>

      </section>

      {/* =====================================================
          OPERATOR MESSAGE
          ===================================================== */}

      <section className="forecast-recommendation emergency-advisor">

        <div className="recommendation-symbol">
          !
        </div>

        <div>

          <strong>
            Emergency Control Advisor
          </strong>

          <p>

            {scenario === "none"
              ? "No emergency condition is active. POLARGRID is monitoring the station and maintaining normal energy dispatch."
              : scenario === "low-battery"
              ? "Battery reserve is critically low. Reduce flexible loads, preserve remaining battery capacity and prepare diesel support."
              : scenario === "renewable-loss"
              ? "Renewable generation has been lost. Maintain critical loads and use battery energy before increasing diesel generation."
              : scenario === "load-spike"
              ? "Station demand has increased sharply. Shed flexible loads and distribute available generation toward critical systems."
              : scenario === "generator-failure"
              ? "Diesel backup is unavailable. Preserve battery energy and immediately prioritize critical station loads."
              : "Multiple failures are active. Maintain critical-load protection, preserve battery reserve and isolate non-essential consumption."}

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
            EMERGENCY SIMULATION / DEMO MODE
          </strong>

          <p>
            Emergency conditions shown here are
            locally generated synthetic scenarios.
            They are intended to demonstrate the
            POLARGRID control strategy and do not
            represent live station telemetry.
          </p>

        </div>

      </section>

    </div>
  );
}

/*
 * =========================================================
 * EMERGENCY BUTTON
 * =========================================================
 */

function EmergencyButton({
  title,
  description,
  icon,
  active,
  danger = false,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`emergency-scenario-button ${
        active ? "active" : ""
      } ${danger ? "danger" : ""}`}
      onClick={onClick}
    >

      <div className="scenario-icon">
        {icon}
      </div>

      <div className="scenario-text">

        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>

      </div>

      <div className="scenario-arrow">
        →
      </div>

    </button>
  );
}

/*
 * =========================================================
 * EMERGENCY METRIC
 * =========================================================
 */

function EmergencyMetric({
  title,
  value,
  subtitle,
  type,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  type: string;
  icon: string;
}) {
  return (
    <div
      className={`emergency-metric ${type}`}
    >

      <div className="emergency-metric-top">

        <span>
          {title}
        </span>

        <div className="emergency-metric-icon">
          {icon}
        </div>

      </div>

      <strong>
        {value}
      </strong>

      <small>
        {subtitle}
      </small>

    </div>
  );
}

/*
 * =========================================================
 * LOAD BAR
 * =========================================================
 */

function EmergencyLoadBar({
  label,
  value,
  total,
  className,
}: {
  label: string;
  value: number;
  total: number;
  className: string;
}) {
  const percentage =
    total > 0
      ? Math.min(
          (value / total) * 100,
          100
        )
      : 0;

  return (
    <div className="emergency-load-bar">

      <div className="emergency-load-header">

        <span>
          {label}
        </span>

        <strong>
          {value.toFixed(1)} kW
        </strong>

      </div>

      <div className="emergency-load-track">

        <div
          className={`emergency-load-fill ${className}`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

/*
 * =========================================================
 * POWER BALANCE
 * =========================================================
 */

function PowerBalanceRow({
  label,
  value,
  max,
  type,
}: {
  label: string;
  value: number;
  max: number;
  type: string;
}) {
  const width =
    Math.min(
      Math.max(
        (value / max) * 100,
        0
      ),
      100
    );

  return (
    <div className="power-balance-row">

      <div className="power-balance-header">

        <span>
          {label}
        </span>

        <strong>
          {value.toFixed(1)} kW
        </strong>

      </div>

      <div className="power-balance-track">

        <div
          className={`power-balance-fill ${type}`}
          style={{
            width: `${width}%`,
          }}
        />

      </div>

    </div>
  );
}

/*
 * =========================================================
 * RESPONSE ACTION
 * =========================================================
 */

function ResponseAction({
  number,
  title,
  description,
  active,
}: {
  number: string;
  title: string;
  description: string;
  active: boolean;
}) {
  return (
    <div
      className={`response-action ${
        active ? "active" : ""
      }`}
    >

      <div className="response-number">
        {number}
      </div>

      <div>

        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>

      </div>

      <div className="response-check">

        {active ? "✓" : "○"}

      </div>

    </div>
  );
}

export default Emergency;