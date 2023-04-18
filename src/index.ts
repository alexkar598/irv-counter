import fs from "fs";
import createEntropy from "./Entropy.js";
import IRV from "./IRV.js";
import parseCsv from "./Parser.js";

const inputFile = process.argv[2];
const rngTimestamp = parseInt(process.argv[3]);

const parsed = await parseCsv(
  fs.createReadStream(inputFile),
  await createEntropy(rngTimestamp)
);
const irv = new IRV(parsed.ballots, parsed.candidates);
console.log(
  irv
    .runElections(5)
    .map((x) => x.name)
    .join(", ")
);
