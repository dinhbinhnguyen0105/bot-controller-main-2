const path = require("path");
const { Controller } = require("./controller");

class FacebookController extends Controller {
    async checkLogin() {
        try {
            const uid = path.basename(this.puppeteerOptions.userDataDir);
            const loginUrl = "https://www.facebook.com/login";
            await this.page.goto(loginUrl);
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentUrl = this.page.url();
            if (currentUrl.includes("home.php")) {
                return true;
            }
            else {
                console.error(`User is not logged into Facebook in userDataDir: [${uid}]`)
                return false;
            };
        } catch (err) {
            console.error("Check login failed: ", err);
            await this.cleanup();
            throw err;
        };
    }
    async getName() {
        try {
            await this.page.goto("https://www.facebook.com/profile.php", { timeout: 60000 });
            await this.humanDelay(1000, 1000);
            await this.page.waitForSelector("h1");//, { visible: true }
        } catch (err) {
            console.error(err);
            return false;
        }
        const usernameElms = await this.page.$$("h1");
        for (let usernameElm of usernameElms) {
            const isVisible = await this.checkVisibleElement(usernameElm);
            if (isVisible) {
                const username = await usernameElm.evaluate(elm => elm.textContent);
                return username.trim();
            };
        };
        return false;
    }
    async reelAndLike(iterations) {
        await this.humanDelay(1000, 3000);
        await this.page.goto("https://www.facebook.com/reel/");

        const pageLang = await this.page.$eval("html", html => html.lang);
        if (!pageLang.includes("vi") && !pageLang.includes("en")) {
            console.error("The website is not available in the supported language");
            return false;
        };

        const ARIA_LABEL = {
            next: pageLang.includes("vi") ? "thẻ tiếp theo" : "next card",
            like: pageLang.includes("vi") ? "thích" : "like",
        };

        // const iterations = Math.floor(Math.random() * (10 - 3 + 1)) + 3;
        console.log(iterations);
        for (let i = 0; i < iterations; i++) {
            await this.humanDelay(8000, 30000);
            await this.humanDelay(1000, 1000);
            // click next
            await this.page.waitForSelector("div[role='button']");
            const buttonElms = await this.page.$$("div[role='button']");
            for (let btnElm of buttonElms) {
                const isNextBtn = await btnElm.evaluate((elm, ariaLabel) => {
                    const label = elm.getAttribute("aria-label");
                    if (label && label.toLowerCase().includes(ariaLabel)) return true;
                    else return false;
                }, ARIA_LABEL.next);
                if (isNextBtn) {
                    const isVisible = true;
                    if (isVisible) {
                        await this.humanDelay(1000, 3000);
                        await this.humanClick(btnElm);
                        await this.humanDelay(1000, 3000);
                        break;
                    } else { continue; };
                } else { continue; };
            };

            if (Math.random() > 0.5) {
                // Like
                await this.page.waitForSelector("div[role='button']");
                const buttonElms = await this.page.$$("div[role='button']");

                for (let btnElm of buttonElms) {
                    const isLikeBtn = await btnElm.evaluate((elm, ariaLabel) => {
                        const label = elm.getAttribute("aria-label");
                        if (label && label.toLowerCase().includes(ariaLabel)) return true;
                        else return false;
                    }, ARIA_LABEL.like);
                    if (isLikeBtn) {
                        const isVisible = await this.checkVisibleElement(btnElm);
                        if (isVisible) {
                            await this.humanDelay(1000, 3000);
                            await this.humanClick(btnElm);
                            await this.humanDelay(1000, 3000);
                            break;
                        } else { continue; };
                    } else { continue; };
                };
            };
        };
    }
    async newsFeed() {
        await this.humanDelay(1000, 3000);
        await this.page.goto("https://www.facebook.com");
        const pageLang = await this.page.$eval("html", html => html.lang);
        if (!pageLang.includes("vi") && !pageLang.includes("en")) {
            console.error("The website is not available in the supported language");
            return false;
        };
        const ARIA_LABEL = {
            like: pageLang.includes("vi") ? "thích" : "like",
        };
        let count = 0;
        while (count < 20) {
            await this.page.waitForSelector("div[aria-describedby]");
            const posinsetElms = await this.page.$$("div[aria-describedby]");
            for (let posinsetElm of posinsetElms) {
                // const innerHTML = await posinsetElm.evaluate(elm => elm.innerHTML);
                // console.log(innerHTML);
                await this.humanScrollDown(3)
                await this.humanScrollToElement(posinsetElm);
                await this.humanDelay(3000, 10000);
                if (Math.random() > 0.5) {
                    const buttonElms = await posinsetElm.$$("div[role='button']");
                    for (let buttonElm of buttonElms) {
                        const isLikeBtn = await buttonElm.evaluate((elm, ariaLabel) => {
                            const label = elm.getAttribute("aria-label");
                            if (label && label.toLowerCase().includes(ariaLabel)) return true;
                            else return false;
                        }, ARIA_LABEL.like);
                        if (isLikeBtn) {
                            const isVisible = await this.checkVisibleElement(buttonElm);
                            if (isVisible) {
                                await this.humanDelay(1000, 3000);
                                await this.humanClick(buttonElm);
                                await this.humanDelay(1000, 3000);
                                break;
                            } else { continue; };
                        }
                    }
                }
                count++;
            };
        };
    }
}

module.exports = { FacebookController };
