import puppeteer from "puppeteer";
import fs from "fs/promises";

const sleep = async (ms) => {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res();
    }, ms);
  });
};

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
  await sleep(500);

  await page.click(`[id^="u_0_5"]`);

  console.log("login done");
  await page.waitForNavigation();
};

let getProductsUrl = async (browser) => {
  const page = await browser.newPage();
  await page.goto(
    `https://www.facebook.com/marketplace/category/${process.env.CATEGORY}`,
    {
      waitUntil: "networkidle2",
    }
  );

  return page.evaluate(() => {
    const productsUrl = [];

    const productsListHeaderElm = [
      ...document.getElementsByTagName("span"),
    ].find((element) => element?.innerText === "Shop by Category");

    // const container =
    //   productsListHeaderElm?.parentElement?.parentElement?.parentElement
    //     ?.nextSibling;

    const container =
      productsListHeaderElm.parentElement.parentElement.parentElement
        .parentElement.parentElement.parentElement.parentElement.parentElement
        .parentElement.parentElement.nextElementSibling.nextElementSibling
        .nextElementSibling.firstChild.lastChild;

    let target = container?.firstChild;

    [...Array(5)].forEach(() => {
      const url = target?.getElementsByTagName("a").item(0)?.href;
      if (url) productsUrl.push(url);
      target = target?.nextSibling;
    });

    return productsUrl;
  });
};

const getProductInfo = async (browser, url) => {
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  const productInfo = await page.evaluate(() => {
    const root = document
      .querySelector('[role="main"]')
      .querySelector("#ssrb_feed_start + div > div > div > div");

    const container =
      root.children.length === 4
        ? root.children[2]?.firstChild
        : root.children.length === 5
        ? root.children[3].firstChild
        : root.children[1]?.firstChild;

    const imagesContainer = container?.firstChild?.firstChild;

    const images = !imagesContainer
      ? null
      : imagesContainer.children.length === 3
      ? [...imagesContainer.firstChild?.getElementsByTagName("img")].map(
          (img) => img.src
        )
      : [...imagesContainer.children[2].getElementsByTagName("img")].map(
          (img) => img.src
        );

    const informations =
      container?.lastChild.children.length === 1
        ? container?.lastChild.firstChild.firstChild.firstChild
        : container?.lastChild.firstChild.firstChild.firstChild.firstChild;

    const headInfos =
      informations.children.length === 3
        ? [...informations.firstChild.firstChild.getElementsByTagName("span")]
        : [...informations.firstChild.getElementsByTagName("span")];

    const title = headInfos[0]?.innerText;
    const formattedPrice = headInfos[1]?.innerText;
    const formatedCreatedAt = headInfos[2]?.innerText
      .split("in")[0]
      .replace("Listed", "")
      .trim();
    const location = headInfos[3]?.innerText;

    const detailsElement = [...informations.getElementsByTagName("span")].find(
      (elem) => elem?.innerText === "Details"
    );

    const sallerDescElement = detailsElement
      ? null
      : [...informations.getElementsByTagName("span")].find(
          (elem) => elem?.innerText === "Seller's Description"
        ).parentElement.parentElement.parentElement.parentElement.parentElement
          .parentElement.parentElement.parentElement.parentElement;

    const detailsContainer = detailsElement
      ? detailsElement.parentElement.parentElement.parentElement.parentElement
          .parentElement.parentElement.parentElement.nextElementSibling
      : null;

    const condition = detailsContainer
      ? detailsContainer
          .getElementsByTagName("li")
          .item(0)
          ?.getElementsByTagName("span")
          .item(5)?.innerText ?? null
      : null;

    const descriptionBySellerDesc = sallerDescElement
      ? sallerDescElement.nextElementSibling
          .getElementsByTagName("span")
          .item(0)
          ?.innerText.trim()
      : null;

    const description = detailsContainer
      ? detailsContainer
          .getElementsByTagName("ul")
          .item(0)
          .nextElementSibling.getElementsByTagName("span")
          .item(0)?.innerText
      : descriptionBySellerDesc !== location
      ? descriptionBySellerDesc
      : null;

    return {
      title,
      formattedPrice,
      formatedCreatedAt,
      location,
      condition,
      description,
      images,
    };
  });

  return {
    ...productInfo,
    category: process.env.CATEGORY,
  };
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

    const productsUrlByGrp = await Promise.all(
      [...Array(10)].map(async () => await getProductsUrl(browser))
    );

    const productsUrl = [];

    for (let grp of productsUrlByGrp) {
      for (let url of grp) {
        productsUrl.push(url);
      }
    }

    const products = await Promise.all(
      productsUrl.map(async (url) => await getProductInfo(browser, url))
    );

    await fs.writeFile("data/products.json", JSON.stringify(products), "utf8");

    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();
