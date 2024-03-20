# Authorization Extension tools

This CLI program takes data from the Authorization Extension (groups, roles, permissions), combines it with data obtained from the tenant (users, applications) and generates different reports based on the data.

## Prerequisites

1. **NodeJS**. Get the LTS version from https://nodejs.org/en/download

## Setup

1. Clone the repository to a local folder using `git` or download a copy directly from GitHub.
```
git clone https://github.com/nicosabena/authorization-extension-tool
```
2. Install the required packages:
```
cd authorization-extension-tool
npm install
```
3. Make the tool (a CLI named `ae-tool`) accessible globally:
```
npm install -g
```

4. The command line tool can now be accessed using `ae-tool`. E.g. to obtain help:

```
ae-tool help
```

## Download data from the tenant
The tool relies on data exported from the tenant that has the Authorization Extension installed to analyze it. To obtain this data automatically:

1. Create a M2M application in the tenant where the Authorization Extension is installed, and assign permissions for:
   1. Auth0 Management API: authorize the scopes `read:users` and `read:applications` so that the code can read users and applications.
   2. `auth0-authorization-extension-api`: authorize the scope `read:configuration` so that the code can read the full configuration for the Authorization Extension, and `update:groups` if you want to delete inactive groups.

2. In a working folder (e.g. `~/ae-tool-working-folder/{tenant}) create a `.env` file (using `.env.example` as a template) and configure the all the values.
   For `CLIENT_ID` and `CLIENT_SECRET`, use the values for the application created in step #1.

To download the data from the tenant into the working folder:

```
ae-tool download
```

The download will generate three files:
- `users.ndjson`
- `authorization_extension.json`
- `applications.json`

These three files will be the input to generate the reports

## Generating reports

To generate a report, type:

```
ae-tool report <report-name> [--flat] [--group <group-name>] [--json]
```

where `<report-name>` can be one of the following:

- `roles-without-permissions`: provides a list of roles that have no permissions associated.
- `empty-groups`: provides a list of groups that have no members and no nested groups.
- `groups-without-roles`: provides a list of groups that don't have a any roles assigned, either directly or through nested groups
- `permissions`: provides a list of permissions
- `roles`: a list of all roles in the system, with permissions for each (*)
- `groups`: a list of groups in the system
- `groups-and-roles`: a list of groups, with roles assigned to them (*)
- `groups-and-members`: a list of groups with all the members in it (*)
- `users`: a list of users in the system
- `groups-with-users-not-found`: a list of groups with users that are not present in the users export.
- `groups-with-inactive-members`: a list of groups with users that have not logged in since the `--cutoff` date. 
  The `--cutoff` option needs to be provided in the `yyyy-mm-dd` format.
- `groups-and-emails`: a list of user emails in the group. Use combined with `--group` to specify the group name to filter. 

> (*) For reports where there's a one-to-many relationship (e.g. "roles" lists permissions for each role) use `--flat` to 
> generate one row per combination.


You can get a list of report types by typing:

```
ae-tool report --help
```

Since all reports are in `.csv` format, it will usually make sense to send the output to a `.csv` file:

```
ae-tool report users > users.csv
ae-tool report empty-groups > empty-groups.csv
ae-tool report groups > groups.csv
ae-tool report roles --flat >roles-and-permissions-flat.csv
ae-tool report roles > roles-and-permissions.csv
ae-tool report roles-without-permissions > roles-without-permissions.csv
ae-tool report groups > groups.csv
ae-tool report groups-and-members --flat >groups-and-members.csv
ae-tool report groups-with-users-not-found --flat >groups-with-users-not-found.csv
ae-tool report groups-and-roles --flat >groups-and-roles-flat.csv
ae-tool report groups-and-roles >groups-and-roles.csv
ae-tool report permissions >permissions.csv
ae-tool report groups-with-inactive-members --flat --cutoff 2023-10-01 >groups-with-inactive-members-since-2023-10-01-flat.csv
ae-tool report nested-groups --flat >nested-groups-flat.csv
ae-tool report groups-and-emails --group "My user group"

```

# Other commands

## Copy group members

Copy all group members from one group to another:

```
ae-tool copy-group-members <source-group> <target-group> [--confirm]
```

If your group name has spaces, use double quotes. E.g.:

```
ae-tool copy-group-members "my source group" "my target group"
```

`--yes` skips the confirmation prompt.


