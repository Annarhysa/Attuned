// Fully seeded niche: technology / AI / software / fintech.
// Other niches (nursing, sales, marketing, finance, consulting, trades,
// healthcare, education) plug in via the same shape -- see `niches/index.ts`.

export interface NicheDictionary {
  id: string;
  label: string;
  // Canonical skill/tech terms this niche cares about, with common synonyms
  // so JD phrasing and resume phrasing don't have to match verbatim.
  skills: Record<string, string[]>; // canonical -> synonyms
  domainTerms: string[];
  softSkills: string[];
  toneDefault: string;
  seniorityMarkers: Record<string, string[]>;
  companySignalMarkers: string[]; // phrases that hint at company culture/type
}

export const techAiFintech: NicheDictionary = {
  id: 'tech-ai-fintech',
  label: 'Technology / AI / Software / FinTech',
  skills: {
    Python: ['python', 'py3'],
    JavaScript: ['javascript', 'js', 'es6'],
    TypeScript: ['typescript', 'ts'],
    Java: ['java'],
    'C++': ['c++', 'cpp'],
    Go: ['golang', ' go '],
    SQL: ['sql', 'postgresql', 'mysql', 'postgres'],
    NoSQL: ['nosql', 'mongodb', 'dynamodb'],
    AWS: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
    Azure: ['azure', 'microsoft azure'],
    GCP: ['gcp', 'google cloud'],
    Docker: ['docker', 'containerization'],
    Kubernetes: ['kubernetes', 'k8s'],
    'Machine Learning': ['machine learning', 'ml models', 'ml'],
    'Deep Learning': ['deep learning', 'neural network', 'neural networks'],
    NLP: ['nlp', 'natural language processing'],
    LLM: ['llm', 'large language model', 'large language models', 'genai', 'generative ai'],
    'Computer Vision': ['computer vision', 'cv'],
    'Data Engineering': ['data engineering', 'data pipeline', 'data pipelines'],
    ETL: ['etl', 'extract transform load', 'elt'],
    'REST APIs': ['rest api', 'rest apis', 'restful'],
    GraphQL: ['graphql'],
    Microservices: ['microservices', 'microservice architecture'],
    'CI/CD': ['ci/cd', 'continuous integration', 'continuous deployment'],
    React: ['react', 'reactjs', 'react.js'],
    'Node.js': ['node.js', 'nodejs', 'node'],
    'Fraud Detection': ['fraud detection', 'fraud prevention', 'anti-fraud'],
    'Risk Modeling': ['risk modeling', 'risk model', 'credit risk'],
    Blockchain: ['blockchain', 'distributed ledger'],
    Fintech: ['fintech', 'financial technology', 'payments'],
    'Data Analysis': ['data analysis', 'data analytics'],
    Git: ['git', 'version control'],
    Terraform: ['terraform', 'infrastructure as code', 'iac'],
    'System Design': ['system design', 'distributed systems'],
    Spark: ['spark', 'apache spark', 'pyspark'],
    Airflow: ['airflow', 'apache airflow'],
    'A/B Testing': ['a/b testing', 'ab testing', 'experimentation'],
  },
  domainTerms: [
    'scalability', 'latency', 'throughput', 'compliance', 'kyc', 'aml',
    'PCI-DSS', 'regulatory', 'high-availability', 'fault-tolerant', 'real-time',
  ],
  softSkills: [
    'communication', 'collaboration', 'leadership', 'ownership', 'mentorship',
    'problem-solving', 'cross-functional', 'stakeholder management', 'agile', 'scrum',
  ],
  toneDefault: 'professional',
  seniorityMarkers: {
    intern: ['intern', 'internship'],
    junior: ['junior', 'entry-level', 'entry level', 'associate'],
    mid: ['mid-level', 'engineer ii', 'software engineer'],
    senior: ['senior', 'sr.', 'sr '],
    staff: ['staff', 'principal'],
    lead: ['lead', 'team lead', 'tech lead'],
    manager: ['manager', 'engineering manager', 'director', 'head of'],
  },
  companySignalMarkers: [
    'fast-paced', 'startup', 'series a', 'series b', 'series c', 'unicorn',
    'fortune 500', 'enterprise', 'remote-first', 'hybrid', 'publicly traded',
    'venture-backed', 'mission-driven', 'regulated industry',
  ],
};
