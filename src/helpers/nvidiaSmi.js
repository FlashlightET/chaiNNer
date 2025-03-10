// Borrowed and modified from https://github.com/sebhildebrandt/systeminformation/blob/master/lib/graphics.js

// TODO: Convert this to a useNvidiaSmi hook
// Could auto-check gpu before letting you run whatever command?

// Actually, should probably get the nvidia-smi path in the main process and use ipc to grab it.
// either that, or call this from the global state and pass the path/keyword into the hook.
// If getting in main, do it during splash screen dep check.
// Then in stuff like the dependency manager i can just use ipc to get the gpu name and isNvidia

import fs from 'fs';
import os from 'os';

let nvidiaSmiPath;

// Best approximation of what drive windows is installed on
const homePath = os.homedir();
const WINDIR = homePath ? `${homePath.charAt(0)}:\\Windows` : 'C:\\Windows';

export const getNvidiaSmi = () => {
  if (nvidiaSmiPath) {
    return nvidiaSmiPath;
  }

  if (os.platform() === 'win32') {
    try {
      const basePath = `${WINDIR}\\System32\\DriverStore\\FileRepository`;
      // find all directories that have an nvidia-smi.exe file
      const candidateDirs = fs.readdirSync(basePath).filter((dir) => fs.readdirSync([basePath, dir].join('/')).includes('nvidia-smi.exe'));
      // use the directory with the most recently created nvidia-smi.exe file
      const targetDir = candidateDirs.reduce((prevDir, currentDir) => {
        const previousNvidiaSmi = fs.statSync([basePath, prevDir, 'nvidia-smi.exe'].join('/'));
        const currentNvidiaSmi = fs.statSync([basePath, currentDir, 'nvidia-smi.exe'].join('/'));
        return (previousNvidiaSmi.ctimeMs > currentNvidiaSmi.ctimeMs) ? prevDir : currentDir;
      });

      if (targetDir) {
        nvidiaSmiPath = [basePath, targetDir, 'nvidia-smi.exe'].join('/');
      }
    } catch (e) {
      // idk
    }
  } else if (os.platform() === 'linux') {
    nvidiaSmiPath = 'nvidia-smi';
  }
  return nvidiaSmiPath;
};

export const getSmiQuery = (delay) => `-lms ${delay} --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,utilization.memory --format=csv,noheader,nounits`;
