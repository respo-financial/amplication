import { Request, Response } from "express";
import Docker from "dockerode";
import { CodeGenerationRequest } from "./types";

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
  const buildMangerUrl = "http://host.docker.internal:5010";
  const autoRemove = "true";

  const hostMachineDsgFolder = `${process.cwd()}/${dsgJogsBaseFolder}/${buildId}`;
  console.log(`hostMachineDsgFolder is ${hostMachineDsgFolder}`);
  const docker = new Docker();

  docker
    .createContainer({
      Image: imageName,
      name: containerName,
      HostConfig: {
        Binds: [`${hostMachineDsgFolder}:${dockerDsgFolder}`],
        // AutoRemove: Boolean(autoRemove === "true"),
        AutoRemove: false,
      },
      Cmd: ["node", "./src/main.js"],
      Env: [
        `BUILD_OUTPUT_PATH=${buildOutputPath}`,
        `BUILD_ID=${buildId}`,
        `RESOURCE_ID=${resourceId}`,
        `BUILD_SPEC_PATH=${buildSpecPath}`,
        `BUILD_MANAGER_URL=${buildMangerUrl}`,
        "REMOTE_ENV=true",
      ],
    })
    .then((container: Docker.Container) => {
      console.log(`***********Container to spin`);
      container.start();
      console.log(`Container spinned***********`);
    })
    .catch((err: Error) =>
      console.log(`Error while spinning container ${err}`)
    );

  res.send({
    message: `container: ${containerName}, buildId: ${buildId}, resourceId: ${resourceId}`,
  });
}

export { generateCode };
