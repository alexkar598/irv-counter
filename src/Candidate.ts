import * as util from "util";
import { EntropyGenerator } from "./Entropy.js";

export default class Candidate {
  public readonly randomBias: number;

  constructor(public readonly name: string, generateRng: EntropyGenerator) {
    this.name = name;
    this.randomBias = generateRng();
  }
}
