const { chromium } = require("playwright");

const SKILLS_URL = process.env.LINKEDIN_SKILLS_URL;

if (!SKILLS_URL) {
  throw new Error(
    'Set LINKEDIN_SKILLS_URL to your LinkedIn skills page URL.'
  );
}

(async () => {
  console.log("========================================");
  console.log(" LINKEDIN FINAL SKILL SCAN");
  console.log(" READ ONLY - NO CHANGES");
  console.log("========================================");

  const browser = await chromium.connectOverCDP(
    "http://localhost:9222"
  );

  const context = browser.contexts()[0];

  if (!context) {
    throw new Error("No Chrome context found.");
  }

  let page = context.pages().find(p =>
    p.url().includes("/details/skills")
  );

  if (!page) {
    page = await context.newPage();
  }

  await page.goto(SKILLS_URL, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  }).catch(() => {});

  console.log("\nSkills page loaded.");

  await page.waitForTimeout(2500);

  const workspace = page.locator("main#workspace");

  if (!(await workspace.count())) {
    console.log("ERROR: Skills workspace not found.");
    process.exit(1);
  }

  // Start at top.
  await workspace.evaluate(el => {
    el.scrollTop = 0;
  });

  await page.waitForTimeout(500);

  const found = new Set();

  // Hard limit: 30 scrolls maximum.
  for (let i = 0; i < 30; i++) {

    const links = await page.locator(
      'a[aria-label^="Edit "][aria-label$=" skill"]'
    ).all();

    for (const link of links) {
      const aria = await link.getAttribute("aria-label");

      if (!aria) continue;

      const skill = aria
        .replace(/^Edit /, "")
        .replace(/ skill$/, "")
        .trim();

      if (skill) {
        found.add(skill);
      }
    }

    const before = await workspace.evaluate(
      el => el.scrollTop
    );

    await workspace.evaluate(el => {
      el.scrollTop += Math.max(
        500,
        Math.floor(el.clientHeight * 0.85)
      );
    });

    await page.waitForTimeout(500);

    const after = await workspace.evaluate(
      el => el.scrollTop
    );

    const atBottom = await workspace.evaluate(
      el => el.scrollTop + el.clientHeight >= el.scrollHeight - 5
    );

    if (atBottom || after === before) {
      // Final collection at bottom.
      const finalLinks = await page.locator(
        'a[aria-label^="Edit "][aria-label$=" skill"]'
      ).all();

      for (const link of finalLinks) {
        const aria = await link.getAttribute("aria-label");

        if (!aria) continue;

        const skill = aria
          .replace(/^Edit /, "")
          .replace(/ skill$/, "")
          .trim();

        if (skill) {
          found.add(skill);
        }
      }

      break;
    }
  }

  // Sort alphabetically for easy review.
  const skills = [...found].sort((a, b) =>
    a.localeCompare(b)
  );

  console.log("\n========================================");
  console.log(` CURRENT SKILLS: ${skills.length}`);
  console.log("========================================\n");

  skills.forEach((skill, index) => {
    console.log(`${index + 1}. ${skill}`);
  });

  console.log("\n========================================");
  console.log(" SCAN COMPLETE - NO CHANGES MADE");
  console.log("========================================");

  console.log("\nChrome remains open.");
})();