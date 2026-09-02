import { execSync } from 'node:child_process';

export default function setup(): void {
  execSync('tsc -p tsconfig.build.json', { stdio: 'inherit' });
}
