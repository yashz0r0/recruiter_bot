-- ============================================================================
-- RecruiterFlow Backend Developer Assignment - Part 2: SQL Detective Challenge
-- MySQL 8.0+ Compatible
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SCHEMA DEFINITIONS (Preserved as provided in the assignment specification)
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS interviews;
DROP TABLE IF EXISTS applicants;
DROP TABLE IF EXISTS job_postings;
DROP TABLE IF EXISTS recruiters;

CREATE TABLE recruiters (
  id INT PRIMARY KEY,
  name VARCHAR(100),
  region VARCHAR(50)
);

CREATE TABLE job_postings (
  id INT PRIMARY KEY,
  title VARCHAR(100),
  recruiter_id INT,
  department VARCHAR(50),
  opened_date DATE,
  status VARCHAR(20) -- 'open', 'closed', 'on_hold'
);

CREATE TABLE applicants (
  id INT PRIMARY KEY,
  full_name VARCHAR(100),
  email VARCHAR(100),
  source VARCHAR(50), -- nullable
  applied_date DATE
);

CREATE TABLE interviews (
  id INT PRIMARY KEY,
  applicant_id INT,
  job_posting_id INT,
  stage VARCHAR(20), -- 'Screen', 'Technical', 'Final'
  scheduled_date DATE,
  outcome VARCHAR(20) -- 'passed', 'failed', 'no_show', NULL (pending)
);

-- ----------------------------------------------------------------------------
-- 2. SEED DATA (Exact dataset from assignment specification)
-- ----------------------------------------------------------------------------

INSERT INTO recruiters VALUES
(1, 'Priya Shah', 'APAC'),
(2, 'Daniel Ortiz', 'NA'),
(3, 'Fatima Al-Sayed', 'EMEA'),
(4, 'Wei Zhang', 'APAC'),
(5, 'Grace Okafor', 'EMEA');

INSERT INTO job_postings VALUES
(1, 'Backend Engineer I', 1, 'Engineering', '2026-01-05', 'open'),
(2, 'Backend Engineer I', 2, 'Engineering', '2026-01-10', 'open'),
(3, 'Data Analyst', 3, 'Data', '2026-01-08', 'closed'),
(4, 'Backend Engineer II', 1, 'Engineering', '2026-02-01', 'open'),
(5, 'DevOps Engineer', 4, 'Infrastructure', '2026-01-20', 'open'),
(6, 'Data Analyst', 5, 'Data', '2026-02-05', 'on_hold'),
(7, 'Backend Engineer I', 2, 'Engineering', '2026-02-15', 'closed');

INSERT INTO applicants VALUES
(1, 'Ananya Rao', 'ananya.rao@mail.com', 'LinkedIn', '2026-01-06'),
(2, 'Ananya Rao', 'Ananya.Rao@mail.com', 'Referral', '2026-02-04'),
(3, 'Ben Turner', 'ben.turner@mail.com', 'Job Board', '2026-01-07'),
(4, 'Chloe Martin', 'chloe.martin@mail.com', NULL, '2026-01-09'),
(5, 'Devansh Patel', 'devansh.patel@mail.com', 'LinkedIn', '2026-01-11'),
(6, 'Elena Popescu', 'elena.popescu@mail.com', 'Referral', '2026-01-12'),
(7, 'Farid Haidari', 'farid.haidari@mail.com', 'Job Board', '2026-01-13'),
(8, 'Grace Lin', 'grace.lin@mail.com', 'LinkedIn', '2026-01-15'),
(9, 'Hassan Malik', 'hassan.malik@mail.com', NULL, '2026-01-16'),
(10, 'Isla Fraser', 'isla.fraser@mail.com', 'Referral', '2026-01-18'),
(11, 'Jonas Weber', 'jonas.weber@mail.com', 'Job Board', '2026-02-10');

