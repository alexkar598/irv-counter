import assert from "assert";
import Candidate from "./Candidate.js";
import { Ballot } from "./Parser.js";

export default class IRV {
  private electedCandidates = new Array<Candidate>();

  constructor(
    public readonly ballots: Ballot[],
    public readonly candidates: Candidate[]
  ) {}

  public runElections(seats: number) {
    console.log("Sorted candidates: " + this.candidates.map(x => x.name).join(", "))
    console.log()

    for (let seat = 0; seat < seats; seat++) {
      console.log("Running elections for seat " + (seat + 1))
      const winner = this.runSeat();
      console.log("Seat winner: " + winner.name)
      this.electedCandidates.push(winner);
      console.log()
    }

    console.log()
    console.log()

    return this.electedCandidates;
  }

  private runSeat() {
    const eliminatedCandidates = [...this.electedCandidates];

    while (this.candidates.length - eliminatedCandidates.length > 1) {
      this.runRound(eliminatedCandidates);
    }

    const toReturn = this.candidates.filter(
      (x) => !eliminatedCandidates.includes(x)
    );
    assert(toReturn.length === 1);
    return toReturn[0];
  }

  private runRound(eliminatedCandidates: Candidate[]) {
    const effectiveVotes = this.ballots
      .map((ballot) =>
        ballot.find((vote) => !eliminatedCandidates.includes(vote))
      )
      .filter<Candidate>(
        (x): x is Exclude<typeof x, undefined> => x !== undefined
      );

    const tally = new Map(
      this.candidates
        .map((candidate) => [candidate, 0] satisfies [Candidate, number])
        .filter(([candidate]) => !eliminatedCandidates.includes(candidate))
    );
    for (const vote of effectiveVotes) tally.set(vote, tally.get(vote)! + 1);

    const minimum = Math.min(...tally.values());
    const minimumCandidates = [...tally.entries()].filter(
      ([k, v]) => v === minimum
    );

    {
      if (minimumCandidates.length === 1) {
        const candidateToEliminate = minimumCandidates[0][0];
        console.log(`(IRV) ${candidateToEliminate.name} eliminated for having only ${minimum} votes`);
        eliminatedCandidates.push(candidateToEliminate);
        return;
      }
    }

    {
      const minimumSum = minimumCandidates
        .map(([_, votes]) => votes)
        .reduce((a, b) => a + b, 0);
      const nextMinimum = Math.min(
        Infinity,
        ...[...tally.values()].filter((x) => x != minimum)
      );

      if (minimumSum < nextMinimum) {
        eliminatedCandidates.push(
          ...minimumCandidates.map(([candidate]) => candidate)
        );
        console.log(
          `(LOGIC) ${eliminatedCandidates
            .map((x) => x.name)
            .join(", ")} eliminated for having together too few votes ${minimumSum} < ${nextMinimum}`
        );
        return null;
      }
    }

    minimumCandidates.sort(([a], [b]) => a.randomBias - b.randomBias);
    const candidateToEliminate = minimumCandidates[0][0];
    console.log(`(RNG) TIE: ${minimumCandidates.map(([x]) => x.name).join(", ")} | ${candidateToEliminate.name} eliminated`);
    eliminatedCandidates.push(candidateToEliminate);
    return null;
  }
}
