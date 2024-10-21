import {
  Action,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createPostResponse,
} from "@solana/actions";
import { Hono } from "hono";
import { getRandomInt, startTimer } from "../helpers";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { takeOffs } from "../const";
import { startTime } from "hono/timing";
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
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
        {
          type: "post",
          label: "Debug",
          href: "/aviator/start",
        },
      ],
    },

    disabled: false,
  };
  return c.json(response, 200);
});

// app.get("/bet/:amount", async (c) => {
//   const amount = parseFloat(c.req.param("amount"));
//   if (isNaN(amount)) {
//     return c.json(
//       {
//         type: "error",
//         title: "Invalid amount",
//         description: "The amount must be a number",
//       },
//       400
//     );
//   }
//   const response: ActionGetResponse = {
//     type: "action",
//     description: `You bet ${amount}, withdraw before the plane crashes`,
//     title: "Lets see if you can win",
//     icon: "https://media3.giphy.com/media/UPYDbO9tMrEmpoLGfp/giphy.gif?cid=6c09b952cjsi2vug378babqu6j9og8qxkh7ck1adbr9dki8c&ep=v1_internal_gif_by_id&rid=giphy.gif&ct=g",
//     label: "Take the risk",
//     links: {
//       actions: [
//         {
//           type: "post",
//           label: "Withdraw",
//           href: "/aviator/withdraw",
//         },
//       ],
//     },
//   };
//   return c.json(response, 200);
// });

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
      toPubkey: new PublicKey("8fagLF8Z3Z1tCgNVwZmJ5UESzHTAXLgKZaxb62bZsbQP"),
      lamports: Math.floor(amount * 1000000000),
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
                  href: "/aviator/withdraw",
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
  startTimer();
  console.log("Started the timer");
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
          href: "/aviator/withdraw",
        },
      ],
    },
  };
  return c.json(payload, 200);
});

app.post("/withdraw/:stop",async(c)=>{
  const stop = parseInt(c.req.param("stop"));
  if(stop==0){

  }
})

export default app;