INSERT INTO interviews VALUES
(1, 1, 1, 'Screen', '2026-01-10', 'passed'),
(2, 1, 1, 'Technical', '2026-01-15', 'passed'),
(3, 1, 1, 'Final', '2026-01-22', 'passed'),
(4, 2, 4, 'Screen', '2026-02-05', 'passed'),
(5, 3, 1, 'Screen', '2026-01-11', 'passed'),
(6, 3, 1, 'Technical', '2026-01-16', 'failed'),
(7, 3, 3, 'Final', '2026-01-28', 'passed'),
(8, 4, 1, 'Screen', '2026-01-12', 'passed'),
(9, 4, 1, 'Final', '2026-01-24', 'failed'),
(10, 5, 2, 'Screen', '2026-01-14', 'passed'),
(11, 5, 2, 'Technical', '2026-01-19', 'passed'),
(12, 5, 2, 'Final', '2026-01-25', 'passed'),
(13, 6, 2, 'Screen', '2026-01-15', 'passed'),
(14, 6, 2, 'Final', '2026-01-26', 'failed'),
(15, 7, 2, 'Screen', '2026-01-16', 'no_show'),
(16, 8, 4, 'Screen', '2026-02-03', 'passed'),
(17, 8, 4, 'Technical', '2026-02-08', 'passed'),
(18, 8, 4, 'Final', '2026-02-12', 'passed'),
(19, 9, 4, 'Screen', '2026-02-04', 'passed'),
(20, 9, 4, 'Final', '2026-02-14', 'passed'),
(21, 10, 5, 'Screen', '2026-01-22', 'passed'),
(22, 10, 5, 'Technical', '2026-01-28', NULL),
(23, 11, 7, 'Final', '2026-02-20', 'passed'),
(24, 6, 7, 'Final', '2026-02-21', 'failed');

-- ============================================================================
-- 3. NUMBERED ANSWER QUERIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Question 1:
-- List all currently open job postings, along with the name of the recruiter
-- who owns each one.
-- ----------------------------------------------------------------------------
SELECT 
    jp.id AS job_posting_id,
    jp.title AS job_title,
    jp.department,
    r.name AS recruiter_name,
    jp.status
FROM job_postings jp
JOIN recruiters r ON jp.recruiter_id = r.id
WHERE jp.status = 'open'
ORDER BY jp.id ASC;


-- ----------------------------------------------------------------------------
-- Question 2:
-- For each job posting, how many applicants reached the Final interview stage?
-- Includes zero counts using a LEFT JOIN with the stage filter placed directly
-- in the ON condition so non-final jobs are not discarded.
-- ----------------------------------------------------------------------------
SELECT 
    jp.id AS job_posting_id,
    jp.title AS job_title,
    jp.department,
    jp.status,
    COUNT(DISTINCT i.applicant_id) AS final_stage_applicant_count
FROM job_postings jp
LEFT JOIN interviews i 
    ON jp.id = i.job_posting_id 
   AND i.stage = 'Final'
GROUP BY jp.id, jp.title, jp.department, jp.status
ORDER BY jp.id ASC;


-- ----------------------------------------------------------------------------
-- Question 3:
-- Find every person who effectively applied to more than one job posting.
--
-- MATCHING ASSUMPTIONS & NORMALIZATION RATIONALE:
-- 1. Real-world applicant data frequently suffers from duplication (e.g. Ananya Rao
--    has applicant id 1 with email 'ananya.rao@mail.com' and applicant id 2 with
--    email 'Ananya.Rao@mail.com'). We resolve applicant identity by normalizing
--    LOWER(TRIM(email)) as the canonical unique person identifier, alongside
--    LOWER(TRIM(full_name)).
-- 2. "Effectively applied/interviewed" is determined from the interviews table.
-- 3. Multiple interview stages for the same job (e.g. Screen, Technical, Final)
--    are deduplicated using COUNT(DISTINCT i.job_posting_id) so repeated rounds
--    on a single job posting do not falsely inflate the posting count.
-- ----------------------------------------------------------------------------
SELECT 
    MIN(a.full_name) AS person_name,
    LOWER(TRIM(a.email)) AS normalized_email,
    COUNT(DISTINCT i.job_posting_id) AS distinct_postings_count,
    GROUP_CONCAT(DISTINCT i.job_posting_id ORDER BY i.job_posting_id SEPARATOR ', ') AS applied_job_posting_ids
