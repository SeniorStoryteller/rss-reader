import type { NextApiRequest, NextApiResponse } from 'next';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface GitResponse {
  success: boolean;
  hash?: string;
  message?: string;
  error?: string;
}

async function run(cmd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(cmd, args, { cwd: process.cwd() });
  return stdout.trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GitResponse>
) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Not available in production' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Stage feeds.public.json
    await run('git', ['add', 'feeds.public.json']);

    // Build commit message from diff --name-only to detect added/removed entries
    const diffStat = await run('git', ['diff', '--cached', '--stat', 'feeds.public.json']);
    const message = diffStat ? 'Update feeds via admin UI' : 'Update feeds';

    // Commit
    await run('git', ['commit', '-m', message]);

    // Get commit hash
    const hash = await run('git', ['rev-parse', '--short', 'HEAD']);

    // Push to current branch
    const branch = await run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    await run('git', ['push', 'origin', branch]);

    return res.status(200).json({ success: true, hash, message });
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    const errorMessage = err.stderr ?? err.message ?? 'Unknown git error';
    return res.status(500).json({ success: false, error: errorMessage });
  }
}
