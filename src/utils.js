import { logger } from "./logger.js";
const NOT_FOUND = "NOT_FOUND";

export function RequiredOptionError(option) {
  return new Error(`The option ${logger.yellow(option)} is required`, {
    cause: {
      code: "RequiredOption",
      option
    }
  });
}

const defaultSortLogic = (a, b) =>
  a.applicationId && b.applicationId
    ? a.applicationId.localeCompare(b.applicationId) || a.name.localeCompare(b.name)
    : a.name.localeCompare(b.name);

const normalizePermissionName = (name) => {
  const [operationA, resourceA] = name.split(":");
  return resourceA ? `${resourceA} - ` + operationA : name;
}
export const permissionsSortLogic = (a, b) => {
  const normalizedNameA = normalizePermissionName(a.name);
  const normalizedNameB = normalizePermissionName(b.name);
  return (
    a.applicationId.localeCompare(b.applicationId) ||
    normalizedNameA.localeCompare(normalizedNameB)
  );
};

export function sortData(data) {
  const { roles, permissions, groups } = data;
  roles.sort(defaultSortLogic);
  permissions.sort(permissionsSortLogic);
  groups.sort(defaultSortLogic);
  for (const group of groups) {
    if (group.members) {
      group.members.sort();
    }
  }
}

export function augmentData(data) {
  const { groups, roles, permissions, users, applications } = data;
  const groupsMap = groups.reduce((map, group) => {
    map[group._id] = group;
    return map;
  }, {});
  const rolesMap = roles.reduce((map, role) => {
    map[role._id] = role;
    return map;
  }, {});
  const permissionsMap = permissions.reduce((map, permission) => {
    map[permission._id] = permission;
    return map;
  }, {});
  const applicationsMap = applications.reduce((map, application) => {
    map[application.client_id] = application;
    return map;
  }, {});

  const getApplicationName = (clientId) => applicationsMap[clientId]?.name || clientId;

  if (users) {
    const usersMap = users.reduce((map, user) => {
      map[user.user_id] = user;
      return map;
    }, {});
    data.usersMap = usersMap;
  }

  for (const role of roles) {
    role.applicationName = getApplicationName(role.applicationId);
    role.permissions = (role.permissions ?? []).map(
      (permissionId) =>
        permissionsMap[permissionId] ?? {
          _id: permissionId,
          name: NOT_FOUND
        }
    );
  }

  for (const group of groups) {
    group.roles = (group.roles ?? []).map(
      (roleId) =>
        rolesMap[roleId] ?? {
          _id: roleId,
          name: NOT_FOUND
        }
    );
    group.members = group.members ?? [];
    group.nested = (group.nested ?? []).map(
      (groupId) =>
        groupsMap[groupId] ?? {
          _id: groupId,
          name: NOT_FOUND,
          members: []
        }
    );
  }
  const getAllChildGroups = (group) => {
    const visited = [];
    const getChildren = (group) => {
      if (!visited.includes(group)) {
        visited.push(group);
        for (const nestedGroup of group.nested) {
          getChildren(nestedGroup);
        }
      }
    };
    getChildren(group);
    return visited;
  };

  const getAllParentGroups = (group) => {
    const visited = [];
    const getParents = (group) => {
      if (!visited.includes(group)) {
        visited.push(group);
        for (const parentGroup of group.directParents) {
          getParents(parentGroup);
        }
      }
    };
    getParents(group);
    return visited;
  };

  // calculate all members for a group: the union of
  // the member of the group plus the members of all nested groups.
  const getAllMembers = (group) => {
    const allMembers = [...new Set(group.allChildGroups.flatMap((group) => group.members))].sort();
    return allMembers;
  };
  const getAllRoles = (group) => {
    const allRoles = [...new Set(group.allParentGroups.flatMap((group) => group.roles))].sort(
      defaultSortLogic
    );
    return allRoles;
  };
  for (const group of groups) {
    group.directParents = groups.filter((parent) => parent.nested.some((child) => child === group));
  }
  for (const group of groups) {
    group.allChildGroups = getAllChildGroups(group);
    group.allMembers = getAllMembers(group);
    group.allParentGroups = getAllParentGroups(group);
    group.allRoles = getAllRoles(group);
  }

  for (const permission of permissions) {
    permission.applicationName = getApplicationName(permission.applicationId);
  }
}
