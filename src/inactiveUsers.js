import { RequiredOptionError } from "./utils.js";

export function getInactiveGroupsAndUsers(data, options) {
  const { groups, usersMap } = data;
  if (!options.cutoff) {
    throw RequiredOptionError("cutoff");
  }
  const groupFilter = (group) => (options.group ? group.name === options.group : true);
  return groups
    .filter(groupFilter)
    .map((group) => ({
      ...group,
      inactiveMembers: group.members.filter(
        (member_id) => !usersMap[member_id] || usersMap[member_id].last_login < options.cutoff
      )
    }))
    .filter((group) => group.inactiveMembers.length > 0);
}
