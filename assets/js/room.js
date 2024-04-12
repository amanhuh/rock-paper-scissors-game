const socket = io({ withCredentials: true });
const mainBody = document.getElementById('playGround');

socket.on('roomConnect', function(data) {
  mainBody.innerHTML = `<div class="flex items-center place-content-center justify-center relative h-full">
        <div class="inline-block my-auto mx-auto">
          <button class="bg-sky-600/75 backdrop-blur-lg border-2 border-yellow-400 font-medium font-default text-gray-200 py-1.5 md:py-2 px-2 md:px-4 mb-2 md:mb-4 text-sm md:text-lg rounded-md drop-shadow-lg" onclick="copyId('https://rps.amannn.tk/room?id=${data.room.id}')" data-tooltip-target="copyTip" data-tooltip-trigger="click">https://rps.amannn.tk/room?id=${data.room.id}</button>
          <div id="copyTip" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip">Copied!</div>
          <p class="font-default font-medium md:text-lg text-white text-center">Send this link to your opponent!</p>
        </div>
      </div>`
})

socket.on('playerJoined', function(data) {
  const yourLevel = Math.floor(0.1 * Math.sqrt(data.player.xp));
  const oppLevel = Math.floor(0.1 * Math.sqrt(data.oppPlayer.xp));
  mainBody.innerHTML = `<p class="absolute top-1/2 left-1/2 font-default font-bold text-gray-200 -mt-8 text-sm md:text-base text-center" style="transform: translate(-50%, -50%);" id="roundInfo">
    <span id="roundNumber" class="text-yellow-300">Round 1</span>
    <br>
    <span id="timerText" class="font-medium">15</span>
  </p>
  <div class="block grid md:grid-cols-2 gap-x-4">
        <div class="flex">
          <div class="inline-block mr-3">
            <img src="${data.player.avatarUrl}" class="w-12 md:w-14 lg:w-16 h-12 md:h-14 lg:h-16 rounded-md border-2 border-yellow-300" />
          </div>
          <div class="inline-block -mt-1 cursor-pointer" data-popover-target="userProfile">
            <p class="font-default text-gray-100 font-medium text-lg md:text-xl lg:text-2xl drop-shadow-lg">${data.player.username}</p>
              <span class="rounded-full bg-yellow-400 text-gray-100 font-default py-0.5 md:py-1 px-2 md:px-3 mt-2 text-xs font-medium">Level ${yourLevel}</span>
          </div>
          <div class="flex ml-auto md:ml-4 lg:ml-6 gap-1.5 md:gap-3" id="roundsHost">
          </div>
        </div>
        <div class="hidden md:flex ml-auto">   
          <div class="flex mr-4 md:ml-4 lg:ml-6 gap-1.5 md:gap-3" id="roundsOpponent">
          </div>
          <div class="inline-block -mt-1">
            <p class="font-default text-gray-100 font-medium text-lg md:text-xl lg:text-2xl">${data.oppPlayer.username}</p>  
              <span class="rounded-full bg-yellow-400 text-gray-100 font-default py-0.5 md:py-1 px-2 md:px-3 mt-2 text-xs font-medium">Level ${oppLevel}</span>
          </div>
          <div class="inline-block ml-3">
            <img src="${data.oppPlayer.avatarUrl}" class="w-12 md:w-14 lg:w-16 h-12 md:h-14 lg:h-16 rounded-md border-2 border-yellow-300" />
          </div>
        </div>
      </div>
      <div class="grid auto-cols-auto md:grid-cols-2 gap-x-4">
        <div class="mt-8 ml-4 md:ml-6 lg:ml-20 max-h-[120px] md:max-h-[200px] mr-auto">
          <img src="/assets/images/choosing.png" class="opacity-[0.15] h-full choosing drop-shadow-lg" id="chooseRps" />
        </div>
        <div class="mt-20 md:mt-8 mr-4 md:mr-6 lg:mr-20 ml-auto max-h-[120px] md:max-h-[200px]">
          <img src="/assets/images/choosing.png" class="opacity-[0.15] h-full choosing drop-shadow-lg -scale-x-100" id="chooseRpsO" />
        </div>
      </div>
      <div class="flex mt-6 md:hidden">
        <div class="flex md:ml-4 lg:ml-6 gap-1.5 md:gap-3" id="roundsOpponentMob">
        </div>
        <div class="inline-block -mt-1 ml-auto">
            <p class="font-default text-gray-100 font-medium text-lg md:text-2xl">${data.oppPlayer.username}</p>
              <span class="rounded-full bg-yellow-400 text-gray-100 font-default py-0.5 md:py-1 px-2 md:px-3 mt-2 text-xs font-medium">Level ${oppLevel}</span>
          </div>
          <div class="inline-block ml-3">
            <img src="${data.oppPlayer.avatarUrl}" class="w-12 md:w-16 h-12 md:h-16 rounded-md border-2 border-yellow-300" />
          </div>
        </div>
      <div class="flex right-0 left-0 absolute bottom-3 md:bottom-4" id="rpsButtons">
        <button class="bg-sky-500 rounded-md md:rounded-xl p-4 ml-auto focus:ring-4 ring-offset-4 ring-offset-sky-700 focus:ring-yellow-400 shadow-lg" onclick="changeRps(this, 'rock')">
          <img src="/assets/images/rock.png" class="w-14 md:w-20 h-14 md:h-20" />
        </button>
        <button class="bg-sky-500 rounded-md md:rounded-xl p-4 mx-4 md:mx-8 focus:ring-4 ring-offset-4 ring-offset-sky-700 focus:ring-yellow-400 shadow-lg" onclick="changeRps(this, 'paper')">
          <img src="/assets/images/paper.png" class="w-14 md:w-20 h-14 md:h-20" />
        </button>
        <button class="bg-sky-500 rounded-md md:rounded-xl p-4 mr-auto focus:ring-4 ring-offset-4 ring-offset-sky-700 focus:ring-yellow-400 shadow-lg shadow-sky-800" onclick="changeRps(this, 'scissor')">
          <img src="/assets/images/scissor.png" class="w-14 md:w-20 h-12 md:h-20" />
        </button>
      </div>`
  const timerScript = document.createElement('script');
  timerScript.setAttribute("id", "timerScript");
  timerScript.innerHTML = `let timer = 15;
        setInterval(() => {
          if (timer <= 0) {
            const btnGrp = document.getElementById('rpsButtons');
            btnGrp.innerHTML = \`<button class="bg-sky-500 rounded-md md:rounded-xl p-4 ml-auto focus:ring-4 ring-offset-4 ring-offset-sky-700 focus:ring-yellow-400 shadow-lg cursor-not-allowed opacity-75" disabled>
          <img src="/assets/images/rock.png" class="w-14 md:w-20 h-14 md:h-20" />
        </button>
        <button class="bg-sky-500 rounded-md md:rounded-xl p-4 mx-4 md:mx-8 focus:ring-4 ring-offset-4 ring-offset-sky-700 focus:ring-yellow-400 shadow-lg cursor-not-allowed opacity-75"" disabled>
          <img src="/assets/images/paper.png" class="w-14 md:w-20 h-14 md:h-20" />
        </button>
        <button class="bg-sky-500 rounded-md md:rounded-xl p-4 mr-auto focus:ring-4 ring-offset-4 ring-offset-sky-700 focus:ring-yellow-400 shadow-lg shadow-sky-800 cursor-not-allowed opacity-75"" disabled>
          <img src="/assets/images/scissor.png" class="w-14 md:w-20 h-12 md:h-20" />
        </button>\`
          } else {
            timer = --timer;
            document.getElementById('timerText').innerHTML = timer;
          }
        }, 1000)`
  document.body.appendChild(timerScript);
})

