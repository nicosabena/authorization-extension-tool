import { logger } from "./logger.js";
import dotenv from "dotenv";

export function validateConfig() {
  const requiredValues = [
    "TENANT_DOMAIN",
    "CLIENT_ID",
    "CLIENT_SECRET",
    "AUTHORIZATION_EXTENSION_API_TOKEN_AUDIENCE",
    "AUTHORIZATION_EXTENSION_API_URL"
  ];
  for (const value of requiredValues) {
    if (!process.env[value]) {
      throw new Error(`Required configuration value not found: ${value}`);
    }
  }
}

export function readAndValidateConfig() {
  const configPaths = [".env", "~/.ae-toolrc"];

  let configurationFileFound = false;
  for (const configPath of configPaths) {
    const result = dotenv.config({ path: configPath });
    if (!result.error) {
      configurationFileFound = configPath;
      break;
    }
  }

  try {
    validateConfig();
  } catch (err) {
    logger.error(err.message);
    if (configurationFileFound) {
      logger.info(`Configuration read from ${configurationFileFound}`);
    } else {
      logger.error(`Configuration file not found`);
    }
    logger.info(
      "Be sure to provide a configuration file for the app using the template provided in .env.example.."
    );
    logger.info("The app will look for a configuration file in the following locations:");
    logger.info(configPaths);
    logger.blankLine();
    logger.info(
      "Any environment variable already defined will not be overwritten by the configuration file value."
    );
    process.exit(1);
  }
}
