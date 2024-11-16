import { execSync } from 'child_process';
import fs from 'fs';
import fsp from 'fs/promises';

import env from './utils/env.js';
import { getAuth, clearAuth } from './utils/get-auth.js';
import killToken from './utils/kill-token.js';
import { eulas, locales } from './resources/eulas.js';
import getEula from './utils/get-eula.js';

const outputFolder = 'output';
const eulasFolder = `${outputFolder}/eulas`;

const main = async () => {
  if (!fs.existsSync(eulasFolder)) {
    await fsp.mkdir(eulasFolder, { recursive: true });
  }

  const auth = await getAuth();
  const changes: string[] = [];

  for (let i = 0; i < eulas.length; i += 1) {
    const eulaKey = eulas[i];
    const eulaBasePath = `${eulasFolder}/${eulaKey}`;

    if (!fs.existsSync(eulaBasePath)) {
      await fsp.mkdir(eulaBasePath, { recursive: true });
    }

    for (let j = 0; j < locales.length; j += 1) {
      const locale = locales[j];
      const eulaResult = await getEula(auth, eulaKey, locale);

      if (!eulaResult.success) {
        continue;
      }

      const eula = eulaResult.data;
      const eulaPath = `${eulaBasePath}/${locale}`;

      let md = `# ${eula.title || eulaKey}\n\n`;

      if (eula.description) {
        md += `> ${eula.description}\n\n`;
      }

      md += '| Key | Value |\n';
      md += '| --- | ----- |\n';

      Object.entries(eula).forEach(([key, value]) => {
        if (key !== 'body') {
          md += `| \`${key}\` | \`${value}\` |\n`;
        }
      });

      await fsp.writeFile(`${eulaPath}.md`, md);
      await fsp.writeFile(`${eulaPath}.txt`, eula.body);
    }

    const gitStatus = execSync(`git status ${eulaBasePath}/*`)?.toString('utf-8') || '';

    if (gitStatus.includes(eulaBasePath)) {
      changes.push(eulaKey);
    }
  }

  await killToken(auth);
  clearAuth();

  if (!changes.length) {
    return;
  }

  const commitMessage = `Modified ${changes.join(', ')}`;

  console.log(commitMessage);

  if (env.GIT_DO_NOT_COMMIT?.toLowerCase() === 'true') {
    return;
  }

  execSync('git add output');
  execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"');
  execSync('git config user.name "github-actions[bot]"');
  execSync('git config commit.gpgsign false');
  execSync(`git commit -m "${commitMessage}"`);

  if (env.GIT_DO_NOT_PUSH?.toLowerCase() === 'true') {
    return;
  }

  execSync('git push');
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
