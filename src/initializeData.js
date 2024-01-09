import {
  APPLICATIONS_FILENAME,
  AUTHORIZATION_EXTENSION_EXPORT_FILENAME,
  USERS_FIlENAME
} from "./constants.js";
import { readFromFile, readUsersFromNDJson } from "./fileDataSource.js";
import { augmentData, sortData } from "./utils.js";

export async function initializeData() {
  const rawData = await readFromFile(AUTHORIZATION_EXTENSION_EXPORT_FILENAME);
  const users = await readUsersFromNDJson(USERS_FIlENAME);
  rawData.users = users;
  const applications = await readFromFile(APPLICATIONS_FILENAME);
  rawData.applications = applications;

  sortData(rawData);
  augmentData(rawData);
  return rawData;
}
