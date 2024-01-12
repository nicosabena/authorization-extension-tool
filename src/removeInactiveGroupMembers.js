import { AuthorizationExtensionClient } from "./AuthorizationExtensionClient.js";
import { readAndValidateConfig } from "./config.js";
import { getInactiveGroupsAndUsers } from "./inactiveUsers.js";
import { initializeData } from "./initializeData.js";
import { logger } from "./logger.js";
import { confirm } from "./prompt.js";
import { writeFileSync } from "fs";
export async function removeInactiveGroupMembers(options) {
  await readAndValidateConfig();
  const data = await initializeData();
  const groups = getInactiveGroupsAndUsers(data, options).map((group) => ({
    _id: group._id,
    name: group.name,
    inactiveMembers: group.inactiveMembers
  }));
  if (groups.length === 0) {
    logger.info("No inactive users were found");
    return;
  }
  const total = groups.reduce((total, group) => {
    total += group.inactiveMembers.length;
    return total;
  }, 0);
  logger.blankLine();
  logger.info(
    `There are ${total} inactive members that will be removed from ${groups.length} groups. You can list these users with:`
  );
  logger.info(
    `ae-tool report groups-with-inactive-members --flat --cutoff ${options.cutoff} > groups-with-inactive-members-${options.cutoff}.csv`
  );
  logger.blankLine();
  if (!confirm(`Continue with the removal of ${total} members from ${groups.length} groups?`)) {
    logger.info("Cancelled");
    return;
  }
  logger.info("Deleting");

  const backupFileName = `inactive_users_in_groups_${new Date().toISOString()}.json`;

  logger.blankLine();
  logger.info(logger.green(`Creating file ${backupFileName} as a backup of users.`));
  logger.blankLine();
  writeFileSync(backupFileName, JSON.stringify(groups, null, 2));

  const authorizationExtensionClient = new AuthorizationExtensionClient();
  for (const group of groups) {
    logger.info(`Removing ${group.inactiveMembers.length} members from ${group.name}`);
    await authorizationExtensionClient.removeGroupMembers(group._id, group.inactiveMembers);
  }
  logger.info("Done.");
  logger.info(`A backup of deleted users can be found on ${backupFileName}`);
  return;
}
