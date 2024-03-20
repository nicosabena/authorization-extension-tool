import { getAuthorizationExtensionClient } from "./AuthorizationExtensionClient.js";
import { logger } from "./logger.js";
import { confirm } from "./prompt.js";

export async function addGroupMapping(source, connectionName, externalGroupName, options, command) {

  const authorizationExtensionClient = getAuthorizationExtensionClient();
  const allGroups = (await authorizationExtensionClient.getAllGroups()).groups;
  let sourceGroup;
  try {
    sourceGroup = findOnebyNameOrId(allGroups, source, "group");
  } catch (e) {
    logger.error(e.message);
    return;
  }

  logger.info("Source:", logger.yellow(sourceGroup.name));
  
  const mappings = await authorizationExtensionClient.getGroupMappings(sourceGroup._id);
  console.log("Mappings: ", mappings);

  function connectionNameMatch(mappingConnectionName, connectionName) {
    mappingConnectionName = mappingConnectionName.split(" ")[0];
    return mappingConnectionName === connectionName;
  }

  if (mappings.find(mapping => connectionNameMatch(mapping.connectionName,connectionName) && mapping.groupName === externalGroupName)) {
    console.log("The specified mapping already exists");
    return;
  }

  if (mappings.find(mapping => connectionNameMatch(mapping.connectionName,connectionName))) {
    console.log(`NOTE: there's already a mapping for connection ${connectionName}`);
  }
  if (!options.yes &&
    !confirm(
      `Add mapping for connection ${connectionName} and external group "${externalGroupName}" for group ${sourceGroup.name}?`
    )
  ) {
    logger.info("Cancelled");
    return;
  }
  await authorizationExtensionClient.createGroupMapping(sourceGroup._id, connectionName, externalGroupName);
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
