import { DSGResourceData, Module } from "@amplication/code-gen-types";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { createDataService } from "./create-data-service";
import { dynamicPackagesInstallations } from "./dynamic-package-installation";
import { defaultLogger } from "./server/logging";
import { httpClient } from "./utils/http-client";
import { prepareDefaultPlugins } from "./utils/dynamic-installation/defaultPlugins";

export const AMPLICATION_MODULES = "amplication_modules";
const buildSpecPath = process.env.BUILD_SPEC_PATH;
const buildOutputPath = process.env.BUILD_OUTPUT_PATH;

if (!buildSpecPath) {
  throw new Error("SOURCE is not defined");
}
if (!buildOutputPath) {
  throw new Error("DESTINATION is not defined");
}

generateCode(buildSpecPath, buildOutputPath).catch((err) => {
  console.error(err);
  process.exit(1);
});

async function readInputJson(filePath: string): Promise<DSGResourceData> {
  const file = await readFile(filePath, "utf8");
  const resourceData: DSGResourceData = JSON.parse(file);
  return resourceData;
}
export default async function generateCode(
  source: string,
  destination: string
): Promise<void> {
  try {
    console.log(`Generate Code Called ^^^^^^^^^^^^^^`);
    const resourceData = await readInputJson(source);
    const { pluginInstallations } = resourceData;

    const allPlugins = prepareDefaultPlugins(pluginInstallations);

    await dynamicPackagesInstallations(allPlugins, defaultLogger);

    const modules = await createDataService(
      { ...resourceData, pluginInstallations: allPlugins },
      defaultLogger,
      join(__dirname, "..", AMPLICATION_MODULES)
    );

    await writeModules(modules, destination);
    console.log("Code generation completed successfully");
    await httpClient.post(
      new URL(
        "build-runner/code-generation-success",
        process.env.BUILD_MANAGER_URL
      ).href,
      {
        resourceId: process.env.RESOURCE_ID,
        buildId: process.env.BUILD_ID,
      }
    );
  } catch (err) {
    console.error(err);
    console.log(`code generation failure ^^^^^^^^^^^^^^`);
    await httpClient.post(
      new URL(
        "build-runner/code-generation-failure",
        process.env.BUILD_MANAGER_URL
      ).href,
      {
        resourceId: process.env.RESOURCE_ID,
        buildId: process.env.BUILD_ID,
      }
    );
  }
}

async function writeModules(
  modules: Module[],
  destination: string
): Promise<void> {
  console.log("Creating base directory");
  await mkdir(destination, { recursive: true });
  console.info(`Writing modules to ${destination} ...`);
  await Promise.all(
    modules.map(async (module) => {
      const filePath = join(destination, module.path);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, module.code);
    })
  );
  console.info(`Successfully wrote modules to ${destination}`);
}
