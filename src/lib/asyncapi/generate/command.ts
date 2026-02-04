import { Command } from "@commander-js/extra-typings";
import { fromTemplateCommand } from "./from-template.js";

export const generateCommand = new Command("generate")
  .description("Generate code or documentation from AsyncAPI documents")
  .addCommand(fromTemplateCommand);
