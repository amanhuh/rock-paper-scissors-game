const express = require("express"),
  path = require('path')
const app = express();
const port = 8080;
const routes = require('./routes');
const mongoose = require("mongoose");
const ejs = require("ejs");
const url = require("url");
const server = require("http").Server(app);
const io = require('socket.io')(server);
const passport = require("passport");
const session = require("express-session");
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const toastr = require('express-toastr');
const flash = require('connect-flash');
const Strategy = require("passport-discord").Strategy;
const googleStrategy = require('passport-google-oauth20').Strategy;
const cloudinary = require('cloudinary').v2;
const User = require('./models/User.js')
cloudinary.config({
  cloud_name: process.env.cloudName,
  api_key: process.env.cloudinaryKey,
  api_secret: process.env.cloudinarySecret,
  secure: true
})
const game = require('./utils/game.js');
const domainUrl = new URL('https:/rps.amannn.tk');
domain = {
  host: domainUrl.hostname,
  protocol: domainUrl.protocol,
};

mongoose.connect(process.env.mongodb, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const callbackUrl = `${domain.protocol}//${domain.host}/callback/discord`
const gglCallbackUrl = `${domain.protocol}//${domain.host}/callback/google`
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.set('views', './views');
app.set('view engine', 'ejs');
app.use((req, res, next) => {
  req.io = io;
  return next();
});

server.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));

passport.use(
  new Strategy(
    {
      clientID: process.env.clientId,
      clientSecret: process.env.clientSecret,
      callbackURL: callbackUrl,
      scope: ["identify", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      if (!profile.email) return;
      const user = await User.findOne({ email: profile.email })
      if (!user) {
        if (profile.email) {
          if (profile.avatar) {
            cloudinary.uploader
              .upload(`https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`, {
                resource_type: "image",
                public_id: `avatars/user/${profile.id}`
              }).then(async (result) => {
                const newUser = await new User({
                  id: profile.id,
                  username: profile.username,
                  email: profile.email,
                  avatarUrl: result.url,
                  createdAt: new Date()
                }).save()
                process.nextTick(() => done(null, newUser));
              })
          } else {
            const newUser = await new User({
              id: profile.id,
              username: profile.username,
              email: profile.email,
              createdAt: new Date()
            }).save()
            process.nextTick(() => done(null, newUser));
          }
        }
      } else {
        process.nextTick(() => done(null, user));
      }
    },
  ),
);

passport.use(
  new googleStrategy({
    clientID: process.env.googleId,
    clientSecret: process.env.googleSecret,
    callbackURL: gglCallbackUrl,
    scope: ["email", "profile"]
  },
    async function(accessToken, refreshToken, profile, done) {
      if (!profile._json) return;
      const user = await User.findOne({ email: profile._json.email })
      if (!user) {
        cloudinary.uploader
          .upload(profile._json.picture, {
            resource_type: "image",
            public_id: `avatars/user/${profile._json.sub}`
          }).then(async (result) => {
            const newUser = await new User({
              id: profile._json.sub,
              username: profile._json.name,
              avatarUrl: result.url,
              email: profile._json.email,
              createdAt: new Date()
            }).save()
            process.nextTick(() => done(null, newUser));
          })
      } else {
        process.nextTick(() => done(null, user));
      }
    }
  )
);

let ejsOptions = {
  async: true
};

app.engine('ejs', async (path, data, cb) => {
  try {
    let html = await ejs.renderFile(path, data, ejsOptions);
    cb(null, html);
  } catch (e) {
    cb(e, '');
  }
});

app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
const sessionMiddleware = session({
  store: new MongoStore({
    mongoUrl: process.env.mongodb,
    ttl: 14 * 24 * 60 * 60,
    autoRemove: 'native'
  }),
  secret: process.env.expressSecret,
  httpOnly: true,
  secure: true,
  resave: false,
  saveUninitialized: false,
});

app.use(sessionMiddleware);

app.locals.domain = 'rps.amannn.tk';

app.use(passport.session());
app.use(passport.initialize());

const wrap = (middleware) => (socket, next) =>
  middleware(socket.request, {}, next);

io.use(wrap(sessionMiddleware));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

io.use((socket, next) => {
  if (socket.request.user) {
    next();
  } else {
    next(new Error("unauthorized"));
  }
});

app.use(flash());
app.use(toastr());

app.use('/', routes);

io.sockets.on('connection', (socket) => {
  game.initGame(io, socket);
  //console.log(`${socket.id} w`)
  //io.emit('news', 'lol')
})                                    