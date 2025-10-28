import mongoose from "mongoose";
import app from "./app";
import config from "./app/config";
import { Server as HttpServer } from "http";
import createAdmin from "./app/utils/createAdmin";
import initializeSocket from "./app/socket";

let server: HttpServer;
const socketServer = new HttpServer();

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    server = app.listen(Number(config.port), config.ip as string, () => {
      console.log(`🐿️  Alyse server is running on port: ${config.port}`);
    });

    // socket server
    initializeSocket(socketServer);
    socketServer.listen(Number(config.socket_port), () => {
      console.log('🔌 Socket server is running on port:', config.socket_port);
    });

  } catch (error) {
    console.log("server error:", error);
  }
}

main();

// create default admin user
createAdmin();

process.on("unhandledRejection", () => {
  console.log(`unhandledRejection is detected, server shutting down... 😞`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  if (socketServer) socketServer.close(() => {
    process.exit(1);
  });
  process.exit(1);
});

process.on("uncaughtException", () => {
  console.log(`uncaughtException is detected, server shutting down... 😞`);
  process.exit();
});
