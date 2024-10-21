import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { connection, houseKey } from "./const";
import { Buffer } from "buffer";
import dotenv from "dotenv";

dotenv.config();
export function getRandomInt(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

export function startTimer() {
  return new Date().getTime();
}

export function getLamports(amount: number) {
  return Math.floor(amount * 1000000000);
}
