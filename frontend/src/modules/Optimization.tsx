import { useMemo } from "react";
import type { SimulationData } from "../simulation";

type OptimizationProps = {
  simulation: SimulationData;
};

function Optimization({
  simulation,
}: OptimizationProps) {
  const result = useMemo(() => {
    const demand = simulation.currentLoad;

    const solar = simulation.solarGeneration;
    const wind = simulation.windGeneration;

    const renewable = solar + wind;

    const renewableUsed = Math.min(
      renewable,
      demand
    );

    const surplus = Math.max(
      renewable - demand,
      0
    );

    const deficit = Math.max(
      demand - renewable,
      0
    );

    let batteryPower = 0;
    let dieselOutput = 0;

    /*
     * OPTIMIZATION LOGIC
     */

    if (surplus > 0) {
      /*
       * Renewable surplus:
       * charge battery instead of wasting energy.
       */
      if (simulation.batterySoc < 95) {
        batteryPower = Math.min(
          surplus * 0.8,
          18
        );
      }
    } else {
      /*
       * Renewable deficit:
       * use battery first.
       */
      if (simulation.batterySoc > 30) {
        batteryPower = -Math.min(
          deficit * 0.65,
          20
        );
      }

      /*
       * Remaining deficit goes to diesel.
       */
      dieselOutput = Math.max(
        0,
        deficit - Math.abs(batteryPower)
      );
    }

    const optimizedFuel =
      dieselOutput > 0
        ? 2.8 + dieselOutput * 0.14
        : 0;

    const currentFuel = simulation.fuelRate;

    const fuelSaving = Math.max(
      currentFuel - optimizedFuel,
      0
    );

    const renewableUtilization =
      demand > 0
        ? (renewableUsed / demand) * 100
        : 0;

    let status = "OPTIMIZED";

    if (simulation.batterySoc < 30) {
      status = "BATTERY PROTECTION";
    }

    if (dieselOutput > demand * 0.5) {
      status = "HIGH DIESEL SUPPORT";
    }

    return {
      demand,
      solar,
      wind,
      renewable,
      renewableUsed,
      surplus,
      deficit,
      batteryPower,
      dieselOutput,
      optimizedFuel,
      currentFuel,
      fuelSaving,
      renewableUtilization,
      status,
    };
  }, [simulation]);

  return (
    <div className="module-page">
      {/* HEADER */}

      <section className="module-header">
        <div>
          <div className="eyebrow">
            AI ENERGY MANAGEMENT
          </div>

          <h1>ENERGY OPTIMIZATION</h1>

          <p>
            Real-time energy dispatch strategy designed
            to reduce diesel dependency and maximize
            renewable utilization.
          </p>
        </div>

        <div className="optimization-status">
          <span></span>

          {result.status}
        </div>
      </section>

      {/* SUMMARY */}

      <section className="optimization-summary">
        <div className="optimization-stat">
          <span>Current Demand</span>

          <strong>
            {result.demand.toFixed(1)} kW
          </strong>
        </div>

        <div className="optimization-stat">
          <span>Renewable Available</span>

          <strong>
            {result.renewable.toFixed(1)} kW
          </strong>
        </div>

        <div className="optimization-stat">
          <span>Renewable Utilization</span>

          <strong>
            {result.renewableUtilization.toFixed(0)}%
          </strong>
        </div>

        <div className="optimization-stat">
          <span>Potential Fuel Saving</span>

          <strong>
            {result.fuelSaving.toFixed(2)} L/h
          </strong>
        </div>
      </section>

      {/* DISPATCH */}

      <section className="panel optimization-panel">
        <PanelHeader
          title="Optimal Energy Dispatch"
          subtitle="Recommended power allocation"
        />

        <div className="dispatch-grid">
          <DispatchCard
            title="Solar"
            icon="☀"
            value={result.solar}
            unit="kW"
            description="Priority renewable source"
            className="solar"
          />

          <DispatchCard
            title="Wind"
            icon="🌬"
            value={result.wind}
            unit="kW"
            description="Variable renewable source"
            className="wind"
          />

          <DispatchCard
            title="Battery"
            icon="🔋"
            value={Math.abs(result.batteryPower)}
            unit="kW"
            description={
              result.batteryPower >= 0
                ? "Charging"
                : "Discharging"
            }
            className="battery"
          />

          <DispatchCard
            title="Diesel"
            icon="⛽"
            value={result.dieselOutput}
            unit="kW"
            description={
              result.dieselOutput > 0
                ? "Backup generation"
                : "Standby"
            }
            className="diesel"
          />
        </div>
      </section>

      {/* BALANCE */}

      <section className="optimization-grid">
        <div className="panel">
          <PanelHeader
            title="Demand vs Supply"
            subtitle="Current power balance"
          />

          <div className="balance-container">
            <BalanceBar
              label="Station Demand"
              value={result.demand}
              max={Math.max(
                result.demand,
                result.renewable,
                100
              )}
              className="demand"
            />

            <BalanceBar
              label="Renewable Supply"
              value={result.renewable}
              max={Math.max(
                result.demand,
                result.renewable,
                100
              )}
              className="renewable"
            />

            <BalanceBar
              label="Battery Support"
              value={Math.abs(
                result.batteryPower
              )}
              max={50}
              className="battery"
            />

            <BalanceBar
              label="Diesel Support"
              value={result.dieselOutput}
              max={65}
              className="diesel"
            />
          </div>
        </div>

        {/* FUEL */}

        <div className="panel">
          <PanelHeader
            title="Fuel Optimization"
            subtitle="Current vs optimized operation"
          />

          <div className="fuel-comparison">
            <div className="fuel-card current">
              <span>Current</span>

              <strong>
                {result.currentFuel.toFixed(2)}
              </strong>

              <small>L/h</small>
            </div>

            <div className="fuel-arrow">
              →
            </div>

            <div className="fuel-card optimized">
              <span>Optimized</span>

              <strong>
                {result.optimizedFuel.toFixed(2)}
              </strong>

              <small>L/h</small>
            </div>
          </div>

          <div className="fuel-saving">
            <span>Potential saving</span>

            <strong>
              {result.fuelSaving.toFixed(2)} L/h
            </strong>
          </div>
        </div>
      </section>

      {/* STRATEGY */}

      <section className="panel">
        <PanelHeader
          title="Optimization Strategy"
          subtitle="Rules currently applied by the local optimization engine"
        />

        <div className="strategy-grid">
          <StrategyCard
            number="01"
            title="Renewable First"
            text="Use available solar and wind generation before relying on diesel generation."
          />

          <StrategyCard
            number="02"
            title="Battery Support"
            text="Charge during renewable surplus and discharge during renewable deficits."
          />

          <StrategyCard
            number="03"
            title="Diesel Minimization"
            text="Use the generator only for the remaining power deficit."
          />

          <StrategyCard
            number="04"
            title="Critical Reserve"
            text="Maintain sufficient battery state of charge to protect critical station loads."
          />
        </div>
      </section>

      {/* NOTE */}

      <section className="optimization-note">
        <div>◈</div>

        <p>
          This optimization module is running entirely
          in the browser using simulated station
          telemetry. It demonstrates the decision-making
          layer of POLARGRID without requiring backend
          services or physical IoT hardware.
        </p>
      </section>
    </div>
  );
}

