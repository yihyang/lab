import { useStore } from '../../store/useStore';

export function SimulationControls() {
  const simulation = useStore((state) => state.simulation);
  const startSimulation = useStore((state) => state.startSimulation);
  const stopSimulation = useStore((state) => state.stopSimulation);
  const resetSimulation = useStore((state) => state.resetSimulation);
  const stepSimulation = useStore((state) => state.stepSimulation);
  const toggleInput = useStore((state) => state.toggleInput);
  const project = useStore((state) => state.project);

  // Collect all input variables from the project
  const inputVariables = new Set<string>();
  project.rungs.forEach((rung) => {
    rung.elements.forEach((element) => {
      if (element.variable?.startsWith('X')) {
        inputVariables.add(element.variable);
      }
    });
  });
  const inputs = Array.from(inputVariables).sort();

  return (
    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
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
            title="Start simulation"
          >
            <span>▶</span>
            <span>Run</span>
          </button>
        )}

        <button
          onClick={stepSimulation}
          className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          title="Step simulation"
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

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Input toggles */}
      {inputs.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1">Inputs:</span>
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

      {/* Divider */}
      {inputs.length > 0 && <div className="w-px h-6 bg-gray-300" />}

      {/* Status indicator */}
      <div className="flex items-center gap-1">
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
