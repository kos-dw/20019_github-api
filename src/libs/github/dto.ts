export type GitHubOwnerDto = {
  login: string;
  avatar_url: string;
};

export type GitHubRepoDto = {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubOwnerDto;
  language: string | null;
  stargazers_count: number;
  subscribers_count: number;
  forks_count: number;
  open_issues_count: number;
};

export type GitHubSearchReposDto = {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepoDto[];
};
