import {
  Action,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createPostResponse,
} from "@solana/actions";
import { Hono } from "hono";
import { getLamports, getRandomInt, startTimer } from "../helpers";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { connection, houseKey, takeOffs } from "../const";
const app = new Hono();

interface DialectExperimentalFeatures {
  dialectExperimental?: {
    liveData?: {
      enabled: boolean;
      delayMs?: number; // default 1000 (1s)
    };
  };
}

const startAnimation =
  "https://i.pinimg.com/originals/74/5f/d3/745fd3d279f7c5f27dc4e12fd583e68f.gif";

app.get("/", async (c) => {
  const response: ActionGetResponse = {
    type: "action",
    description: "Bet and earn some money",
    icon: startAnimation,
    label: "Bet and earn 💰",
    title: "Bet and earn some money",
    links: {
      actions: [
        {
          type: "transaction",
          label: "Bet 0.1 SOL",
          href: "/aviator/bet/0.1",
        },
      ],
    },
    disabled: false,
  };
  return c.json(response, 200);
});

app.post("/bet/:amount", async (c) => {
  const amount = parseFloat(c.req.param("amount"));
  const { account }: ActionPostRequest = await c.req.json();
  if (isNaN(amount)) {
    return c.json(
      {
        type: "error",
        title: "Invalid amount",
        description: "The amount must be a number",
      },
      400
    );
  }
  const tx = new Transaction();
  tx.feePayer = new PublicKey(account);
  tx.lastValidBlockHeight = (
    await connection.getLatestBlockhash()
  ).lastValidBlockHeight;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.add(
    SystemProgram.transfer({
      fromPubkey: new PublicKey(account),
      toPubkey: houseKey,
      lamports: getLamports(amount),
    })
  );

  console.log("Stored bet amount in a escrow (hehe) account");
  const payload = await createPostResponse({
    fields: {
      transaction: tx,
      type: "transaction",
      message: "Stored bet amount in a escrow account",
      links: {
        next: {
          action: {
            type: "action",
            title: "You have placed 0.1 SOL bet",
            label: "Start now 🚀",
            icon: startAnimation,
            description:
              "Withdraw your bet before the rocket crashes crashes, to earn up to 2x amount of the bet.",
            links: {
              actions: [
                {
                  type: "post",
                  label: "Start now 🚀",
                  href: "/aviator/start",
                },
                {
                  type: "transaction",
                  label: "Nah, I give up",
                  href: `/aviator/withdraw/${0}/${0}`,
                },
              ],
            },
          },
          type: "inline",
        },
      },
    },
  });
  return c.json(payload, 200);
});

app.post("/start", async (c) => {
  return c.json(
    {
      type: "post",
      links: {
        next: {
          type: "post",
          href: `/aviator/start/${getRandomInt(0, 100)}`,
        },
      },
    } satisfies ActionPostResponse,
    200
  );
});

app.post("/start/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const { url, crashTime } = takeOffs[getRandomInt(0, takeOffs.length)];
  const timme = startTimer();
  console.log("Started the timer", timme);
  const payload: Action = {
    type: "action",
    title: "Withdraw the bet before the plane crashes",
    label: "Withdraw",
    icon: url,
    description:
      "Withdraw your bet before the plane crashes to earn up to 2x amount of the bet",
    links: {
      actions: [
        {
          type: "transaction",
          label: "I'm out",
          href: `/aviator/withdraw/${timme}/${crashTime}`,
        },
      ],
    },
  };
  return c.json(payload, 200);
});

app.post("/withdraw/:stop/:crashTime", async (c) => {
  const { account }: ActionPostRequest = await c.req.json();
  const crashTime = parseFloat(c.req.param("crashTime"));
  const stop = parseInt(c.req.param("stop"));
  let signature: string = "";
  console.log("Crash time", crashTime);
  console.log("Stop time", stop);
  const timeSpent = (new Date().getTime() - stop) / 1000;
  console.log("Time spent seconds : ", timeSpent);
  const signer = Keypair.fromSecretKey(
    bs58.decode(
      ""
    )
  );
  if (Number(stop) == 0) {
    //Transfer all the funds back to the player
    console.log("exit");
    const tx = new Transaction();
    tx.feePayer = houseKey;
    tx.add(
      SystemProgram.transfer({
        fromPubkey: houseKey,
        toPubkey: new PublicKey(account),
        lamports: getLamports(0.1),
      })
    );
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.lastValidBlockHeight = (
      await connection.getLatestBlockhash()
    ).lastValidBlockHeight;
    tx.sign(signer);
    signature = await connection.sendTransaction(tx, [signer]);
    console.log("Transfered funds from house to player", signature);
  } else {
    //The player has played the game atleast once
    const benifit = timeSpent / 10; //aplified the benifit;
    //TODO: Benifit function should be a curve
    const amount = benifit * 0.1;
    console.log("Benifit", benifit);
    if (crashTime > timeSpent) {
      //Won the game
      const tx = new Transaction();
      tx.feePayer = houseKey;
      tx.add(
        SystemProgram.transfer({
          fromPubkey: houseKey,
          toPubkey: new PublicKey(account),
          lamports: getLamports(amount),
        })
      );
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.lastValidBlockHeight = (
        await connection.getLatestBlockhash()
      ).lastValidBlockHeight;
      console.log(process.env.HOUSE_PRIVATE_KEY);
      tx.sign(signer);
      signature = await connection.sendTransaction(tx, [signer]);
      console.log("Transfered funds from house to player", signature);
    } else {
      //Lost the game
      console.log("Lost the game");
    }
  }
  return c.json(
    {
      type: "post",
      links: {
        next: {
          type: "post",
          href: `/aviator/complete/${signature}`,
        },
      },
    } satisfies ActionPostResponse,
    200
  );
});

app.post("/complete/:sign", async (c) => {
  const sign = c.req.param("sign");
  return c.json({
    type: "action",
    title: sign != "" ? "You have won the game" : "You have lost the game",
    label: "LFG 🚀",
    icon: startAnimation,
    description:
      sign != ""
        ? "You won!\n Let's go again!"
        : "You lost! \n Let's try again!",
    links: {
      actions: [
        {
          type: "transaction",
          label: "Bet 0.1 SOL",
          href: "/aviator/bet/0.1",
        },
      ],
    },
  });
});

export default app;
