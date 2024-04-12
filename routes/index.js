const routes = require('express').Router();
const { EventEmitter } = require('events');
const eventEmitter = new EventEmitter();
const fs = require('fs');
const passport = require("passport");
const url = require("url");
const Rooms = require('../models/Room.js');
const Users = require('../models/User.js');
const { customAlphabet } = require('nanoid');
const genRoomId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUWXYZabcdefghijklmnopqrstuvwxyz1234567890', 5)

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(`../events/${file}`);
  eventEmitter.on(event.name, (...args) => event.execute(...args, eventEmitter));
}

const renderTemplate = async (res, req, template, data = {}) => {
  let user = null;
  if (req.isAuthenticated() == true) {
    user = await Users.findOne({ id: req.user.id });
  }
  const baseData = await {
    req: req,
    url: req.url,
    user: user,
    connecting: data.connecting ?? null
  };
  res.render(
    `./${template}`,
    Object.assign(baseData, data)
  );
};

const checkAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.session.backURL = req.url;
  res.redirect("/login");
};

routes.get('/', (req, res) => {
  renderTemplate(res, req, "index.ejs");
});

routes.get('/room/create', checkAuth, async (req, res) => {
  await Rooms.deleteMany({})
  const room = await Rooms.findOne({ hostId: req.user.id })
  if (room && room.state !== 'ended') return renderTemplate(res, req, "error.ejs", { err: 'You are already inside a room' })
  let roomId = null
  while (!roomId) {
    const newRoomId = genRoomId()
    const players = []
    players.push(req.user)

    const alrRoom = await Rooms.findOne({ id: newRoomId })
    if (!alrRoom) {
      await new Rooms({
        id: newRoomId,
        state: 'started',
        rounds: [],
        totalRounds: 3,
        createdAt: new Date()
      }).save()
      res.redirect(`/room?id=${newRoomId}`)
      roomId = newRoomId;
    }
  }
});

routes.get('/room', checkAuth, async (req, res) => {
  if (!req.query.id) return res.redirect('/')
  const roomId = req.query.id;
  const room = await Rooms.findOne({ id: roomId })
  if (!room) return renderTemplate(res, req, "404.ejs", { err: 'Room not found' })

  if (room.state == 'ended') {
    return res.redirect('/')
  }
  const ifPlayer = await Rooms.findOne({ playerIds: req.user.id })
  if (ifPlayer) {
    return renderTemplate(res, req, "error.ejs", { err: 'You are already inside a room' })
  }
  if (room.players.length <= 0) {
    renderTemplate(res, req, "room.ejs", { connecting: true, Rooms: Rooms, room: room })
    await Rooms.updateOne(
      { id: roomId },
      {
        $push: { players: req.user, playerIds: req.user.id },
        $set: { host: req.user }
      }
    )
    req.io.sockets.on('connection', async (socket) => {
      const roomNew = await Rooms.findOne({ id: roomId })
      if (!roomNew) return;
      if (socket.request.user.id == roomNew.host.id) {
        socket.join(roomId)
        req.io.to(socket.id).emit('roomConnect', { room: room })
      }
    })
  } else {
    if (room.players.length > 1) {
      return renderTemplate(res, req, "error.ejs", { err: 'Room is full' })
    }
    renderTemplate(res, req, "room.ejs", { Rooms: Rooms, room: room });
    const roundEndsAt = new Date(new Date().getTime() + (30000))
    await Rooms.updateOne(
      { id: roomId },
      {
        $push: { players: req.user, playerIds: req.user.id },
        $set: { nextRoundEndsAt: roundEndsAt }
      }
    )
    req.io.sockets.on('connection', async (socket) => {
      const roomNew = await Rooms.findOne({ id: roomId })
      if (!roomNew) return;
      const playerUser = await Users.findOne({ id: req.user.id })
      if (socket.request.user.id == req.user.id) {
        await socket.join(roomId)
        if (req.io.sockets.adapter.rooms.get(room.id) <= 1) return;
        req.io.to(socket.id).emit('playerJoined', { oppPlayer: room.host, player: playerUser, room: room })
        const otherUser = Array.from(req.io.sockets.adapter.rooms.get(room.id), (id) => ({ id })).filter(m => m.id !== socket.id);
        req.io.to(otherUser[0].id).emit('playerJoined', { oppPlayer: playerUser, player: room.host, room: room })
        eventEmitter.emit("roundStart", res, req, room, eventEmitter)
      }
    })
  }
});

