const path = require("path");
const { ipcMain } = require("electron");
const { get, post, put, del } = require("../utils/userDBHandler");
const { FacebookController } = require("./puppeteer/Facebook");
const fs = require("fs");

const userAPIs = () => {
    ipcMain.on("user:get", async (res, req) => {
        const userDB = get();
        res.sender.send("user:get", {
            message: "Success",
            status: true,
            data: userDB,
        });
    });
    ipcMain.on("user:post", async (res, req) => {
        if (req?.payload) {
            console.log(req.payload);
            const status = post(req.payload);
            res.sender.send("user:post", {
                message: "Successfully posted",
                status: status,
            });
        } else {
            res.sender.send("user:post", {
                message: "An error occurred while add.",
                status: false,
            });
        }

    })
    ipcMain.on("user:put", async (res, req) => {
        if (req?.uid && req?.payload) {
            const status = put(req.uid, req.payload);
            res.sender.send("user:put", {
                message: `Successfully edited UID: ${req.uid}`,
                status: status,
            });
        } else {
            res.sender.send("user:put", {
                message: `An error occurred while editing the user with UID: ${req.uid}`,
                status: false,
            });
        }
    })
    ipcMain.on("user:delete", async (res, req) => {
        if (req?.uid) {
            const userDir = path.join(__dirname, "..", "..", "bin", "browsers", req.uid);
            if (fs.existsSync(userDir)) {
                fs.rmSync(userDir, { recursive: true, force: true });
            }
            const status = del(req.uid);

            res.sender.send("user:delete", {
                message: `Successfully deleted UID: ${req.uid}`,
                status: status,
            });
        } else {
            res.sender.send("user:delete", {
                message: `An error occurred while deleting the user with UID: ${req.uid}`,
                status: false,
            });
        }
    })
    ipcMain.on("user:launch-browser", async (res, req) => {
        const user = req.user;
        const userDataDir = path.join(__dirname, "..", "..", "bin", "browsers", user.info.uid);
        const controller = new FacebookController({
            headless: false,
            userAgent: user.info.userAgent,
            proxy: user.info.proxy,
            userDataDir: userDataDir,
        });
        await controller.initBrowser();
        await controller.page.goto("https://www.facebook.com/");
        if (controller.browser.isConnected()) {
            res.sender.send("user:launch-browser", {
                message: `The ${user.info.uid}'s browser has been opened..`,
                status: true,
                data: { launched: true },
            });
        }
        controller.browser.on("disconnected", () => {
            res.sender.send("user:launch-browser", {
                message: `The ${user.info.uid}'s browser has been closed..`,
                status: true,
                data: { closed: true },
            });
        });
    })
    ipcMain.on("user:run-bot", async (res, req) => {
        console.log(req.payload.actions);
        req.payload.forEach(user => {
            console.log(user.actions);
        });
        // return;
        for (let user of req.payload) {
            const userDataDir = path.join(__dirname, "..", "..", "bin", "browsers", user.info.uid);
            const controller = new FacebookController({
                headless: false,
                userAgent: user.info.userAgent,
                proxy: user.info.proxy,
                userDataDir: userDataDir,
            });
            await controller.initBrowser();
            const isLogged = await controller.checkLogin();
            if (!isLogged) { break; }

            if (user?.actions?.getName) {
                const username = await controller.getName();
                put(user.info.uid, { info: { username: username } });
            }
            if (user?.actions?.reelAndLike) {
                await controller.reelAndLike(1);
            }
            if (user?.actions?.newsFeed) {
                await controller.newsFeed();
            }

            controller.cleanup();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        res.sender.send("user:run-bot", {
            message: `Success`,
            status: true,
        })
    })
};

module.exports = { userAPIs };
