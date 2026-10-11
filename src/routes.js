const express = require('express');
const { pool } = require('./db');
const { calculateMatch } = require('./matcher');

const router = express.Router();

/**
 * Helper to validate integer ID from params
 */
function parsePositiveIntId(paramValue) {
  if (!paramValue || !/^\d+$/.test(paramValue)) {
    return null;
  }
  const id = parseInt(paramValue, 10);
  return id > 0 ? id : null;
}

/**
 * GET /jobs/:id/matches
 * Returns all candidates ranked for a given job opening.
 */
router.get('/jobs/:id/matches', async (req, res, next) => {
  try {
    const jobId = parsePositiveIntId(req.params.id);
    if (!jobId) {
      return res.status(400).json({
        error: 'Invalid job ID. Must be a positive integer.'
      });
    }

    // 1. Fetch Job
    const [jobs] = await pool.query(
      'SELECT id, title, min_experience, culture_keywords, tagline FROM jobs WHERE id = ?',
      [jobId]
    );

    if (jobs.length === 0) {
      return res.status(404).json({
        error: `Job with ID ${jobId} not found.`
      });
    }

    const job = jobs[0];

    // 2. Fetch Job Required Skills
    const [reqSkillRows] = await pool.query(
      'SELECT skill FROM job_required_skills WHERE job_id = ? ORDER BY skill ASC',
      [jobId]
    );
    job.required_skills = reqSkillRows.map(r => r.skill);

    // 3. Fetch all Candidates and their skills
    const [candidates] = await pool.query(
      'SELECT id, name, experience_years, availability, traits, quirk FROM candidates ORDER BY id ASC'
    );

    const [allCandidateSkills] = await pool.query(
      'SELECT candidate_id, skill FROM candidate_skills ORDER BY candidate_id, skill ASC'
    );

    const candidateSkillsMap = {};
    for (const row of allCandidateSkills) {
      if (!candidateSkillsMap[row.candidate_id]) {
        candidateSkillsMap[row.candidate_id] = [];
      }
      candidateSkillsMap[row.candidate_id].push(row.skill);
    }

    // 4. Score all candidates against this job
    const matches = candidates.map(candidate => {
      candidate.skills = candidateSkillsMap[candidate.id] || [];
      const matchResult = calculateMatch(candidate, job);

      return {
        candidate_id: candidate.id,
        candidate_name: candidate.name,
        candidate_experience: candidate.experience_years,
        candidate_availability: candidate.availability,
        score: matchResult.score,
        reason: matchResult.reason,
        breakdown: matchResult.breakdown
      };
    });

    // 5. Sort descending by score, tie-break consistently by candidate_id ascending
    matches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.candidate_id - b.candidate_id;
    });

    return res.json({
      job: {
        id: job.id,
        title: job.title,
        min_experience: job.min_experience,
        tagline: job.tagline,
        culture_keywords: typeof job.culture_keywords === 'string'
          ? JSON.parse(job.culture_keywords)
          : job.culture_keywords,
        required_skills: job.required_skills
      },
      total_matches: matches.length,
      matches
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /candidates/:id/matches
 * Returns all jobs ranked for a given candidate.
 */
router.get('/candidates/:id/matches', async (req, res, next) => {
  try {
    const candidateId = parsePositiveIntId(req.params.id);
    if (!candidateId) {
      return res.status(400).json({
        error: 'Invalid candidate ID. Must be a positive integer.'
      });
    }

    // 1. Fetch Candidate
    const [candidates] = await pool.query(
      'SELECT id, name, experience_years, availability, traits, quirk FROM candidates WHERE id = ?',
      [candidateId]
    );

    if (candidates.length === 0) {
      return res.status(404).json({
        error: `Candidate with ID ${candidateId} not found.`
      });
    }

    const candidate = candidates[0];

    // 2. Fetch Candidate Skills
    const [candSkillRows] = await pool.query(
      'SELECT skill FROM candidate_skills WHERE candidate_id = ? ORDER BY skill ASC',
      [candidateId]
    );
    candidate.skills = candSkillRows.map(r => r.skill);

    // 3. Fetch all Jobs and their required skills
    const [jobs] = await pool.query(
      'SELECT id, title, min_experience, culture_keywords, tagline FROM jobs ORDER BY id ASC'
    );

    const [allJobSkills] = await pool.query(
      'SELECT job_id, skill FROM job_required_skills ORDER BY job_id, skill ASC'
    );

    const jobSkillsMap = {};
    for (const row of allJobSkills) {
      if (!jobSkillsMap[row.job_id]) {
        jobSkillsMap[row.job_id] = [];
      }
      jobSkillsMap[row.job_id].push(row.skill);
    }

    // 4. Score all jobs against this candidate
    const matches = jobs.map(job => {
      job.required_skills = jobSkillsMap[job.id] || [];
      const matchResult = calculateMatch(candidate, job);

      return {
        job_id: job.id,
        job_title: job.title,
        job_min_experience: job.min_experience,
        score: matchResult.score,
        reason: matchResult.reason,
        breakdown: matchResult.breakdown
      };
    });

    // 5. Sort descending by score, tie-break consistently by job_id ascending
    matches.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.job_id - b.job_id;
    });

    return res.json({
      candidate: {
        id: candidate.id,
        name: candidate.name,
        experience_years: candidate.experience_years,
        availability: candidate.availability,
        traits: typeof candidate.traits === 'string'
          ? JSON.parse(candidate.traits)
          : candidate.traits,
        quirk: candidate.quirk,
        skills: candidate.skills
      },
      total_matches: matches.length,
      matches
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