routes.get(
  "/auth/google",
  (req, res, next) => {
    if (req.session.backURL) {
      req.session.backURL = req.session.backURL;
    } else if (req.headers.referer) {
      const parsed = url.parse(req.headers.referer);
      if (parsed.hostname === 'rps.amannn.tk') {
        req.session.backURL = parsed.path;
      }
    } else {
      req.session.backURL = "/";
    }
    next();
  },
  passport.authenticate("google"),
);

routes.get(
  "/callback/google",
  passport.authenticate("google", { failureRedirect: "/" }),
  (
    req,
    res,
  ) => {
    if (req.session.backURL) {
      const backURL = req.session.backURL;
      req.session.backURL = null;
      res.redirect(backURL);
    } else {
      res.redirect("/");
    }
  },
);

routes.get(
  "/auth/discord",
  (req, res, next) => {
    if (req.session.backURL) {
      req.session.backURL = req.session.backURL;
    } else if (req.headers.referer) {
      const parsed = url.parse(req.headers.referer);
      if (parsed.hostname === 'rps.amannn.tk') {
        req.session.backURL = parsed.path;
      }
    } else {
      req.session.backURL = "/";
    }
    next();
  },
  passport.authenticate("discord"),
);

routes.get(
  "/callback/discord",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (
    req,
    res,
  ) => {
    if (req.session.backURL) {
      const backURL = req.session.backURL;
      req.session.backURL = null;
      res.redirect(backURL);
    } else {
      res.redirect("/");
    }
  },
);

routes.post('/battle/choose/:getId', async function(req, res) {
  if (!req.body && !req.body.choice) {
    return res.send('choice should be specified')
  }
  if (!req.user) {
    return res.send('not logged in')
  }
  if (req.body.choice !== 'rock' && req.body.choice !== 'scissor' && req.body.choice !== 'paper') return res.send('invalid choice')
  const roomId = req.params.getId;
  const room = await Rooms.findOne({ id: roomId })
  if (!room) return res.send('room not found')
  if (!room.playerIds.includes(req.user.id)) return res.send('unauthorized')
  const currRound = room.rounds.filter(r => r.roundNumber == room.currentRound)
  if (currRound.length !== 0) {
    const userChoice = currRound[0].choices.filter(c => c.user.id == req.user.id)
    if (userChoice.length !== 0) {
      await Rooms.updateOne(
        { id: room.id },
        { $set: { "rounds.$[rounds].choices.$[choices].choice": req.body.choice } },
        {
          "arrayFilters": [
            { "rounds.roundNumber": room.currentRound },
            { "choices.user.id": req.user.id }]
        }
      )
    } else {
      await Rooms.updateOne(
        {
          id: room.id,
          "rounds.roundNumber": room.currentRound
        },
        { $push: { "rounds.$.choices": { user: req.user, choice: req.body.choice } } }
      )
    }
  } else {
    await Rooms.updateOne(
      { id: room.id },
      { $push: { rounds: { roundNumber: room.currentRound, choices: { user: req.user, choice: req.body.choice } } } }
    )
  }
})

routes.post("/room/join", async function(req, res) {
  if (!req.user) return res.redirect('/login')
  if (!req.body && !req.body.roomId) return;
  res.redirect(`/room?id=${req.body.roomId}`)
})

routes.get("/login", async function(req, res, next) {
  renderTemplate(res, req, "login.ejs");
})

routes.get("/logout", async function(req, res, next) {
  req.logout(async function(err) {
    if (err) {
      console.log(err)
      return next(err);
    }
    res.redirect('/')
  });
});

module.exports = routes;