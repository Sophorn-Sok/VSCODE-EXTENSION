import { exec } from 'child_process';
import { CommandRunner } from './types';

/**
 * Runs a shell command and always resolves with whatever stdout/stderr it
 * produced — never rejects on a non-zero exit code. This matters because
 * both `npm outdated` and `npm audit` exit non-zero precisely when they have
 * useful JSON to report (outdated packages / vulnerabilities found), which is
 * the normal case, not a failure.
 */
export const defaultCommandRunner: CommandRunner = (command, cwd) =>
  new Promise((resolve) => {
    exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (_error, stdout, stderr) => {
      resolve({ stdout: stdout?.toString() ?? '', stderr: stderr?.toString() ?? '' });
    });
  });
