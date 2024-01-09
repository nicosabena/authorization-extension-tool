import fs from "fs";
import NDJson from "ndjson";

export async function readFromFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, {}));
  return data;
}

export function readUsersFromNDJson(filePath) {
  return new Promise((resolve, reject) => {
    const usersArray = [];
    fs.createReadStream(filePath)
      .pipe(NDJson.parse())
      .on("data", function (obj) {
        usersArray.push(obj);
      })
      .on("end", function () {
        resolve(usersArray);
      })
      .on("error", function (err) {
        reject(err);
      });
  });
}