socket.on('newRoundStart', function(data) {
  const uChoose = document.getElementById('chooseRps');
  const oChoose = document.getElementById('chooseRpsO');
  if (uChoose.classList.contains('chosen')) {
    uChoose.classList.remove('chosen')
  }
  if (!uChoose.classList.contains('choosing')) {
    uChoose.classList.add('choosing', 'opacity-[0.15]')
  }
  if (oChoose.classList.contains('chosen')) {
    oChoose.classList.remove('chosen')
  }
  if (!oChoose.classList.contains('choosing')) {
    oChoose.classList.add('choosing', 'opacity-[0.15]')
  }
  timer = 15;
  document.getElementById('roundNumber').innerHTML = `Round ${data.room.currentRound}`
  const btnGrp = document.getElementById('rpsButtons');
  uChoose.src = '/assets/images/choosing.png'
  oChoose.src = '/assets/images/choosing.png'
  btnGrp.innerHTML = `<button class="bg-sky-500 rounded-md md:rounded-xl p-4 ml-auto focus:ring-4 ring-offset-4 ring-offset-sky-700 focus:ring-yellow-400 shadow-lg" onclick="changeRps(this, 'rock')">
          <img src="/assets/images/rock.png" class="w-14 md:w-20 h-14 md:h-20" />
        </button>
        <button class="bg-sky-500 rounded-md md:rounded-xl p-4 mx-4 md:mx-8 focus:ring-4 ring-offset-4 ring-offset-sky-700 focus:ring-yellow-400 shadow-lg" onclick="changeRps(this, 'paper')">
          <img src="/assets/images/paper.png" class="w-14 md:w-20 h-14 md:h-20" />
        </button>
        <button class="bg-sky-500 rounded-md md:rounded-xl p-4 mr-auto focus:ring-4 ring-offset-4 ring-offset-sky-700 focus:ring-yellow-400 shadow-lg shadow-sky-800" onclick="changeRps(this, 'scissor')">
          <img src="/assets/images/scissor.png" class="w-14 md:w-20 h-12 md:h-20" />
        </button>`
})

