export const PROFILE_QUERY = /* GraphQL */ `
  query FetchGitHubUserProfile(
    $userName: String!
    $repoCount: Int = 10
    $starCount: Int = 50
  ) {
    rateLimit {
      limit
      cost
      remaining
    }
    user(login: $userName) {
      login
      name
      bio
      company
      location
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(
        first: $repoCount
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        totalCount
        nodes {
          name
          description
          stargazerCount
          forkCount
          languages(first: 5) {
            nodes {
              name
            }
          }
          repositoryTopics(first: 5) {
            nodes {
              topic {
                name
              }
            }
          }
          isArchived
          pushedAt
        }
      }
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            name
            description
            stargazerCount
            languages(first: 3) {
              nodes {
                name
              }
            }
          }
        }
      }
      starredRepositories(
        first: $starCount
        orderBy: { field: STARRED_AT, direction: DESC }
      ) {
        nodes {
          name
          owner {
            login
          }
          stargazerCount
          languages(first: 3) {
            nodes {
              name
            }
          }
          repositoryTopics(first: 3) {
            nodes {
              topic {
                name
              }
            }
          }
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

export const LOGIN_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
