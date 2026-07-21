import { chromium } from "playwright";

const APP = "http://localhost:5173";

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
});

async function openUser(label, cameraGroupOffset) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error")
      console.log(`[${label}] console.error:`, msg.text());
  });
  page.on("pageerror", (err) =>
    console.log(`[${label}] pageerror:`, err.message),
  );
  await page.goto(APP);
  await page.waitForSelector("#join", { state: "visible" });
  // wait for the experience to exist
  await page.waitForFunction(() => window.experience?.renderer?.instance);
  if (cameraGroupOffset) {
    await page.evaluate(([x, y, z]) => {
      window.experience.cameraGroup.position.set(x, y, z);
    }, cameraGroupOffset);
  }
  await page.click("#join");
  await page.waitForFunction(
    () => window.experience.networking?.connected,
    null,
    {
      timeout: 5000,
    },
  );
  const identity = await page.evaluate(() => ({
    name: window.experience.user.parameters.userName,
    color: window.experience.user.parameters.color,
  }));
  console.log(`[${label}] joined as`, identity.name, identity.color);
  return { context, page, label, identity };
}

const alice = await openUser("alice", null);
const bob = await openUser("bob", [1.5, 0, -1]);

// each page should now see exactly one interlocutor: the other user
async function seenBy(user) {
  await user.page.waitForFunction(
    () =>
      Object.keys(window.experience.networking.interlocutors.bodies).length ===
      1,
    null,
    { timeout: 5000 },
  );
  return user.page.evaluate(() =>
    Object.keys(window.experience.networking.interlocutors.bodies),
  );
}

const aliceSees = await seenBy(alice);
const bobSees = await seenBy(bob);
console.log("[alice] sees avatars of:", aliceSees);
console.log("[bob]   sees avatars of:", bobSees);

if (aliceSees[0] !== bob.identity.name || bobSees[0] !== alice.identity.name) {
  console.log("MISMATCH — avatars do not correspond to the other user");
  process.exit(1);
}

await alice.page.screenshot({ path: "/tmp/brahma-alice.png" });
await bob.page.screenshot({ path: "/tmp/brahma-bob.png" });

// disconnect bob; alice must see the purge
await bob.context.close();
await alice.page.waitForFunction(
  () =>
    Object.keys(window.experience.networking.interlocutors.bodies).length === 0,
  null,
  { timeout: 5000 },
);
console.log("[alice] saw bob purged after disconnect ✔");

await browser.close();
console.log("MONEY MOMENT VERIFIED ✔");
