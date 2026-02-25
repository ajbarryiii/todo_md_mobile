export type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
};

export type GitHubFileResult = {
  content: string;
  sha: string;
};

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export async function fetchTodoFile(config: GitHubConfig): Promise<GitHubFileResult> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}?ref=${config.branch}`;
  const res = await fetch(url, { headers: headers(config.token) });

  if (res.status === 404) {
    return { content: '', sha: '' };
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const content = atob(data.content.replace(/\n/g, ''));
  return { content, sha: data.sha };
}

export async function pushTodoFile(
  config: GitHubConfig,
  content: string,
  sha: string | null,
  message = 'Update todo.md',
): Promise<string> {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;

  const body: Record<string, string> = {
    message,
    content: btoa(content),
    branch: config.branch,
  };

  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(config.token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.content.sha;
}

export async function testConnection(
  config: GitHubConfig,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}`;
    const res = await fetch(url, { headers: headers(config.token) });

    if (!res.ok) {
      return { ok: false, error: `GitHub API error: ${res.status} ${res.statusText}` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
