# Assignment Deliverable — ToDo App Feature Release

This file contains the steps, commands, and placeholders required to complete the assignment deliverables.

## Implemented features (local)
- Task descriptions + metadata (UI + backend)
- Search tasks with server-side pagination
- Filters & sorting support added to `GET /api/tasks` and `/api/tasks/search`

## Branching & PRs (commands)

Create branches locally and push to GitHub:

```bash
# create dev branch
git checkout main
git pull origin main
git checkout -b dev
git push -u origin dev

# feature branches from dev
git checkout -b feature/task-descriptions dev
git add .
git commit -m "feat(task-descriptions): add description and metadata UI"
git push -u origin feature/task-descriptions

git checkout dev
git checkout -b feature/search dev
git add .
git commit -m "feat(search): add pagination and server-side search"
git push -u origin feature/search

git checkout dev
git checkout -b feature/filters-sorting dev
git add .
git commit -m "feat(filters-sorting): server-side filters and sorting"
git push -u origin feature/filters-sorting
```

Open Pull Requests on GitHub from each feature → `dev`, review and merge. Then open PR `dev` → `main` and merge.

## Release & Docker (commands)

Replace `<dockerhub_user>` with your Docker Hub username.

```bash
# On main after merging
git checkout main
git pull origin main

# Create Git tag
git tag -a v0.1.0 -m "Release v0.1.0: task descriptions, search, filters+sorting"
git push origin v0.1.0

# Build and push Docker image
docker build -t <dockerhub_user>/todo-saas:0.1.0 .
docker login
docker push <dockerhub_user>/todo-saas:0.1.0
docker tag <dockerhub_user>/todo-saas:0.1.0 <dockerhub_user>/todo-saas:latest
docker push <dockerhub_user>/todo-saas:latest
```

## Submission checklist (fill in the links/screenshots)

- Branch listing (screenshot or `git branch -a` output):
- PR links (feature → dev):
  - feature/task-descriptions: <PR_LINK>
  - feature/search: <PR_LINK>
  - feature/filters-sorting: <PR_LINK>
- PR link (dev → main): <PR_LINK>
- DockerHub repo screenshot URL: <DOCKERHUB_REPO_URL>
- GitHub Release: <RELEASE_LINK>

## Short reflection (required)

Write 3-5 sentences about what you learned regarding branching, merging, and versioned releases.
