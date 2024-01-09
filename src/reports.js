import { outputCsv } from "./csvOutput.js";
import { initializeData } from "./initializeData.js";
import { logger } from "./logger.js";

function output(title, data) {
  outputCsv(title, data);
}

function userInfo(member_id, usersMap) {
  const user = usersMap?.[member_id];

  if (user) {
    return {
      last_login: user.last_login,
      name: user.name,
      email: user.email
    };
  }
  return {};
}

const Projections = {
  permissions: (permission) => ({
    application_name: permission.applicationName,
    permission_name: permission.name,
    permission_description: permission.description
  }),

  roles: (role) => ({
    application_name: role.applicationName,
    role_name: role.name,
    role_description: role.description
  }),

  rolesWithPermissions: (role) => ({
    ...Projections.roles(role),
    role_permissions: role.permissions.map((permission) => permission.name).join(", ")
  }),

  rolesWithPermissionsFlat: (role) =>
    role.permissions.map((permission) => ({
      ...Projections.roles(role),
      permission_name: permission.name
    })),

  groups: (group) => ({
    group_name: group.name,
    group_description: group.description,
    direct_members_count: group.members.length,
    total_members_count: group.allMembers.length
  }),

  groupsWithRoles: (group) => ({
    ...Projections.groups(group),
    direct_roles: group.roles.map((role) => role.name).join(", "),
    all_roles: group.allRoles.map((role) => role.name).join(", ")
  }),
  groupsWithRolesFlat: (group) =>
    group.allRoles.map((role) => ({
      ...Projections.groups(group),
      is_direct_role: group.roles.includes(role),
      role_name: role.name
    })),
  groupsWithDirectMembers: (group) => ({
    ...Projections.groups(group),
    direct_members: group.members.map((member) => member).join(", ")
  }),
  groupsWithMissingMembers: (group) => ({
    ...Projections.groups(group),
    missing_members: group.missingMembers.map((member) => member).join(", ")
  }),
  groupsWithMissingMembersFlat: (group, rawData) =>
    group.missingMembers.map((member) => ({
      ...Projections.groups(group),
      missing_members_count: group.missingMembers.length,
      is_direct_member: group.members.includes(member),
      member_id: member,
      ...userInfo(member, rawData.usersMap)
    })),
  users: (user, rawData) => ({
    ...user
  })
};

const reportTypes = {
  "roles-without-permissions": {
    description: "Role without permissions assigned",
    projection: Projections.roles,
    data: ({ roles }) => roles.filter((role) => role.permissions.length === 0)
  },
  "empty-groups": {
    description: "groups with no members or nested groups",
    projection: Projections.groups,
    data: ({ groups }) =>
      groups.filter((group) => group.members.length === 0 && group.nested.length === 0)
  },
  "groups-without-roles": {
    description: "groups without roles assigned",
    projection: Projections.groups,
    data: ({ groups }) =>
      groups.filter(
        (group) =>
          group.allRoles.length === 0 &&
          group.nested.length === 0 &&
          !groups.some((parentGroup) => parentGroup.nested.includes(group._id))
      )
  },
  permissions: {
    description: "All permissions",
    projection: Projections.permissions,
    data: ({ permissions }) => permissions
  },
  roles: {
    description: "All roles",
    projection: Projections.rolesWithPermissions,
    flatProjection: Projections.rolesWithPermissionsFlat,
    data: ({ roles }) => roles
  },
  "roles-without-permissions": {
    description: "Roles without permissions associated to them",
    projection: Projections.roles,
    data: ({ roles }) => roles.filter((role) => role.permissions.length === 0)
  },
  groups: {
    description: "All groups",
    projection: Projections.groups,
    data: ({ groups }) => groups
  },
  "groups-and-roles": {
    description: "groups with roles assigned",
    projection: Projections.groupsWithRoles,
    flatProjection: Projections.groupsWithRolesFlat,
    data: ({ groups }, options) =>
      groups.filter(options.groupFilter).filter((group) => group.allRoles.length > 0)
  },
  "groups-and-members": {
    description: "groups with members assigned",
    projection: Projections.groupsWithDirectMembers,
    flatProjection: Projections.groupsWithMembersFlat,
    data: ({ groups }, options) =>
      groups.filter(options.groupFilter).filter((group) => group.allMembers.length > 0)
  },
  users: {
    description: "Users",
    projection: Projections.users,
    data: ({ users }) => users
  },
  "groups-with-users-not-found": {
    description: "Users that are part of groups but are not found in the user exports data",
    projection: Projections.groupsWithMissingMembers,
    flatProjection: Projections.groupsWithMissingMembersFlat,
    data: ({ groups, usersMap }, options) =>
      groups
        .filter(options.groupFilter)
        .map((group) => ({
          ...group,
          missingMembers: group.allMembers.filter((member_id) => !usersMap[member_id])
        }))
        .filter((group) => group.missingMembers.length > 0)
  }
};

export const reportTypesList = Object.keys(reportTypes);

export async function generateReport(reportType, options = {}) {
  const rawData = await initializeData();
  const flat = options.flat;
  const report = reportTypes[reportType];

  options.groupFilter = (group) => !options.group || group.name === options.group;
  const data = report.data(rawData, options);
  if (data.length === 0) {
    logger.warning("(empty result)");
    return;
  }
  const projection =
    flat && report.flatProjection
      ? data.flatMap((record) => report.flatProjection(record, rawData))
      : data.map((record) => report.projection(record, rawData));
  if (projection.length === 0) {
    logger.warning("(empty result)");
    return;
  }
  output(report.description, projection);
}
