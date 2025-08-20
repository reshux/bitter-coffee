import { Server } from "http";
import { closeDatabase } from "../db/database";

export const setupGracefulShutdown = (server: Server) => {
	const gracefulShutdown = (signal: string) => {
		console.log(`Received ${signal}. Starting graceful shutdown...`);

		server.close(() => {
			console.log("HTTP server closed.");

			// Close database connection
			console.log("Closing database connection...");
			closeDatabase();

			console.log("Graceful shutdown complete.");
			process.exit(0);
		});

		// Force shutdown after 10 seconds if graceful shutdown hangs
		setTimeout(() => {
			console.error("Graceful shutdown timeout. Forcing exit.");
			process.exit(1);
		}, 10000);
	};

	// Handle shutdown signals
	process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
	process.on("SIGINT", () => gracefulShutdown("SIGINT"));
};
