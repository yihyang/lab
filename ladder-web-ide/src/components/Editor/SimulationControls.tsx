import { useStore } from '../../store/useStore';
import type { SimulationSpeed } from '../../core/schema/types';

export function SimulationControls() {
  const simulation = useStore((state) => state.simulation);
  const startSimulation = useStore((state) => state.startSimulation);
  const stopSimulation = useStore((state) => state.stopSimulation);
  const resetSimulation = useStore((state) => state.resetSimulation);
  const stepSimulation = useStore((state) => state.stepSimulation);
  const toggleInput = useStore((state) => state.toggleInput);
  const setSimulationSpeed = useStore((state) => state.setSimulationSpeed);
  const project = useStore((state) => state.project);

  // Collect all variables from the project
  const inputVariables = new Set<string>();
  const outputVariables = new Set<string>();
  const timerVariables = new Set<string>();
  const counterVariables = new Set<string>();

  project.rungs.forEach((rung) => {
    rung.elements.forEach((element) => {
      if (element.variable) {
        if (element.variable.startsWith('X')) {
          inputVariables.add(element.variable);
        } else if (element.variable.startsWith('Y')) {
          outputVariables.add(element.variable);
        } else if (element.variable.startsWith('T')) {
          timerVariables.add(element.variable);
        } else if (element.variable.startsWith('C')) {
          counterVariables.add(element.variable);
        }
      }
    });
  });

  const inputs = Array.from(inputVariables).sort();
  const outputs = Array.from(outputVariables).sort();
  const timers = Array.from(timerVariables).sort();
  const counters = Array.from(counterVariables).sort();

  const speedOptions: { value: SimulationSpeed; label: string }[] = [
    { value: 'slow', label: 'Slow' },
    { value: 'medium', label: 'Med' },
    { value: 'fast', label: 'Fast' },
  ];

  return (
    <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-1.5">
      {/* Simulation controls */}
      <div className="flex items-center gap-1">
        {simulation.running ? (
          <button
            onClick={stopSimulation}
            className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
            title="Stop simulation"
          >
            <span>⏹</span>
            <span>Stop</span>
          </button>
        ) : (
          <button
            onClick={startSimulation}
            className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
            title="Start continuous simulation"
          >
            <span>▶</span>
            <span>Run</span>
          </button>
        )}

        <button
          onClick={stepSimulation}
          disabled={simulation.running}
          className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Step simulation (single cycle)"
        >
          <span>⏭</span>
          <span>Step</span>
        </button>

        <button
          onClick={resetSimulation}
          className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          title="Reset simulation"
        >
          <span>↺</span>
          <span>Reset</span>
        </button>
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">Speed:</span>
        {speedOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSimulationSpeed(option.value)}
            className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
              simulation.speed === option.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title={`${option.label} speed`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Input toggles */}
      {inputs.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">In:</span>
          {inputs.map((input) => (
            <button
              key={input}
              onClick={() => toggleInput(input)}
              className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                simulation.inputs[input]
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={`Toggle ${input}`}
            >
              {input}
            </button>
          ))}
        </div>
      )}

      {/* Output states */}
      {outputs.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Out:</span>
          {outputs.map((output) => (
            <span
              key={output}
              className={`px-2 py-0.5 text-xs font-mono rounded ${
                simulation.outputs[output]
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
              title={`${output}: ${simulation.outputs[output] ? 'ON' : 'OFF'}`}
            >
              {output}
            </span>
          ))}
        </div>
      )}

      {/* Timer values */}
      {timers.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Timers:</span>
          {timers.map((timer) => {
            const t = simulation.timers[timer];
            const elapsed = t?.elapsed ?? 0;
            const preset = t?.preset ?? 1000;
            const done = t?.done ?? false;
            return (
              <span
                key={timer}
                className={`px-2 py-0.5 text-xs font-mono rounded ${
                  done
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                title={`${timer}: ${elapsed}/${preset}ms ${done ? '(DONE)' : ''}`}
              >
                {timer}: {elapsed}/{preset}
              </span>
            );
          })}
        </div>
      )}

      {/* Counter values */}
      {counters.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Counters:</span>
          {counters.map((counter) => {
            const c = simulation.counters[counter];
            const current = c?.current ?? 0;
            const preset = c?.preset ?? 10;
            const done = c?.done ?? false;
            return (
              <span
                key={counter}
                className={`px-2 py-0.5 text-xs font-mono rounded ${
                  done
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                title={`${counter}: ${current}/${preset} ${done ? '(DONE)' : ''}`}
              >
                {counter}: {current}/{preset}
              </span>
            );
          })}
        </div>
      )}

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Cycle counter and status */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Cycles: {simulation.cycleCount}</span>
        <span
          className={`w-2 h-2 rounded-full ${
            simulation.running ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
        />
        <span className="text-xs text-gray-600">
          {simulation.running ? 'Running' : 'Stopped'}
        </span>
      </div>
    </div>
  );
}
