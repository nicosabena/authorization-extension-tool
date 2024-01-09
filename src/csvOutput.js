import { mkConfig, generateCsv, asString } from "export-to-csv";

const csvConfig = mkConfig({
  fieldSeparator: ",",
  quoteStrings: '"',
  decimalSeparator: ".",
  showLabels: true,
  showTitle: false,
  useTextFile: false,
  useBom: true,
  useKeysAsHeaders: true
  // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
});

export async function outputCsv(title, data) {
  const csv = generateCsv(csvConfig)(data);

  const date = new Date().toISOString().substr(0, 10);
  const filename = `./exports/${title}-${date}.csv`;

  console.log(asString(csv));
  //const csvBuffer = new Uint8Array(Buffer.from(asString(csv)));
  //fs.writeFileSync(filename, csvBuffer);
}
