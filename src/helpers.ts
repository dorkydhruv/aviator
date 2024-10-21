export function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

let time: number = 0;

export function startTimer() {
  time = new Date().getTime();
}

export function stopTimer() {
  return new Date().getTime() - time;
}