socket.on('roundEnded', function(data) {
  const roundsDivH = document.getElementById('roundsHost');
  const roundsDivO = document.getElementById('roundsOpponent');
  const roundsDivMobO = document.getElementById('roundsOpponentMob');
  document.getElementById('roundNumber').innerHTML = `Round ${data.room.currentRound}`
  document.getElementById('timerText').innerHTML = `${data.winner.username} Won!`
  const oChoose = document.getElementById('chooseRpsO');
  let roundInfoU = [];
  let roundInfoO = [];
  if (data.room.rounds[data.room.currentRound - 1].winner.id == data.user.id) {
    if (data.room.rounds[data.room.currentRound - 1].looserChoice) {
      oChoose.src = `/assets/images/${data.room.rounds[data.room.currentRound - 1].looserChoice}.png`
      setTimeout(() => {
        if (oChoose.classList.contains('choosing')) {
          oChoose.classList.remove('opacity-[0.15]', 'choosing')
        }
        if (!oChoose.classList.contains('chosen')) {
          oChoose.classList.add('chosen')
        }
      }, 200)
    }
  } else {
    oChoose.src = `/assets/images/${data.room.rounds[data.room.currentRound - 1].winnerChoice}.png`
    setTimeout(() => {
      if (oChoose.classList.contains('choosing')) {
        oChoose.classList.remove('opacity-[0.15]', 'choosing')
      }
      if (!oChoose.classList.contains('chosen')) {
        oChoose.classList.add('chosen')
      }
    }, 200)
  }
  for (let ii = 0; ii < data.room.rounds.length; ii++) {
    if (data.room.rounds[ii].winner.id == data.user.id) {
      roundInfoU.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-green-400 p-1 md:p-2"><img src="/assets/images/${data.room.rounds[ii].winnerChoice}.png" class="w-full" /></div>`)
      if (data.room.rounds[ii].looserChoice) {
        roundInfoO.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-red-400 p-1 md:p-2"><img src="/assets/images/${data.room.rounds[ii].looserChoice}.png" class="w-full" /></div>`)

      } else {
        roundInfoO.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-red-400 p-1 md:p-2"></div>`)
      }
    } else {
      roundInfoO.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-green-400 p-1 md:p-2"><img src="/assets/images/${data.room.rounds[ii].winnerChoice}.png" class="w-full" /></div>`)
      if (data.room.rounds[ii].looserChoice) {
        roundInfoU.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-red-400 p-1 md:p-2"><img src="/assets/images/${data.room.rounds[ii].looserChoice}.png" class="w-full" /></div>`)
      } else {
        roundInfoU.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-red-400 p-1 md:p-2"></div>`)
      }
    }
  }
  roundsDivH.innerHTML = `${roundInfoU.join('')}`
  roundsDivO.innerHTML = `${roundInfoO.join('')}`
  roundsDivMobO.innerHTML = `${roundInfoO.join('')}`
})

socket.on('playerDisconnected', function(data) {
  mainBody.innerHTML = `<div class="flex items-center place-content-center justify-center relative h-full">
      <div class="inline-block my-auto mx-auto">
        <p class="text-lg md:text-3xl font-bold font-default text-gray-100 text-center mb-3 md:mb-4">Opponent Disconnected</p>
        <button class="font-bold font-main text-gray-900 bg-yellow-300 px-2 md:px-4 py-1.5 md:py-2 text-sm md:text-lg rounded-md drop-shadow-md mx-auto w-full" onclick="window.location.href='/room/create'">New Game</button>
      </div>
    </div>`
})

socket.on('inactiveEnd', function(data) {
  mainBody.innerHTML = `<div class="flex items-center place-content-center justify-center relative h-full">
      <div class="inline-block my-auto mx-auto">
        <p class="text-lg md:text-3xl font-bold font-default text-gray-100 text-center mb-3 md:mb-4">Room Inactive</p>
        <button class="font-bold font-main text-gray-900 bg-yellow-300 px-2 md:px-4 py-1.5 md:py-2 text-sm md:text-lg rounded-md drop-shadow-md mx-auto w-full" onclick="window.location.href='/room/create'">New Game</button>
      </div>
    </div>`
})

