#! /usr/bin/env node
import { program, Command, Argument } from "commander";
import { reportTypesList, generateReport } from "./src/reports.js";
import { getRemoteData } from "./src/remoteDataDownload.js";

program
  .addCommand(
    new Command("report")
      .addArgument(
        new Argument("<report-type>", "The type of report to generate").choices(reportTypesList)
      )
      .description("Generates a report based on available data")
      .option("--flat", "Flattens results for one-to-many relationships")
      .option("--group <group-name>", "Optionally filter results to one specific group")
      .action(generateReport)
  )
  .addCommand(
    new Command("download")
      .description(
        "Downloads users, applications and Authorization Extension data for further processing"
      )
      .action(getRemoteData)
  );
program.parseAsync();
