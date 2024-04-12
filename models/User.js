const { model, Schema } = require('mongoose');

module.exports = model(
  'User',
  new Schema({
    id: String,
    username: String,
    email: String,
    avatarUrl: String,
    xp: { type: Number, default: 0 },
    battles: [
      {
        id: String,
        host: Object,
        players: Array,
        winner: Object,
        rounds: Array,
        winnerXp: Number,
        endedAt: Date
      }
    ],
    badges: [
      {
        name: String,
        recievedDate: Date
      }
    ],
    createdAt: Date
  })
);