const assert = require('assert');
const http = require('http');
const { app } = require('./src/server');
const { pool, testConnection } = require('./src/db');
const { calculateMatch } = require('./src/matcher');

function makeRequest(server, path) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port: addr.port,
        path: path
      },
      res => {
        let body = '';
        res.on('data', chunk => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ status: res.statusCode, data });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
  });
}

async function runTests() {
  console.log('--- RUNNING RECRUITER BOT TEST SUITE ---');

  // Test 1: Matcher unit tests
  console.log('1. Testing matcher deterministic calculations...');
  {
    const cand = {
      skills: ['deduction', 'pattern-recognition', 'forensics'],
      experience_years: 8,
      availability: 'Immediate'
    };
    const job = {
      required_skills: ['deduction', 'pattern-recognition', 'forensics'],
      min_experience: 3
    };
    const match = calculateMatch(cand, job);
    assert.strictEqual(match.score, 100.0, 'Perfect match should score 100');
    assert.strictEqual(match.breakdown.skill_coverage, 100);
    assert.strictEqual(match.breakdown.experience_fit, 100);
    assert.strictEqual(match.breakdown.availability_score, 100);
    assert(match.reason.includes('Matched 3/3'));
  }

  {
    // Candidate with 0 skill match, 2 yrs exp against 4 yrs req (50%), 'Not looking' (0 pts)
    // Skill: 0% * 0.6 = 0
    // Exp: 50% * 0.3 = 15
    // Avail: 0 * 0.1 = 0
    // Total = 15.00
    const cand = {
      skills: ['woodworking'],
      experience_years: 2,
      availability: 'Not looking'
    };
    const job = {
      required_skills: ['deduction', 'pattern-recognition'],
      min_experience: 4
    };
    const match = calculateMatch(cand, job);
    assert.strictEqual(match.score, 15.0, 'Expected score 15.0');
    assert.strictEqual(match.breakdown.experience_fit, 50);
  }

  {
    // Test min_experience = 0 edge case
    const cand = {
      skills: ['sales'],
      experience_years: 1,
      availability: '2 weeks'
    };
    const job = {
      required_skills: ['sales'],
      min_experience: 0
    };
    const match = calculateMatch(cand, job);
    // Skill: 100 * 0.6 = 60
    // Exp: 100 * 0.3 = 30
    // Avail: 60 * 0.1 = 6
    // Total = 96.00
    assert.strictEqual(match.score, 96.0);
  }
  console.log('   Matcher unit tests passed.');

  // Test 2: Database integrity check
  console.log('2. Checking database contents in MySQL...');
  await testConnection();
  const [candidates] = await pool.query('SELECT COUNT(*) as count FROM candidates');
  const [jobs] = await pool.query('SELECT COUNT(*) as count FROM jobs');
  assert.strictEqual(Number(candidates[0].count), 15, 'Must have exactly 15 candidates');
  assert.strictEqual(Number(jobs[0].count), 6, 'Must have exactly 6 jobs');
  console.log(`   Database verified: ${candidates[0].count} candidates, ${jobs[0].count} jobs.`);

  // Test 3: HTTP API Integration Tests
  console.log('3. Running HTTP server integration checks...');
  const server = app.listen(0);

  try {
    // 3a. GET /jobs/1/matches
    const resJob1 = await makeRequest(server, '/jobs/1/matches');
    assert.strictEqual(resJob1.status, 200);
    assert.strictEqual(resJob1.data.job.title, 'Backend Detective');
    assert.strictEqual(resJob1.data.matches.length, 15);
    // Sherlock Holmes should be top match
    const topCandidate = resJob1.data.matches[0];
    assert.strictEqual(topCandidate.candidate_name, 'Sherlock H.');
    assert.strictEqual(topCandidate.score, 100);
    console.log(`   Job 1 matches verified. Top match: ${topCandidate.candidate_name} (${topCandidate.score} pts).`);

    // 3b. GET /candidates/1/matches
    const resCand1 = await makeRequest(server, '/candidates/1/matches');
    assert.strictEqual(resCand1.status, 200);
    assert.strictEqual(resCand1.data.candidate.name, 'Sherlock H.');
    assert.strictEqual(resCand1.data.matches.length, 6);
    const topJob = resCand1.data.matches[0];
    assert.strictEqual(topJob.job_title, 'Backend Detective');
    assert.strictEqual(topJob.score, 100);
    console.log(`   Candidate 1 matches verified. Top job: ${topJob.job_title} (${topJob.score} pts).`);

    // 3c. Invalid ID -> 400
    const resInvalidJob = await makeRequest(server, '/jobs/abc/matches');
    assert.strictEqual(resInvalidJob.status, 400, 'Invalid string ID should return 400');
    const resNegativeId = await makeRequest(server, '/candidates/-5/matches');
    assert.strictEqual(resNegativeId.status, 400, 'Negative ID should return 400');
    console.log('   Invalid ID returns HTTP 400 verified.');

    // 3d. Non-existent ID -> 404
    const resMissingJob = await makeRequest(server, '/jobs/999/matches');
    assert.strictEqual(resMissingJob.status, 404, 'Non-existent job ID should return 404');
    const resMissingCand = await makeRequest(server, '/candidates/999/matches');
    assert.strictEqual(resMissingCand.status, 404, 'Non-existent candidate ID should return 404');
    console.log('   Non-existent ID returns HTTP 404 verified.');

    console.log('--- ALL INTEGRATION & UNIT CHECKS PASSED SUCCESSFULLY ---');
  } finally {
    server.close();
    await pool.end();
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
