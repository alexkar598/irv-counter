import csv from "csv-parser";
import fs from "fs";
import { once } from "events";
import Candidate from "./Candidate.js";
import { EntropyGenerator } from "./Entropy.js";
import ReadableStream = NodeJS.ReadableStream;

export interface ParserResults {
  candidates: Candidate[];
  ballots: any[];
}

type RawBallot = Record<string, number>;
type OrderedBallot = Array<string>;
export type Ballot = Array<Candidate>;

const csvParser = csv({
  mapHeaders(info) {
    const matcher = /.*? \[(\w+)]/;
    const match = matcher.exec(info.header);
    if (!match) return null;

    return match[1];
  },
  mapValues({ value }) {
    return parseInt(value);
  },
  strict: true,
  skipComments: true,
});

export default async function parseCsv(
  stream: ReadableStream,
  entropyGenerator: EntropyGenerator
): Promise<ParserResults> {
  const candidates = new Array<Candidate>();
  const ballots = new Array<RawBallot>();

  stream = stream
    .pipe(csvParser)
    .on("error", (err) => {
      throw err;
    })
    .on("data", (data) => ballots.push(data))
    //Load and shuffle candidate list
    .on("headers", (headers) => {
      for (const candidateName of headers) {
        if (candidateName === null) continue;

        let candidate: Candidate;
        do {
          candidate = new Candidate(candidateName, entropyGenerator);
        } while (candidates.find((x) => x.randomBias === candidate.randomBias));
        candidates.push(candidate);
      }

      candidates.sort((a, b) => a.randomBias - b.randomBias);
    });

  await once(stream, "end");

  const orderedBallots = ballots.map(orderBallot);
  const canonBallots = orderedBallots.map(cannonilizeBallot(candidates));

  return {
    ballots: canonBallots,
    candidates: candidates,
  };
}

function orderBallot(ballot: RawBallot): OrderedBallot {
  const result: OrderedBallot = [];
  for (const [candidate, vote] of Object.entries(ballot)) {
    result[vote - 1] = candidate;
  }
  return result;
}

function cannonilizeBallot(candidates: Candidate[]) {
  return (ballot: OrderedBallot | Ballot) => {
    for (let i = 0; i < ballot.length; i++) {
      ballot[i] = candidates.find((x) => x.name === ballot[i])!;
    }
    return ballot as Ballot;
  };
}
