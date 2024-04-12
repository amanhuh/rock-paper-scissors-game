const { model, Schema } = require('mongoose');

module.exports = model(
  'Rooms',
  new Schema({
    id: String,
    host: Object,
    playerIds: Array,
    players: Array,
    state: String,
    rounds: [
      {
        roundNumber: Number,
        choices: [
          {
            user: Object,
            choice: String
          }
        ],
        roundEndEvent: { type: Array, default: [] },
        winner: Object,
        winnerChoice: String,
        loser: Object,
        looserChoice: String,
        endedAt: Date
      }
    ],
    nextRoundEndsAt: Date,
    currentRound: { type: Number, default: 1 },
    totalRounds: { type: Number, default: 3 },
    createdAt: Date
  })
);