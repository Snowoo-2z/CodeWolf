// CodeWolf Real GitHub Sync & Private Repo Pushing

export async function pushToGitHub(filesObject, repoName = "codewolf-project") {
  const token = localStorage.getItem('codewolf_github_token');
  if (!token) {
    throw new Error("GitHub Personal Access Token (PAT) not found. Please configure it in settings.");
  }

  // 1. Get authenticated user info
  const userRes = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!userRes.ok) throw new Error("Invalid GitHub Token or unauthorized.");
  const userData = await userRes.json();
  const owner = userData.login;

  // 2. Check or create private repo
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (repoRes.status === 404) {
    // Create private repo
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: repoName,
        private: true,
        description: "Created automatically via CodeWolf AI Agent Studio"
      })
    });
    if (!createRes.ok) throw new Error("Failed to create private GitHub repository.");
  }

  // 3. Commit/Push each file
  for (const [path, content] of Object.entries(filesObject)) {
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    // Check if file already exists to get SHA
    let sha = undefined;
    const fileCheck = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (fileCheck.ok) {
      const fileData = await fileCheck.json();
      sha = fileData.sha;
    }

    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `CodeWolf Agent Sync: update ${path}`,
        content: encodedContent,
        sha: sha
      })
    });

    if (!commitRes.ok) {
      console.warn(`Failed to push file ${path}`);
    }
  }

  return `https://github.com/${owner}/${repoName}`;
}