FROM applicants a
JOIN interviews i ON a.id = i.applicant_id
GROUP BY LOWER(TRIM(a.email))
HAVING COUNT(DISTINCT i.job_posting_id) > 1
ORDER BY distinct_postings_count DESC, person_name ASC;


-- ----------------------------------------------------------------------------
-- Question 4:
-- For each recruiter, compute their Final-stage conversion rate (passed ÷ total
-- Final-stage interviews), but only include recruiters with at least 3 Final-stage
-- interviews.
--
-- Logic:
-- - Joins recruiters -> job_postings -> interviews filtered on stage = 'Final'.
-- - Computes total Final interviews and passed Final interviews.
-- - Filters with HAVING COUNT(*) >= 3 (threshold requirement).
-- - Recruiters with < 3 Final interviews (Fatima with 1, Wei and Grace with 0)
--   are excluded by the threshold constraint.
-- ----------------------------------------------------------------------------
SELECT 
    r.id AS recruiter_id,
    r.name AS recruiter_name,
    SUM(CASE WHEN i.outcome = 'passed' THEN 1 ELSE 0 END) AS passed_final_interviews,
    COUNT(*) AS total_final_interviews,
    ROUND(SUM(CASE WHEN i.outcome = 'passed' THEN 1 ELSE 0 END) / COUNT(*), 4) AS conversion_rate,
    CONCAT(ROUND((SUM(CASE WHEN i.outcome = 'passed' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2), '%') AS conversion_rate_percentage
FROM recruiters r
JOIN job_postings jp ON r.id = jp.recruiter_id
JOIN interviews i ON jp.id = i.job_posting_id
WHERE i.stage = 'Final'
GROUP BY r.id, r.name
HAVING COUNT(*) >= 3
ORDER BY conversion_rate DESC, total_final_interviews DESC;


-- ----------------------------------------------------------------------------
-- Question 5 (Bonus):
-- Using a window function, find the recruiter with the most successful placements
-- (passed at Final stage) per department.
--
-- Logic & Tie Handling:
-- 1. A successful placement is defined as a 'Final' stage interview with outcome 'passed'.
-- 2. Placements are counted distinctly per candidate and posting using
--    COUNT(DISTINCT i.applicant_id, i.job_posting_id) to avoid duplicate counts.
-- 3. We use DENSE_RANK() OVER (PARTITION BY jp.department ORDER BY COUNT(...) DESC).
--    Tie handling decision: DENSE_RANK() ensures that if two recruiters tie for
--    first place in a department, both recruiters share rank 1 and are presented
--    without arbitrarily dropping one or skipping subsequent ranks.
-- 4. An outer filter (WHERE dept_rank = 1) extracts the top recruiter(s) per department.
-- ----------------------------------------------------------------------------
WITH recruiter_dept_placements AS (
    SELECT 
        jp.department,
        r.id AS recruiter_id,
        r.name AS recruiter_name,
        COUNT(DISTINCT i.applicant_id, i.job_posting_id) AS successful_placements,
        DENSE_RANK() OVER (
            PARTITION BY jp.department 
            ORDER BY COUNT(DISTINCT i.applicant_id, i.job_posting_id) DESC
        ) AS dept_rank
    FROM recruiters r
    JOIN job_postings jp ON r.id = jp.recruiter_id
    JOIN interviews i ON jp.id = i.job_posting_id
    WHERE i.stage = 'Final' 
      AND i.outcome = 'passed'
    GROUP BY jp.department, r.id, r.name
)
SELECT 
    department,
    recruiter_id,
    recruiter_name,
    successful_placements,
    dept_rank
FROM recruiter_dept_placements
WHERE dept_rank = 1
ORDER BY department ASC, recruiter_name ASC;
