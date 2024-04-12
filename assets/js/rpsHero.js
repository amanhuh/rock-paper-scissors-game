const textArray = ['ROCK', 'PAPER', 'SCISSOR'];
const imgArray = ['rockImg', 'paperImg', 'scissorImg'];
const typingDelay = 70;
const erasingDelay = 30;
const newTextDelay = 2900;
let textArrayIndex = 0;
let charIndex = 4;
const typedTextSpan = document.getElementById("rpsText");

function type() {
  if (charIndex < textArray[textArrayIndex].length) {
    typedTextSpan.innerHTML += textArray[textArrayIndex].charAt(charIndex);
    charIndex++;
    setTimeout(type, typingDelay);
  }
  else {
    setTimeout(erase, newTextDelay);
  }
}

function erase() {
  if (charIndex > 0) {
    typedTextSpan.innerHTML = textArray[textArrayIndex].substring(0, charIndex - 1);
    charIndex--;
    setTimeout(erase, erasingDelay);
  }
  else {
    textArrayIndex++;
    if (textArrayIndex >= textArray.length) textArrayIndex = 0;
    setTimeout(type, typingDelay);
  }
  var e;
  if (textArrayIndex == 0) {
    e = document.getElementById(imgArray[2]);
    e.classList.remove('!opacity-100')
  } else {
    e = document.getElementById(imgArray[textArrayIndex - 1]);
    e.classList.remove('!opacity-100')
  }
  e = document.getElementById(imgArray[textArrayIndex]);
  e.classList.add('!opacity-100')
}

setTimeout(erase, newTextDelay);