/* =========================================================
   DISPATCH CARD
   ========================================================= */

function DispatchCard({
  title,
  icon,
  value,
  unit,
  description,
  className,
}: {
  title: string;
  icon: string;
  value: number;
  unit: string;
  description: string;
  className: string;
}) {
  return (
    <div
      className={`dispatch-card ${className}`}
    >
      <div className="dispatch-icon">
        {icon}
      </div>

      <div className="dispatch-title">
        {title}
      </div>

      <div className="dispatch-value">
        {value.toFixed(1)}
        <span>{unit}</span>
      </div>

      <div className="dispatch-description">
        {description}
      </div>
    </div>
  );
}

/* =========================================================
   BALANCE BAR
   ========================================================= */

function BalanceBar({
  label,
  value,
  max,
  className,
}: {
  label: string;
  value: number;
  max: number;
  className: string;
}) {
  const width =
    max > 0
      ? Math.min((value / max) * 100, 100)
      : 0;

  return (
    <div className="balance-item">
      <div className="balance-header">
        <span>{label}</span>

        <strong>
          {value.toFixed(1)} kW
        </strong>
      </div>

      <div className="balance-track">
        <div
          className={`balance-fill ${className}`}
          style={{
            width: `${width}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   STRATEGY CARD
   ========================================================= */

function StrategyCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="strategy-card">
      <div className="strategy-number">
        {number}
      </div>

      <div>
        <h3>{title}</h3>

        <p>{text}</p>
      </div>
    </div>
  );
}

/* =========================================================
   REUSABLE PANEL HEADER
   ========================================================= */

function PanelHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="panel-header">
      <div>
        <h2>{title}</h2>

        <p>{subtitle}</p>
      </div>

      <div className="panel-live">
        <span></span>
        LIVE
      </div>
    </div>
  );
}

export default Optimization;