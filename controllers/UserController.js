const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dbConnection = require("../utils/dbConnection");
const os = require('os');

exports.register = (req, res) => {
    let { username, password, permissions } = req.body,
        addUserMode = process.env.ADD_USER_MODE,
        authHeader = req.headers.authorization,
        token = authHeader && authHeader.split(" ")[1];
    if (!(addUserMode == "DENY_ALL" || addUserMode == "ALLOW_ADMIN" || addUserMode == "ALLOW_ALL")) return res.sendStatus(500);
    if (addUserMode == "DENY_ALL") return res.status(401).json({ message: "registration of new users is not allowed" });
    else if (addUserMode == "ALLOW_ADMIN") {
        try {
            jwt.verify(token, process.env.APP_SECRET, (err) => {
                if (err) throw err;
            });
        }
        catch {
            return res.status(403).json({ message: "Empty or invalid authentication token"});
        }
    }
    bcrypt.hash(password, 10, (err, hash) => {
        dbConnection.getConnection((err, connection) => {
            connection.query(`INSERT INTO users (id, username, hash, permissions) VALUES (NULL, '${username}', '${hash}', '${permissions}')`, (err) => {
                connection.release();
                if (err) return res.sendStatus(500);
                else return res.json({ message: "The user is registered"});
            });
        });
    });
}

exports.authenticate = (req, res) => {
    let { username, password } = req.body;
    dbConnection.getConnection((err, connection) => {
        connection.query(`SELECT hash, permissions FROM users WHERE username = '${username}'`, (err, rows) => {
            connection.release();
            if (err) return res.sendStatus(500);
            if (rows.length == 1) {
                bcrypt.compare(password, rows[0]["hash"], (err, result) => {
                    if (err) return res.sendStatus(500);
                    if (result) {
                        let token = jwt.sign({ username: req.body.username, permissions: rows[0]["permissions"] }, process.env.APP_SECRET, { expiresIn: parseInt(process.env.TOKEN_EXPIREIN) });
                        return res.json({accessToken: token});
                    }
                    else return res.status(401).json({ message: "Password is not valid" });
                });
            }
            else return res.status(400).json({ message: "User does not exist" });
        });
    });
}

exports.refreshToken = (req, res) => {
    let authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];
    jwt.verify(token, process.env.APP_SECRET, (err, user) => {
        if (err) return res.sendStatus(500);
        let toExp = user.exp - Date.now() / 1000;
        if (toExp < parseInt(process.env.TOKEN_REFRESH) && toExp > 0) {
            jwt.sign({ username: user.username, permissions: user.permissions }, process.env.APP_SECRET, { expiresIn: parseInt(process.env.TOKEN_EXPIREIN) }, (err, token) => {
                if (err) res.sendStatus(500);
                return res.json({accessToken: token});
            });
        }
    });
}

exports.verify = (req, res, next) => {
    let authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];
    jwt.verify(token, process.env.APP_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token expired" });
        let toExp = user.exp - Date.now() / 1000;
        if (toExp < parseInt(process.env.TOKEN_REFRESH) && toExp > 0) return this.refreshToken(req, res);
        else return next();
    });
}