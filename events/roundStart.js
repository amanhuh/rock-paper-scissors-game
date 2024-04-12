const Rooms = require('../models/Room.js');
const Users = require('../models/User.js');

module.exports = {
  name: 'roundStart',
  async execute(res, req, oldRoom, eventEmitter) {
    try {
      setTimeout(async () => {
        const room = await Rooms.findOne({ id: oldRoom.id })
        if (!room) {
          return;
        }
        const currRound = room.rounds.filter(r => r.roundNumber == room.currentRound);
        if (currRound.length == 0) {
          await Rooms.deleteOne({ id: oldRoom.id })
          req.io.to(oldRoom.id).emit('inactiveEnd')
          req.io.socketsLeave(oldRoom.id)
        } else {
          const lastRound = room.rounds.sort((a, b) => b.roundNumber - a.roundNumber)[0];
          const ioRoom = req.io.sockets.adapter.rooms.get(room.id);
          if (currRound[0].choices.length == 0) {

          } else if (currRound[0].choices.length == 1) {
            const winner = currRound[0].choices[0].user;
            const looser = room.players.filter(u => u.id !== winner.id)[0];
            const otherUser = room.players.filter(u => u.id !== req.user.id)[0];
            await Rooms.updateOne(
              {
                id: room.id,
                "rounds.roundNumber": room.currentRound
              },
              {
                $set: { "rounds.$.winner": winner, "rounds.$.winnerChoice": currRound[0].choices[0].choice, "rounds.$.looser": looser, "rounds.$.looserChoice": null }
              }
            )
            const newRoom = await Rooms.findOne({ id: room.id })
            ioRoom.forEach(async (r) => {
              if (req.io.sockets.sockets.get(r).request.user.id == req.user.id) {
                req.io.to(r).emit('roundEnded', { winner: winner, winnerChoice: currRound[0].choices[0].choice, looser: looser, looserChoice: null, user: req.user, room: newRoom })
              } else {
                req.io.to(r).emit('roundEnded', { winner: winner, winnerChoice: currRound[0].choices[0].choice, looser: looser, looserChoice: null, user: otherUser, room: newRoom })
              }
            })
            if (room.rounds.length < 3) {
              setTimeout(async () => {
                await Rooms.updateOne(
                  { id: room.id },
                  { $set: { currentRound: room.currentRound + 1 } }
                )
                const newestRoom = await Rooms.findOne({ id: room.id })
                req.io.to(room.id).emit('newRoundStart', { room: newestRoom })
                eventEmitter.emit("roundStart", res, req, oldRoom, eventEmitter)
              }, 4000)
            } else {
              let uUser = 0;
              let oUser = 0;
              const otherUser = newRoom.players.filter(u => u.id !== req.user.id)[0]
              for (let i = 0; i < newRoom.rounds.length; i++) {
                if (newRoom.rounds[i].winner.id == req.user.id) {
                  uUser = uUser+1;
                } else {
                  oUser = oUser+1
                }
              }
              const winXp = Math.floor(Math.random() * 26) + 25;
              if (uUser > oUser) {
                for (let pi = 0; pi < newRoom.players.length; pi++) {
                  await Users.updateOne(
                    { id: newRoom.players[pi].id },
                    { 
                      $push: { battles: { id: newRoom.id, host: newRoom.host, players: newRoom.players, winner: req.user, rounds: newRoom.rounds, winnerXp: winXp, endedAt: new Date() } }
                    }
                  )
                }
                await Users.updateOne(
                  { id: req.user.id },
                  { $inc: { xp: winXp } }
                )
                req.io.to(room.id).emit('gameEnded', { room: newRoom, winner: req.user, winXp: winXp })
              } else {
                for (let pi = 0; pi < newRoom.players.length; pi++) {
                  await Users.updateOne(
                    { id: newRoom.players[pi].id },
                    { 
                      $push: { battles: { id: newRoom.id, host: newRoom.host, players: newRoom.players, winner: otherUser, rounds: newRoom.rounds, winnerXp: winXp, endedAt: new Date() } }
                    }
                  )
                }
                await Users.updateOne(
                  { id: otherUser.id },
                  { $inc: { xp: winXp } }
                )
                req.io.to(room.id).emit('gameEnded', { room: newRoom, winner: otherUser, winXp: winXp })
              }
              await Rooms.deleteOne({ id: newRoom.id })
              req.io.socketsLeave(newRoom.id)
            }
          } else {
            const uChoice = currRound[0].choices.filter(c => c.user.id == req.user.id)[0];
            const oChoice = currRound[0].choices.filter(c => c.user.id !== req.user.id)[0];
            let winner = null;
            let looser = null;
            if (uChoice.choice == oChoice.choice) {
              const newRoom = await Rooms.findOne({ id: room.id })
              req.io.to(room.id).emit('gameTied', { room: newRoom })
              setTimeout(async () => {
                req.io.to(room.id).emit('newRoundStart', { room: newRoom })
                eventEmitter.emit("roundStart", res, req, oldRoom, eventEmitter)
              }, 4000)
              return;
            } else if (uChoice.choice == 'rock') {
              if (oChoice.choice == 'paper') {
                winner = oChoice;
                looser = uChoice;
              } else {
                winner = uChoice;
                looser = oChoice;
              }
            } else if (uChoice.choice == 'paper') {
              if (oChoice.choice == 'scissor') {
                winner = oChoice;
                looser = uChoice;
              } else {
                winner = uChoice;
                looser = oChoice;
              }
            } else if (uChoice.choice == 'scissor') {
              if (oChoice.choice == 'rock') {
                winner = oChoice;
                looser = uChoice;
              } else {
                winner = uChoice;
                looser = oChoice;
              }    
            }
            if (!winner) return;
            await Rooms.updateOne(
              {
                id: room.id,
                "rounds.roundNumber": room.currentRound
              },
              {
                $set: { "rounds.$.winner": winner.user, "rounds.$.winnerChoice": winner.choice, "rounds.$.looser": looser.user, "rounds.$.looserChoice": looser.choice }
              }
            )
            const newRoom = await Rooms.findOne({ id: room.id })
            ioRoom.forEach(async (r) => {
              if (req.io.sockets.sockets.get(r).request.user.id == req.user.id) {
                req.io.to(r).emit('roundEnded', { winner: winner.user, winnerChoice: winner.choice, looser: looser.user, looserChoice: looser.choice, user: req.user, room: newRoom })
              } else {
                req.io.to(r).emit('roundEnded', { winner: winner.user, winnerChoice: winner.choice, looser: looser.user, looserChoice: looser.choice, user: req.io.sockets.sockets.get(r).request.user, room: newRoom })
              }
            })
            if (room.rounds.length < 3) {
              setTimeout(async () => {
                await Rooms.updateOne(
                  { id: room.id },
                  { $set: { currentRound: room.currentRound + 1 } }
                )
                const newestRoom = await Rooms.findOne({ id: room.id })
                req.io.to(room.id).emit('newRoundStart', { room: newestRoom })
                eventEmitter.emit("roundStart", res, req, oldRoom, eventEmitter)
              }, 4000)
            } else {
              let uUser = 0;
              let oUser = 0;
              const otherUser = newRoom.players.filter(u => u.id !== req.user.id)[0]
              for (let i = 0; i < newRoom.rounds.length; i++) {
                if (newRoom.rounds[i].winner.id == req.user.id) {
                  uUser = uUser+1;
                } else {
                  oUser = oUser+1
                }
              }
              const winXp = Math.floor(Math.random() * 26) + 25;
              if (uUser > oUser) {
                for (let pi = 0; pi < newRoom.players.length; pi++) {
                  await Users.updateOne(
                    { id: newRoom.players[pi].id },
                    { 
                      $push: { battles: { id: newRoom.id, host: newRoom.host, players: newRoom.players, winner: req.user, rounds: newRoom.rounds, winnerXp: winXp, endedAt: new Date() } }
                    }
                  )
                }
                await Users.updateOne(
                  { id: req.user.id },
                  { $inc: { xp: winXp } }
                )
                req.io.to(room.id).emit('gameEnded', { room: newRoom, winner: req.user, winXp: winXp })
              } else {
                for (let pi = 0; pi < newRoom.players.length; pi++) {
                  await Users.updateOne(
                    { id: newRoom.players[pi].id },
                    { 
                      $push: { battles: { id: newRoom.id, host: newRoom.host, players: newRoom.players, winner: otherUser, rounds: newRoom.rounds, winnerXp: winXp, endedAt: new Date() } }
                    }
                  )
                }
                await Users.updateOne(
                  { id: otherUser.id },
                  { $inc: { xp: winXp } }
                )
                req.io.to(room.id).emit('gameEnded', { room: newRoom, winner: otherUser, winXp: winXp })
              }
              await Rooms.deleteOne({ id: newRoom.id })
              req.io.socketsLeave(newRoom.id)
            }
          }
        }
      }, 16500)
    } catch (e) {
      console.log(e)
    }
  }
}