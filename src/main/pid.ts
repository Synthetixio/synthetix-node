import { exec, execSync } from 'child_process';

export function findPid(processes: string, search: string): number | undefined {
  const ipfsProcess = processes
    .split('\n')
    .find((line) => line.includes(search) && !line.includes('grep'));
  if (ipfsProcess) {
    const [pid] = ipfsProcess.split(' ');
    return parseInt(pid, 10);
  }
}

export function getPidSync(search: string): number | undefined {
  try {
    const processes = execSync(`ps -ax | grep "${search}"`, {
      encoding: 'utf8',
    });
    return findPid(processes, search);
  } catch (_e) {
    // whatever
  }
}

function execCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message} (${stderr})`;
        reject(error);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function getPid(search: string): Promise<number | undefined> {
  try {
    const processes = await execCommand(`ps -ax | grep "${search}"`);
    return findPid(processes, search);
  } catch (_e) {
    // whatever
  }
}
