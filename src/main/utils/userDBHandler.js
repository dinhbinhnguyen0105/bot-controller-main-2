const path = require("path");
const fs = require("fs");
const UserAgent = require("user-agents");
const dbPath = path.join(__dirname, "..", "..", "bin", "db", "userDB.json");

const get = (userUID) => {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify([]), { encoding: "utf8" });
    }
    const dbJson = fs.readFileSync(dbPath, { encoding: "utf8" });
    if (!dbJson) {
        fs.writeFileSync(dbPath, JSON.stringify([]), { encoding: "utf8" });
        return [];
    };
    const db = JSON.parse(dbJson);
    if (userUID) {
        const user = db.find(item => item.info.uid === userUID);
        return user;
    } else {
        return db;
    };
}

const post = (payload) => {
    const db = get();
    const newPayload = [];
    if (!Array.isArray(payload) && typeof payload === "object") {
        if (payload?.uid && payload?.password) {
            newPayload.push(payload);
        } else {
            return false;
        };
    } else {
        const validData = payload.filter(item => item?.uid && item?.password);
        newPayload.push(...validData);
    }
    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-CA', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
    }).format(today);
    const newData = [...db, ...newPayload.map(item => {
        const newUser = {
            info: { ...item },
            actions: {}
        }
        if (!item?.userAgent) {
            const userAgent = new UserAgent({ deviceCategory: "desktop" });
            newUser.info = {
                ...newUser.info,
                userAgent: userAgent.toString(),
            };
        };
        if (!item?.date) {
            newUser.info = {
                ...newUser.info,
                date: formattedDate,
            };
        };
        return newUser;
    })];
    fs.writeFileSync(dbPath, JSON.stringify(newData), { encoding: "utf8" });
    return true;
}
const put = (uid, payload) => {
    // payload: { info?: any; actions?: any }
    const db = get();
    const newData = db.map(item => {
        if (item.info.uid === uid) {
            return {
                ...item,
                info: { ...item.info, ...(payload.info || {}) },
                actions: { ...item.actions, ...(payload.actions || {}) },
            }
        } else {
            return item;
        };
    });
    fs.writeFileSync(dbPath, JSON.stringify(newData), { encoding: "utf8" });
    return true;
}
const del = (uid) => {
    const db = get();
    const newData = db.filter(item => item.info.uid !== uid);
    fs.writeFileSync(dbPath, JSON.stringify(newData), { encoding: "utf8" });
    return true;
}

module.exports = {
    get, post, put, del
};