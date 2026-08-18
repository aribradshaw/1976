import { buildElectoralForecast } from '../game/simulation/forecast';
import { GameState, StateData } from '../types/game';
import './StateTable.css';

interface StateTableProps {
  states: StateData[];
  gameState: GameState;
  onSelect: (abbreviation: string) => void;
}

export default function StateTable({ states, gameState, onSelect }: StateTableProps) {
  const names = new Map(states.map(state => [state.abbreviation, state.name]));
  const polling = gameState.polling;
  const forecasts = buildElectoralForecast(states, polling).stateForecasts
    .map(forecast => ({ ...forecast, name: names.get(forecast.state) ?? forecast.state, poll: polling.get(forecast.state) }))
    .sort((left, right) => Math.abs(left.democraticWinProbability - 0.5) - Math.abs(right.democraticWinProbability - 0.5));

  return (
    <div className="state-table-wrap" tabIndex={0} aria-label="Sortable state forecast table, closest races first">
      <table className="state-table">
        <caption>State forecast, ordered from closest race to safest</caption>
        <thead>
          <tr><th>State</th><th>EV</th><th>Dem</th><th>Rep</th><th>Carter chance</th><th>Action</th></tr>
        </thead>
        <tbody>
          {forecasts.map(state => (
            <tr key={state.state}>
              <th scope="row">{state.name} <span>{state.state}</span></th>
              <td>{state.electoralVotes}</td>
              <td>{state.poll?.democraticSupport.toFixed(1) ?? '–'}%</td>
              <td>{state.poll?.republicanSupport.toFixed(1) ?? '–'}%</td>
              <td>{Math.round(state.democraticWinProbability * 100)}%</td>
              <td><button onClick={() => onSelect(state.state)}>Open</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
