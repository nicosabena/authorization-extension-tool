import { getAuthorizationExtensionClient } from "./AuthorizationExtensionClient.js";
import { logger } from "./logger.js";
import { confirm } from "./prompt.js";

export async function copyGroupMembers(source, target, options, command) {
  const authorizationExtensionClient = getAuthorizationExtensionClient();
  const allGroups = (await authorizationExtensionClient.getAllGroups()).groups;
  let sourceGroup, targetGroup;
  try {
    sourceGroup = findOnebyNameOrId(allGroups, source, "group");
    targetGroup = findOnebyNameOrId(allGroups, target, "group");
    if (sourceGroup === targetGroup) {
      throw new Error("The source and target groups can't be the same.");
    }
  } catch (e) {
    logger.error(e.message);
    return;
  }
  logger.info("Source:", logger.yellow(sourceGroup.name));
  logger.info("target:", logger.yellow(targetGroup.name));
  const directMembersCount = sourceGroup.members?.length;
  if (!directMembersCount) {
    logger.info("The source group does not contain direct members.");
    return;
  }
  if (!options.yes) {
    let allRoles;
    async function rolesDifferences(sourceRoles = [], targetRoles = []) {
      const missingRoles = sourceRoles.filter(
        (role) => !targetRoles.some((targetRole) => targetRole === role)
      );
      if (missingRoles.length > 0) {
        if (allRoles === undefined) {
          allRoles = (await authorizationExtensionClient.getAllRoles()).roles;
        }
        const missingRolesDescriptions = missingRoles
          .map((missingRole) => ({
            id: missingRole,
            role: allRoles.find((role) => role._id === missingRole)
          }))
          .map((missingRolePair) =>
            missingRolePair.role ? missingRolePair.role.name : missingRole.id
          );
        return missingRolesDescriptions;
      }
      return [];
    }
    const missingRolesInTarget = await rolesDifferences(sourceGroup.roles, targetGroup.roles);
    const missingRolesInSource = await rolesDifferences(targetGroup.roles, sourceGroup.roles);

    if (missingRolesInTarget.length > 0) {
      logger.blankLine();
      logger.warning(
        "WARNING: The following roles are present in the source group but not in the target group: "
      );
      for (const missingRole of missingRolesInTarget) {
        logger.warning(`- ${missingRole}`);
      }
      logger.warning(
        "This means that users will potentially LOSE the above roles if you remove the source group."
      );
      logger.blankLine();
    }

    if (missingRolesInSource.length > 0) {
      logger.blankLine();
      logger.warning(
        "WARNING: The following roles are present in the target group but not in the source group: "
      );
      for (const missingRole of missingRolesInSource) {
        logger.warning(`- ${missingRole}`);
      }
      logger.warning("This means that users will GAIN the above roles.");
      logger.blankLine();
    }
  }

  if (!options.yes &&
    !confirm(
      `Copy ${directMembersCount} members from group "${sourceGroup.name}" to group "${targetGroup.name}"?`
    )
  ) {
    logger.info("Cancelled");
    return;
  }
  logger.info(
    `Copying ${directMembersCount} members from group "${sourceGroup.name}" to group "${targetGroup.name}"`
  );
  await authorizationExtensionClient.addGroupMembers(targetGroup._id, sourceGroup.members);
  //logger.info(`Removing ${directMembersCount} members from group "${sourceGroup.name}"`);
  //await authorizationExtensionClient.removeGroupMembers(sourceGroup._id, sourceGroup.members);
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
