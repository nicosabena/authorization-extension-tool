import { getAuthorizationExtensionClient } from "./AuthorizationExtensionClient.js";
import { logger } from "./logger.js";
import { confirm } from "./prompt.js";

export async function removeAllGroupMembers(groupName, options, command) {
  const authorizationExtensionClient = getAuthorizationExtensionClient();
  const allGroups = (await authorizationExtensionClient.getAllGroups()).groups;
  let group;
  try {
    group = findOnebyNameOrId(allGroups, groupName, "group");
  } catch (e) {
    logger.error(e.message);
    return;
  }

  async function getGroupMembers() {
    const allMembersResult = await authorizationExtensionClient.getGroupMembers(group._id);
    return allMembersResult.users.map((user) => user.user_id);
  }

  let allMembers = await getGroupMembers();
  if (allMembers.length === 0) {
    logger.info(`The group "${group.name}" has no direct members`);
    return;
  }

  if (!options.yes && !confirm(`Remove all members from the group "${group.name}"?`)) {
    logger.info("Cancelled");
    return;
  }
  while (allMembers.length > 0) {
    logger.info(`Deleting ${allMembers.length} users from "${group.name}"`);
    await authorizationExtensionClient.removeGroupMembers(group._id, allMembers);
    allMembers = await getGroupMembers();
  }
  logger.info("Done");
  return;
}

function findOnebyNameOrId(collection, identifier, itemType) {
  const results = collection.filter((item) => item._id === identifier || item.name === identifier);
  if (results.length === 0) {
    throw new Error(`Could not find ${itemType} with identifier ${identifier}.`);
  }
  if (results.length > 1) {
    throw new Error(`There is more than one ${itemType} with identifier ${identifier}.`);
  }
  return results[0];
}
