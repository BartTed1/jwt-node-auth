const app = require('./app');

app.set("port", process.env.APP_PORT || 8000);

const server = app.listen(app.get("port"), () => {
    console.log("Start");
});