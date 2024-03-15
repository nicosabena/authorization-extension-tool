#! /usr/bin/env node
import { program, Command, Argument } from "commander";
import { reportTypesList, generateReport } from "./src/reports.js";
import { getRemoteData } from "./src/remoteDataDownload.js";
import { removeInactiveGroupMembers } from "./src/removeInactiveGroupMembers.js";
import { copyGroupMembers } from "./src/copyGroupMembers.js";
import { readAndValidateConfig } from "./src/config.js";

readAndValidateConfig();

program
  .showHelpAfterError()
  .addCommand(
    new Command("report")
      .addArgument(
        new Argument("<report-type>", "The type of report to generate").choices(reportTypesList)
      )
      .description("Generates a report based on available data")
      .option("--flat", "Flattens results for one-to-many relationships")
      .option("--group <group-name>", "Optionally filter results to one specific group")
      .option("--cutoff <yyyy-mm-dd>", "Cutoff date for inactive users")
      .action(generateReport)
  )
  .addCommand(
    new Command("download")
      .description(
        "Downloads users, applications and Authorization Extension data for further processing"
      )
      .action(getRemoteData)
  )
  .addCommand(
    new Command("remove-inactive-group-members")
      .description("Removes all group members that have not log in since the cutoff date")
      .action(removeInactiveGroupMembers)
      .requiredOption("--cutoff <yyyy-mm-dd>", "Cutoff date for inactive users")
      .option("--group <group-name>", "Optionally filter results to one specific group")
  )
  .addCommand(
    new Command("copy-group-members")
      .description("Copies all direct members from a source group to a target group")
      .action(copyGroupMembers)
      .argument("<source-group>", "The source group name or id")
      .argument("<target-group>", "The target group name or id")
      .option("-y, --yes", "Skips confirmation prompt", false)
  );
program.parseAsync();
