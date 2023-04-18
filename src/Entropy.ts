import assert from "assert";

import { aleaPRNG as alea } from "./lib/aleaPRNG-1.1.js";

export type EntropyGenerator = ((...args: any[]) => number) & {
  readonly ___unique: unique symbol;
};

export default async function createEntropy(seedTimestamp: number) {
  //Fetch generator info
  const {
    genesis_time: genesisTime,
    period,
    hash,
  } = await (await fetch("https://drand.cloudflare.com/info")).json();
  assert(
    hash === "8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce",
    "DRAND hash has changed"
  );

  //Calculate first round to fetch
  const r = Math.floor((seedTimestamp - genesisTime) / period);

  //Fetch 3 rounds worth of rng
  const collectRng = async (round: number) =>
    (await (await fetch("https://drand.cloudflare.com/public/" + round)).json())
      .randomness as number;

  const seedData = await Promise.all([
    collectRng(r),
    collectRng(r + 1),
    collectRng(r + 2),
  ]);

  //Return the generator
  const prng = alea(...seedData);
  return (() => prng()) as EntropyGenerator;
}