socket.on('gameEnded', function(data) {
  const confettiScript = document.createElement('script');
  confettiScript.setAttribute("id", "confetti");
  confettiScript.innerHTML = `tsParticles.load("tsparticles", {
  "emitters": {
    "life": {
      "count": 1,
      "duration": 0.2,
    },
    position: {
      x: 50,
      y: 0
    },
    rate: {
      quantity: 400
    }
  },
  preset: "confetti",
});`
  document.body.appendChild(confettiScript)
  mainBody.innerHTML = `<div class="flex items-center place-content-center justify-center relative h-full">
      <div class="inline-block my-auto mx-auto">
        <img src="${data.winner.avatarUrl}" class="w-20 md:w-28 lg:w-36 h-20 md:h-28 lg:h-36 rounded-full border-2 border-yellow-300 mx-auto mb-3 md:mb-4" />
        <p class="text-xl md:text-5xl font-bold font-main text-yellow-300 text-center mb-0.5 md:mb-2 drop-shadow-lg">${data.winner.username}</p>
        <p class="text-sm md:text-base font-medium font-default text-gray-100 text-center mb-2 md:mb-3 drop-shadow-lg">Won The Game! <span class="font-bold ml-1">+${data.winXp} xp</span></p>
        <button class="text-sm font-bold font-main text-gray-900 bg-yellow-300 px-2 md:px-4 py-1.5 md:py-2 text-sm md:text-lg rounded-md drop-shadow-md mx-auto w-full" onclick="window.location.href='/room/create'">New Game</button>
      </div>
    </div>`
})

socket.on('gameTied', function(data) {
  const roundsDivH = document.getElementById('roundsHost');
  const roundsDivO = document.getElementById('roundsOpponent');
  const roundsDivMobO = document.getElementById('roundsOpponentMob');
  document.getElementById('roundNumber').innerHTML = `Round ${data.room.currentRound}`
  document.getElementById('timerText').innerHTML = `Tied!`
  const oChoose = document.getElementById('chooseRpsO');
  let roundInfoU = [];
  let roundInfoO = [];
  if (data.room.rounds[data.room.currentRound - 1].winner.id == data.user.id) {
    if (data.room.rounds[data.room.currentRound - 1].looserChoice) {
      oChoose.src = `/assets/images/${data.room.rounds[data.room.currentRound - 1].looserChoice}.png`
      setTimeout(() => {
        if (oChoose.classList.contains('choosing')) {
          oChoose.classList.remove('opacity-[0.15]', 'choosing')
        }
        if (!oChoose.classList.contains('chosen')) {
          oChoose.classList.add('chosen')
        }
      }, 200)
    }
  } else {
    oChoose.src = `/assets/images/${data.room.rounds[data.room.currentRound - 1].winnerChoice}.png`
    setTimeout(() => {
      if (oChoose.classList.contains('choosing')) {
        oChoose.classList.remove('opacity-[0.15]', 'choosing')
      }
      if (!oChoose.classList.contains('chosen')) {
        oChoose.classList.add('chosen')
      }
    }, 200)
  }
  for (let ii = 0; ii < data.room.rounds.length; ii++) {
    if (data.room.rounds[ii].winner.id == data.user.id) {
      roundInfoU.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-green-400 p-1 md:p-2"><img src="/assets/images/${data.room.rounds[ii].winnerChoice}.png" class="w-full" /></div>`)
      if (data.room.rounds[ii].looserChoice) {
        roundInfoO.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-red-400 p-1 md:p-2"><img src="/assets/images/${data.room.rounds[ii].looserChoice}.png" class="w-full" /></div>`)

      } else {
        roundInfoO.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-red-400 p-1 md:p-2"></div>`)
      }
    } else {
      roundInfoO.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-green-400 p-1 md:p-2"><img src="/assets/images/${data.room.rounds[ii].winnerChoice}.png" class="w-full" /></div>`)
      if (data.room.rounds[ii].looserChoice) {
        roundInfoU.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-red-400 p-1 md:p-2"><img src="/assets/images/${data.room.rounds[ii].looserChoice}.png" class="w-full" /></div>`)
      } else {
        roundInfoU.push(`<div class="w-10 md:w-12 lg:w-14 h-10 md:h-12 lg:h-14 rounded-full bg-red-400 p-1 md:p-2"></div>`)
      }
    }
  }
  roundsDivH.innerHTML = `${roundInfoU.join('')}`
  roundsDivO.innerHTML = `${roundInfoO.join('')}`
  roundsDivMobO.innerHTML = `${roundInfoO.join('')}`
})

async function copyId(link) {
  try {
    await navigator.clipboard.writeText(link);
  } catch (e) {
    console.log(e)
  }
}