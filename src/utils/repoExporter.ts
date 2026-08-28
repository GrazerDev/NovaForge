import JSZip from 'jszip';
import { CustomTaskState } from '../types';

export async function exportRepositoryZip(task: CustomTaskState): Promise<void> {
  const zip = new JSZip();

  // 1. Workflow file
  zip.file('.github/workflows/discord-bot.yml', task.workflowYaml);

  // 2. Script file
  zip.file(task.scriptFilename, task.scriptCode);

  // 3. Manifest file (package.json or requirements.txt)
  zip.file(task.manifestFilename, task.manifestCode);

  // 4. .env.example
  const envContent = task.requiredSecrets
    .map(s => `${s}=your_${s.toLowerCase()}_here`)
    .join('\n') + '\n';
  zip.file('.env.example', envContent);

  // 5. .gitignore
  const gitignore = `node_modules/
dist/
.env
.DS_Store
*.log
__pycache__/
*.pyc
.venv/
`;
  zip.file('.gitignore', gitignore);

  // 6. Comprehensive README.md
  const secretsList = task.requiredSecrets
    .map(s => `- \`${s}\`: Enter in GitHub Repo -> **Settings** -> **Secrets and variables** -> **Actions**`)
    .join('\n');

  const readmeContent = `# ${task.title}

> Automated Discord Bot & Scheduled Cron Job powered 100% serverlessly by **GitHub Actions**.

## ⏱️ Schedule
- **Cron Expression:** \`${task.cron}\`
- **Execution Environment:** ${task.language.toUpperCase()}
- **Trigger Methods:** Scheduled Cron, GitHub Actions Manual Dispatch (\`workflow_dispatch\`)

## 🔑 Required GitHub Secrets
Before running this workflow, add the following secrets in your GitHub repository (**Settings > Secrets and variables > Actions > New repository secret**):

${secretsList}

## 🚀 How to Deploy in 3 Minutes

1. **Create a GitHub Repository** (Public or Private).
2. **Push these files** to your repository's \`main\` branch:
   \`\`\`bash
   git init
   git add .
   git commit -m "feat: setup discord scheduled bot workflow"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   \`\`\`
3. **Configure Secrets**: Go to **Settings > Secrets and variables > Actions** and add your secrets.
4. **Trigger First Test Run**:
   - Go to the **Actions** tab in your GitHub repository.
   - Click on the workflow name in the left sidebar.
   - Click **Run workflow** -> **Run workflow**.
   - Watch the green checkmark appear and check your Discord server!

## 💡 Keeping Workflows Active
GitHub pauses scheduled workflows on repositories with no commit activity for 60 days. To keep it running forever, occasionally make a commit or use the \`workflow_dispatch\` button.
`;

  zip.file('README.md', readmeContent);

  // Generate blob & trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = task.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  a.download = `discord-github-bot-${safeName || 'workflow'}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
