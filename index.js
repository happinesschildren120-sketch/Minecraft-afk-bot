const bedrock = require("bedrock-protocol");

const config = {
  host: "DragonCraftSMP1.aternos.me",
  port: 59696,
  username: "AFK_Bot",
  offline: true,
  reconnectDelay: 5000,
  afkMoveInterval: 30000,
};

let client = null;
let afkInterval = null;
let reconnectTimeout = null;

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function stopIntervals() {
  if (afkInterval) clearInterval(afkInterval);
  afkInterval = null;
}

function startAFKMove() {
  let yaw = 0;
  afkInterval = setInterval(() => {
    if (!client) return;
    yaw = (yaw + 45) % 360;
    log(`Anti-AFK rotation: ${yaw}`);
  }, config.afkMoveInterval);
}

function connect() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  log("Server এ connect হচ্ছি...");
  try {
    client = bedrock.createClient({
      host: config.host,
      port: config.port,
      username: config.username,
      offline: config.offline,
    });
  } catch (err) {
    log("Connect error: " + err.message);
    scheduleReconnect();
    return;
  }

  client.on("spawn", () => {
    log("✅ Bot spawn হয়েছে! চালু আছে।");
    stopIntervals();
    startAFKMove();
  });

  client.on("respawn", () => {
    log("💀 Auto respawn হচ্ছে...");
    try { client.queue("respawn", { state: 2 }); } catch (e) {}
  });

  client.on("disconnect", (reason) => {
    log("Disconnect: " + JSON.stringify(reason));
    stopIntervals();
    scheduleReconnect();
  });

  client.on("close", () => {
    log("Connection বন্ধ হয়ে গেছে।");
    stopIntervals();
    scheduleReconnect();
  });

  client.on("error", (err) => {
    log("Error: " + err.message);
    stopIntervals();
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (reconnectTimeout) return;
  client = null;
  log(`${config.reconnectDelay / 1000} সেকেন্ড পর reconnect হবে...`);
  reconnectTimeout = setTimeout(connect, config.reconnectDelay);
}

process.on("uncaughtException", (err) => {
  log("Uncaught: " + err.message);
  scheduleReconnect();
});

connect();
