import { ManagementClient } from "auth0";
import { writeFileSync } from "fs";
import { logger } from "./logger.js";
import got from "got";
import nodegzip from "node-gzip";
import { APPLICATIONS_FILENAME, AUTHORIZATION_EXTENSION_EXPORT_FILENAME } from "./constants.js";
import { readAndValidateConfig } from "./config.js";
import { getAuthorizationExtensionClient } from "./AuthorizationExtensionClient.js";
const { ungzip } = nodegzip;

let managementClient;
function getManagementClient() {
  if (!managementClient) {
    const { TENANT_DOMAIN, CLIENT_ID, CLIENT_SECRET } = process.env;
    managementClient = new ManagementClient({
      domain: TENANT_DOMAIN,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    });
  }
  return managementClient;
}

export async function getRemoteData() {
  readAndValidateConfig();
  await getApplications();
  await getUsers();
  await getAuthorizationExtensionExport();
}

async function getApplications() {
  logger.info("Downloading applications");
  const { data: applications } = await getManagementClient().clients.getAll({
    fields: "client_id,name",
    include_fields: true
  });

  writeFileSync(APPLICATIONS_FILENAME, JSON.stringify(applications, null, 2), {});
  logger.info(`${logger.yellow(APPLICATIONS_FILENAME)} file generated`);
}

async function getUsers() {
  const job = await exportUsersAndWait();
  await downloadUsers(job.location);
}

async function exportUsersAndWait() {
  logger.info(`Generating user exports job`);
  let job;
  const result = await getManagementClient().jobs.exportUsers({
    fields: ["user_id", "email", "name", "last_login"].map((field) => ({ name: field })),
    format: "json"
  });
  job = result.data;
  return await waitForJobToComplete(job.id);
}

async function waitForJobToComplete(jobId) {
  logger.info("Waiting for export job to finish");
  let done = false;
  let job;
  while (!done) {
    job = (await getManagementClient().jobs.get({ id: jobId })).data;
    const { status } = job;
    if (status === "completed") {
      done = true;
    } else if (status === "failed") {
      const { data: errors } = await getManagementClient().jobs.getErrors({ id: jobId });
      throw new Error(errors);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  return job;
}

async function downloadUsers(location) {
  logger.info("Downloading user export");
  const { body } = await got(location, {
    responseType: "buffer"
  });

  // unzip the buffered gzipped data
  writeFileSync("users.ndjson", (await ungzip(body)).toString(), {});
  logger.info(`${logger.yellow("users.ndjson")} file generated`);
}

async function getAuthorizationExtensionExport() {
  const authorizationExtensionClient = getAuthorizationExtensionClient();
  logger.info("Obtaining configuration from the Authorization Extension");
  const config = await authorizationExtensionClient.getConfiguration();

  // delete unneeded values
  delete config.configuration;
  writeFileSync(AUTHORIZATION_EXTENSION_EXPORT_FILENAME, JSON.stringify(config, null, 2), {});
  logger.info(`${logger.yellow(AUTHORIZATION_EXTENSION_EXPORT_FILENAME)} file generated.`);
}
