import { Request, Response } from "express";
import Docker from "dockerode";
import { CodeGenerationRequest } from "./types";
import { exec } from "child_process";
import path from "path";

function generateCode(req: Request, res: Response) {
  const { resourceId, buildId } = req.body as CodeGenerationRequest;

  const imageName = "amplication/data-service-generator";
  const containerName = `dsg-controller-${buildId}`;

  // const {
  //   DSG_JOBS_BASE_FOLDER: dsgJogsBaseFolder,
  //   BUILD_VOLUME_PATH: dockerDsgFolder,
  //   BUILD_OUTPUT_PATH: buildOutputPath,
  //   BUILD_SPEC_PATH: buildSpecPath,
  //   BUILD_MANAGER_URL: buildMangerUrl,
  //   AUTOREMOVE_CONTAINER: ,
  // } = process.env;

  const dsgJogsBaseFolder = ".amplication/dsg-jobs";
  const dockerDsgFolder = "/dsg-job";
  const buildOutputPath = "/dsg-job/code";
  const buildSpecPath = "/dsg-job/input.json";
  const buildMangerUrl = "http://localhost:5010";
  const autoRemove = "true";

  const hostMachineDsgFolder = `${process.cwd()}/${dsgJogsBaseFolder}/${buildId}`;
  console.log(`hostMachineDsgFolder is ${hostMachineDsgFolder}`);

  // const buildPath = "../../../../.amplication/dsg-jobs";
  const buildPath = ".amplication/dsg-jobs";
  // const buildPath = path.resolve(__dirname,'.amplication/dsg-jobs')
  console.log(`buildPath is ${buildPath}`);
  // const command = `BUILD_MANAGER_URL=${buildMangerUrl} BUILD_ID=${buildId} RESOURCE_ID=${resourceId} BUILD_OUTPUT_PATH=${buildPath}/${buildId}/code  BUILD_SPEC_PATH=${buildPath}/${buildId}/input.json npx ts-node -P ../../../data-service-generator/tsconfig.app.json -r tsconfig-paths/register ../../../data-service-generator/src/main.ts`;
  const command = `BUILD_MANAGER_URL=${buildMangerUrl} BUILD_ID=${buildId} RESOURCE_ID=${resourceId} BUILD_OUTPUT_PATH=${buildPath}/${buildId}/code  BUILD_SPEC_PATH=${buildPath}/${buildId}/input.json npx ts-node -P ./packages/data-service-generator/tsconfig.app.json -r tsconfig-paths/register ./packages/data-service-generator/src/main.ts`;
  try {
    console.log(`running cmd ${command}`);
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.log(`Cound not execute ${command} due to ${err.message}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });
    console.log("command executed");
  } catch (err) {
    console.log(`Error while running exec ${err}`);
  }

  // docker
  //   .createContainer({
  //     Image: imageName,
  //     name: containerName,
  //     HostConfig: {
  //       Binds: [`${hostMachineDsgFolder}:${dockerDsgFolder}`],
  //       // AutoRemove: Boolean(autoRemove === "true"),
  //       AutoRemove: false,
  //     },
  //     Cmd: ["node", "./dist/src/main.js"],
  //     Env: [
  //       `BUILD_OUTPUT_PATH=${buildOutputPath}`,
  //       `BUILD_ID=${buildId}`,
  //       `RESOURCE_ID=${resourceId}`,
  //       `BUILD_SPEC_PATH=${buildSpecPath}`,
  //       `BUILD_MANAGER_URL=${buildMangerUrl}`,
  //       "REMOTE_ENV=true",
  //     ],
  //   })
  //   .then((container: Docker.Container) => {
  //     console.log(`***********Container to spin`);
  //     container.start();
  //     container.inspect().then(data => console.log(`Inside docker container inspecting ${JSON.stringify(data)}`))
  //     console.log(`Container spinned***********`);
  //   })
  //   .catch((err: Error) =>
  //     console.log(`Error while spinning container ${err}`)
  //   );

  res.send({
    message: `container: ${containerName}, buildId: ${buildId}, resourceId: ${resourceId}`,
  });
}

export { generateCode };
