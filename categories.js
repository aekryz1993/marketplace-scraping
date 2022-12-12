import puppeteer from "puppeteer";
import fs from "fs/promises";

const CRED = {
  user: process.env.USER,
  pass: process.env.PASS,
};

const ID = {
  login: "#email",
  pass: "#pass",
};

let login = async (page) => {
  // login
  await page.goto("https://facebook.com", {
    waitUntil: "networkidle2",
  });
  await page.waitForSelector(ID.login);

  await page.type(ID.login, CRED.user);

  await page.type(ID.pass, CRED.pass);

  await page.click(`[id^="u_0_5"]`);

  console.log("login done");
  await page.waitForNavigation();
};
let getCategories = async (page) => {
  await page.goto("https://www.facebook.com/marketplace/?ref=app_tab");

  const categories = await page.evaluate(async () => {
    const soeFilterElm = document.getElementById("seo_filters");
    const soeFilterParentElm = soeFilterElm.parentElement;
    const categoriesHeaderElm = soeFilterParentElm.nextSibling;
    const categoriesLabel = [];
    let target = categoriesHeaderElm;
    while (target.nextSibling) {
      target = target.nextSibling;
      categoriesLabel.push(target.textContent);
    }
    return {
      categoriesLabel,
    };
  });

  await fs.writeFile(
    "data/categories.txt",
    categories.categoriesLabel.join("\r\n")
  );
};

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ["--start-maximized"],
    });
    const page = await browser.newPage();
    await login(page);
    await getCategories(page);

    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();
