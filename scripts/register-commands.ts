// Registers the global /chog command. Needs CHOGSTICKS_Application_ID and CHOGSTICKS_Bot_Token.
import { CHOG_COMMAND } from "../lib/discord";

async function main() {
  const app = process.env.CHOGSTICKS_Application_ID;
  const token = process.env.CHOGSTICKS_Bot_Token;
  if (!app || !token) throw new Error("Set CHOGSTICKS_Application_ID and CHOGSTICKS_Bot_Token");
  const res = await fetch(`https://discord.com/api/v10/applications/${app}/commands`, {
    method: "PUT",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([CHOG_COMMAND]),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json)}`);
  console.log("registered", json.map((c: { name: string; id: string }) => `${c.name} ${c.id}`));
}

main();
