export function rad(degree: number) {
  return (Math.PI * degree) / 180;
}

function getRegexValue(regex: RegExp, str: string) {
  const result = regex.exec(str);
  return result ? result[1] : '';
}

export function parseName(nameStr: string) {
  const weightRegex = /\/(\d+)/;
  const countRegex = /\*(\d+)/;
  const hasWeight = weightRegex.test(nameStr);
  const hasCount = countRegex.test(nameStr);
  const name = getRegexValue(/^\s*([^\/*]+)?/, nameStr);
  if (!name) return null;
  const weight = hasWeight ? parseInt(getRegexValue(weightRegex, nameStr)) : 1;
  const count = hasCount ? parseInt(getRegexValue(countRegex, nameStr)) : 1;
  return {
    name,
    weight,
    count,
  };
}

export function pad(v: number) {
  return v.toString().padStart(2, '0');
}

// 시드 기반 랜덤 생성기 (Mulberry32)
export function createSeededRandom(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 전역 시드 저장
let globalSeed: number = Date.now();
let seededRandom: () => number = createSeededRandom(globalSeed);

export function setSeed(seed: number) {
  globalSeed = seed;
  seededRandom = createSeededRandom(seed);
}

export function getSeed() {
  return globalSeed;
}

export function shuffle<T>(originalArray: T[], seed?: number): T[] {
  const array = originalArray.slice();
  let currentIndex = array.length;
  let randomIndex;

  // 시드가 제공되면 해당 시드로 랜덤 생성기 생성
  const random = seed !== undefined ? createSeededRandom(seed) : seededRandom;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}