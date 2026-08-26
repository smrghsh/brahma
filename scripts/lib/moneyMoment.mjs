// The money moment, as reusable Playwright assertions: two users join a
// brahma app, each sees the other's avatar, and a disconnect purges cleanly.
// Works against any URL — dev server, built bundle, or packed-tarball build.
import { chromium } from "playwright";

export function launchBrowser() {
  // Software WebGL so this runs headless and in CI
  return chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl"],
  });
}

export async function openUser(browser, appUrl, label, cameraGroupOffset) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error")
      console.log(`[${label}] console.error:`, msg.text());
  });
  page.on("pageerror", (err) =>
    console.log(`[${label}] pageerror:`, err.message),
  );
  await page.goto(appUrl);
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
    { timeout: 10000 },
  );
  const identity = await page.evaluate(() => ({
    name: window.experience.user.parameters.userName,
    color: window.experience.user.parameters.color,
  }));
  console.log(`[${label}] joined as`, identity.name, identity.color);
  return { context, page, label, identity };
}

async function seenBy(user) {
  await user.page.waitForFunction(
    () =>
      Object.keys(window.experience.networking.interlocutors.bodies).length ===
      1,
    null,
    { timeout: 10000 },
  );
  return user.page.evaluate(() =>
    Object.keys(window.experience.networking.interlocutors.bodies),
  );
}

/**
 * Two users join appUrl; assert mutual avatar visibility, then that a
 * disconnect purges the avatar. Throws on failure.
 *
 * @param {object} [options]
 * @param {{alice?: string, bob?: string}} [options.screenshots] - png paths
 */
export async function runMoneyMoment(browser, appUrl, options = {}) {
  const alice = await openUser(browser, appUrl, "alice", null);
  const bob = await openUser(browser, appUrl, "bob", [1.5, 0, -1]);

  const aliceSees = await seenBy(alice);
  const bobSees = await seenBy(bob);
  console.log("[alice] sees avatars of:", aliceSees);
  console.log("[bob]   sees avatars of:", bobSees);

  if (
    aliceSees[0] !== bob.identity.name ||
    bobSees[0] !== alice.identity.name
  ) {
    throw new Error("MISMATCH — avatars do not correspond to the other user");
  }

  if (options.screenshots) {
    if (options.screenshots.alice)
      await alice.page.screenshot({ path: options.screenshots.alice });
    if (options.screenshots.bob)
      await bob.page.screenshot({ path: options.screenshots.bob });
  }

  // disconnect bob; alice must see the purge
  await bob.context.close();
  await alice.page.waitForFunction(
    () =>
      Object.keys(window.experience.networking.interlocutors.bodies).length ===
      0,
    null,
    { timeout: 10000 },
  );
  console.log("[alice] saw bob purged after disconnect ✔");

  await alice.context.close();
  console.log(`MONEY MOMENT VERIFIED ✔  (${appUrl})`);
}

/**
 * data-vis-csv only: alice selects a data point; assert bob receives the
 * callout over the relay (World.onCalloutUpdate populated remoteCallouts).
 */
export async function runCalloutCheck(browser, appUrl) {
  const alice = await openUser(browser, appUrl, "alice", null);
  const bob = await openUser(browser, appUrl, "bob", [1.5, 0, -1]);
  await seenBy(alice);
  await seenBy(bob);

  // wait until the CSV has been parsed into tracks on alice's side
  await alice.page.waitForFunction(
    () => window.experience.world.tracks.length > 0,
    null,
    { timeout: 10000 },
  );
  await alice.page.evaluate(() => window.experience.world.showCalloutAt(0, 2));

  const remote = await bob.page.waitForFunction(
    () => {
      const callouts = Object.values(
        window.experience.world.remoteCallouts ?? {},
      );
      return callouts.length === 1 && callouts[0].data?.payload?.track === 0
        ? callouts[0].data
        : null;
    },
    null,
    { timeout: 10000 },
  );
  const data = await remote.jsonValue();
  console.log(
    `[bob] received callout from ${data.name}: track ${data.payload.track}, ` +
      `point ${data.payload.index}, ${data.payload.temp} °C`,
  );

  await alice.context.close();
  await bob.context.close();
  console.log(`CALLOUT RELAY VERIFIED ✔  (${appUrl})`);
}
