import fetch from 'node-fetch';

/**
 * Welcome to the Coding Challenge Platform!
 *
 * Instructions:
 * 1. Select an exercise from the dropdown in the main UI
 * 2. Read the problem description in the left panel
 * 3. Write your solution here
 * 4. Click "Run Tests" to validate your solution
 *
 * You have access to node-fetch for making HTTP requests.
 * Use console.log() to debug - it works now!
 */

// Most Active Authors Challenge - Working Solution
async function getUsernames(threshold: number): Promise<string[]> {
  const results: string[] = [];
  let page = 1;
  let totalPages = 1;

  console.log(`Fetching users with submission_count > ${threshold}`);

  while (page <= totalPages) {
    const response = await fetch(`http://localhost/api/article_users?page=${page}`);
    const json: any = await response.json();

    totalPages = json.total_pages;
    console.log(`Processing page ${page}/${totalPages}`);

    // Filter users whose submission_count is strictly greater than threshold
    json.data
      .filter((user: any) => user.submission_count > threshold)
      .forEach((user: any) => {
        results.push(user.username);
      });

    page++;
  }

  console.log(`Found ${results.length} users with submission_count > ${threshold}`);
  return results;
}

// Test your function locally
(async () => {
  try {
    const result = await getUsernames(10);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
})();
