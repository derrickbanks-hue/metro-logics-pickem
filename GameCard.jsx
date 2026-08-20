import Countdown from './Countdown'

function confAccent(conf) {
  if (conf === 'SEC') return 'bg-crimson'
  if (conf === 'Big Ten') return 'bg-steel'
  return 'bg-line'
}

function TeamButton({ team, conference, points, isPicked, isWinner, isLoser, locked, onClick }) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={`flex-1 flex items-center justify-between gap-3 rounded px-4 py-3 border text-left transition
        ${isPicked ? 'border-amber bg-amber/10' : 'border-line bg-panelLight hover:border-chalkDim'}
        ${isLoser ? 'opacity-50' : ''}
        ${locked && !isPicked ? 'cursor-default' : ''}
      `}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${confAccent(conference)}`} />
        <span className={`truncate font-medium ${isWinner ? 'text-amber' : 'text-chalk'}`}>
          {team}
        </span>
      </span>
      {points != null && (
        <span className="font-mono tabular-nums text-sm text-chalkDim shrink-0">{points}</span>
      )}
    </button>
  )
}

export default function GameCard({ game, pick, onPick }) {
  const locked = game.status !== 'scheduled' || new Date(game.start_date) <= new Date()
  const isFinal = game.status === 'final'
  const pickedTeam = pick?.picked_team ?? null

  const kickoff = new Date(game.start_date)
  const kickoffLabel = kickoff.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="bg-panel border border-line rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="font-mono text-xs text-chalkDim">{kickoffLabel}</span>
        {isFinal ? (
          <span className="font-mono text-xs text-amber tracking-wide">FINAL</span>
        ) : locked ? (
          <span className="font-mono text-xs text-crimson tracking-wide">LOCKED</span>
        ) : (
          <Countdown startDate={game.start_date} />
        )}
      </div>
      <div className="flex gap-2 p-3">
        <TeamButton
          team={game.away_team}
          conference={game.away_conference}
          points={isFinal ? game.away_points : null}
          isPicked={pickedTeam === game.away_team}
          isWinner={isFinal && game.winner === game.away_team}
          isLoser={isFinal && game.winner && game.winner !== game.away_team}
          locked={locked}
          onClick={() => onPick(game.id, game.away_team)}
        />
        <span className="self-center text-chalkDim/50 text-xs font-mono">@</span>
        <TeamButton
          team={game.home_team}
          conference={game.home_conference}
          points={isFinal ? game.home_points : null}
          isPicked={pickedTeam === game.home_team}
          isWinner={isFinal && game.winner === game.home_team}
          isLoser={isFinal && game.winner && game.winner !== game.home_team}
          locked={locked}
          onClick={() => onPick(game.id, game.home_team)}
        />
      </div>
      {isFinal && pick && (
        <div
          className={`px-4 pb-3 text-xs font-mono ${
            pick.is_correct ? 'text-amber' : 'text-crimson'
          }`}
        >
          {pick.is_correct ? '✓ CORRECT PICK' : '✗ MISSED'}
        </div>
      )}
      {locked && !isFinal && !pickedTeam && (
        <div className="px-4 pb-3 text-xs font-mono text-chalkDim/70">NO PICK MADE</div>
      )}
    </div>
  )
}
