/**
 * Skill Taxonomy Seed Data
 *
 * Initial canonical skills across all categories with common aliases.
 * Run via: npx tsx src/services/skillMatrix/data/seed-taxonomy.ts
 */

import { randomUUID } from 'crypto';
import type { SkillCategory } from '../types.js';

export interface SeedSkill {
    canonicalName: string;
    category: SkillCategory;
    aliases: string[];
}

export const SEED_SKILLS: SeedSkill[] = [
    // ── Programming Languages ──────────────────────────────────────────────────
    { canonicalName: 'javascript', category: 'programming_language', aliases: ['js', 'ecmascript', 'es6', 'es2015+'] },
    { canonicalName: 'typescript', category: 'programming_language', aliases: ['ts', 'type script'] },
    { canonicalName: 'python', category: 'programming_language', aliases: ['py', 'python3', 'python 3'] },
    { canonicalName: 'java', category: 'programming_language', aliases: ['java se', 'java ee', 'jdk'] },
    { canonicalName: 'c#', category: 'programming_language', aliases: ['csharp', 'c sharp', '.net c#'] },
    { canonicalName: 'c++', category: 'programming_language', aliases: ['cpp', 'c plus plus'] },
    { canonicalName: 'go', category: 'programming_language', aliases: ['golang'] },
    { canonicalName: 'rust', category: 'programming_language', aliases: ['rust-lang'] },
    { canonicalName: 'ruby', category: 'programming_language', aliases: ['rb'] },
    { canonicalName: 'php', category: 'programming_language', aliases: ['php8', 'php 8'] },
    { canonicalName: 'swift', category: 'programming_language', aliases: ['swift ui', 'swiftui'] },
    { canonicalName: 'kotlin', category: 'programming_language', aliases: ['kt'] },
    { canonicalName: 'scala', category: 'programming_language', aliases: [] },
    { canonicalName: 'r', category: 'programming_language', aliases: ['r language', 'r programming'] },
    { canonicalName: 'sql', category: 'programming_language', aliases: ['structured query language'] },
    { canonicalName: 'html', category: 'programming_language', aliases: ['html5', 'html 5'] },
    { canonicalName: 'css', category: 'programming_language', aliases: ['css3', 'css 3', 'cascading style sheets'] },
    { canonicalName: 'bash', category: 'programming_language', aliases: ['shell', 'shell scripting', 'sh'] },
    { canonicalName: 'dart', category: 'programming_language', aliases: [] },
    { canonicalName: 'elixir', category: 'programming_language', aliases: [] },

    // ── Frameworks ─────────────────────────────────────────────────────────────
    { canonicalName: 'react', category: 'framework', aliases: ['reactjs', 'react.js', 'react js'] },
    { canonicalName: 'next.js', category: 'framework', aliases: ['nextjs', 'next js', 'next'] },
    { canonicalName: 'vue.js', category: 'framework', aliases: ['vuejs', 'vue', 'vue 3'] },
    { canonicalName: 'angular', category: 'framework', aliases: ['angularjs', 'angular 2+'] },
    { canonicalName: 'svelte', category: 'framework', aliases: ['sveltekit'] },
    { canonicalName: 'node.js', category: 'framework', aliases: ['nodejs', 'node', 'node js'] },
    { canonicalName: 'express.js', category: 'framework', aliases: ['express', 'expressjs'] },
    { canonicalName: 'django', category: 'framework', aliases: ['django rest framework', 'drf'] },
    { canonicalName: 'flask', category: 'framework', aliases: [] },
    { canonicalName: 'fastapi', category: 'framework', aliases: ['fast api'] },
    { canonicalName: 'spring boot', category: 'framework', aliases: ['spring', 'spring framework'] },
    { canonicalName: '.net', category: 'framework', aliases: ['dotnet', '.net core', 'asp.net'] },
    { canonicalName: 'ruby on rails', category: 'framework', aliases: ['rails', 'ror'] },
    { canonicalName: 'laravel', category: 'framework', aliases: [] },
    { canonicalName: 'flutter', category: 'framework', aliases: [] },
    { canonicalName: 'react native', category: 'framework', aliases: ['rn', 'react-native'] },
    { canonicalName: 'tailwind css', category: 'framework', aliases: ['tailwind', 'tailwindcss'] },
    { canonicalName: 'bootstrap', category: 'framework', aliases: ['bootstrap 5'] },
    { canonicalName: 'nestjs', category: 'framework', aliases: ['nest.js', 'nest'] },
    { canonicalName: 'remix', category: 'framework', aliases: ['remix.run'] },

    // ── Tools ──────────────────────────────────────────────────────────────────
    { canonicalName: 'git', category: 'tool', aliases: ['github', 'gitlab', 'version control'] },
    { canonicalName: 'docker', category: 'tool', aliases: ['containerization', 'docker compose'] },
    { canonicalName: 'kubernetes', category: 'tool', aliases: ['k8s', 'kube'] },
    { canonicalName: 'terraform', category: 'tool', aliases: ['tf', 'infrastructure as code'] },
    { canonicalName: 'aws', category: 'tool', aliases: ['amazon web services', 'amazon aws'] },
    { canonicalName: 'azure', category: 'tool', aliases: ['microsoft azure', 'ms azure'] },
    { canonicalName: 'gcp', category: 'tool', aliases: ['google cloud', 'google cloud platform'] },
    { canonicalName: 'jenkins', category: 'tool', aliases: ['jenkins ci'] },
    { canonicalName: 'github actions', category: 'tool', aliases: ['gh actions'] },
    { canonicalName: 'circleci', category: 'tool', aliases: ['circle ci'] },
    { canonicalName: 'jira', category: 'tool', aliases: ['atlassian jira'] },
    { canonicalName: 'confluence', category: 'tool', aliases: [] },
    { canonicalName: 'figma', category: 'tool', aliases: [] },
    { canonicalName: 'postman', category: 'tool', aliases: [] },
    { canonicalName: 'webpack', category: 'tool', aliases: [] },
    { canonicalName: 'vite', category: 'tool', aliases: ['vitejs'] },
    { canonicalName: 'postgresql', category: 'tool', aliases: ['postgres', 'psql'] },
    { canonicalName: 'mysql', category: 'tool', aliases: ['mariadb'] },
    { canonicalName: 'mongodb', category: 'tool', aliases: ['mongo'] },
    { canonicalName: 'redis', category: 'tool', aliases: [] },
    { canonicalName: 'elasticsearch', category: 'tool', aliases: ['elastic', 'es'] },
    { canonicalName: 'kafka', category: 'tool', aliases: ['apache kafka'] },
    { canonicalName: 'rabbitmq', category: 'tool', aliases: ['rabbit mq'] },
    { canonicalName: 'graphql', category: 'tool', aliases: ['gql'] },
    { canonicalName: 'rest api', category: 'tool', aliases: ['restful', 'rest', 'restful api'] },
    { canonicalName: 'nginx', category: 'tool', aliases: [] },
    { canonicalName: 'linux', category: 'tool', aliases: ['unix', 'ubuntu', 'centos', 'debian'] },
    { canonicalName: 'datadog', category: 'tool', aliases: [] },
    { canonicalName: 'grafana', category: 'tool', aliases: [] },
    { canonicalName: 'prometheus', category: 'tool', aliases: [] },
    { canonicalName: 'sentry', category: 'tool', aliases: [] },

    // ── Methodologies ──────────────────────────────────────────────────────────
    { canonicalName: 'agile', category: 'methodology', aliases: ['agile methodology', 'agile development'] },
    { canonicalName: 'scrum', category: 'methodology', aliases: ['scrum master', 'scrum framework'] },
    { canonicalName: 'kanban', category: 'methodology', aliases: [] },
    { canonicalName: 'tdd', category: 'methodology', aliases: ['test driven development', 'test-driven development'] },
    { canonicalName: 'bdd', category: 'methodology', aliases: ['behaviour driven development'] },
    { canonicalName: 'ci/cd', category: 'methodology', aliases: ['continuous integration', 'continuous deployment', 'cicd'] },
    { canonicalName: 'devops', category: 'methodology', aliases: ['dev ops'] },
    { canonicalName: 'microservices', category: 'methodology', aliases: ['microservice architecture'] },
    { canonicalName: 'domain driven design', category: 'methodology', aliases: ['ddd'] },
    { canonicalName: 'pair programming', category: 'methodology', aliases: ['mob programming'] },
    { canonicalName: 'code review', category: 'methodology', aliases: ['peer review'] },
    { canonicalName: 'design patterns', category: 'methodology', aliases: ['software patterns', 'gang of four'] },

    // ── Soft Skills ────────────────────────────────────────────────────────────
    { canonicalName: 'communication', category: 'soft_skill', aliases: ['written communication', 'verbal communication'] },
    { canonicalName: 'leadership', category: 'soft_skill', aliases: ['team leadership', 'tech lead'] },
    { canonicalName: 'problem solving', category: 'soft_skill', aliases: ['analytical thinking', 'critical thinking'] },
    { canonicalName: 'teamwork', category: 'soft_skill', aliases: ['collaboration', 'team player'] },
    { canonicalName: 'time management', category: 'soft_skill', aliases: ['prioritization'] },
    { canonicalName: 'mentoring', category: 'soft_skill', aliases: ['coaching', 'knowledge sharing'] },
    { canonicalName: 'stakeholder management', category: 'soft_skill', aliases: ['client management'] },
    { canonicalName: 'presentation skills', category: 'soft_skill', aliases: ['public speaking'] },
    { canonicalName: 'adaptability', category: 'soft_skill', aliases: ['flexibility', 'learning agility'] },
    { canonicalName: 'project management', category: 'soft_skill', aliases: ['pm', 'programme management'] },

    // ── Domain Knowledge ───────────────────────────────────────────────────────
    { canonicalName: 'machine learning', category: 'domain_knowledge', aliases: ['ml', 'deep learning', 'ai'] },
    { canonicalName: 'data science', category: 'domain_knowledge', aliases: ['data analytics', 'data analysis'] },
    { canonicalName: 'cybersecurity', category: 'domain_knowledge', aliases: ['security', 'infosec', 'information security'] },
    { canonicalName: 'cloud architecture', category: 'domain_knowledge', aliases: ['cloud computing', 'cloud native'] },
    { canonicalName: 'fintech', category: 'domain_knowledge', aliases: ['financial technology', 'payments'] },
    { canonicalName: 'e-commerce', category: 'domain_knowledge', aliases: ['ecommerce', 'online retail'] },
    { canonicalName: 'healthcare it', category: 'domain_knowledge', aliases: ['healthtech', 'medtech'] },
    { canonicalName: 'blockchain', category: 'domain_knowledge', aliases: ['web3', 'crypto', 'distributed ledger'] },
    { canonicalName: 'ux design', category: 'domain_knowledge', aliases: ['user experience', 'ux research', 'ux/ui'] },
    { canonicalName: 'accessibility', category: 'domain_knowledge', aliases: ['a11y', 'wcag'] },

    // ── Certifications ─────────────────────────────────────────────────────────
    { canonicalName: 'aws certified solutions architect', category: 'certification', aliases: ['aws sa', 'aws solutions architect'] },
    { canonicalName: 'aws certified developer', category: 'certification', aliases: ['aws dev'] },
    { canonicalName: 'azure fundamentals', category: 'certification', aliases: ['az-900'] },
    { canonicalName: 'google cloud professional', category: 'certification', aliases: ['gcp certified'] },
    { canonicalName: 'certified kubernetes administrator', category: 'certification', aliases: ['cka'] },
    { canonicalName: 'pmp', category: 'certification', aliases: ['project management professional'] },
    { canonicalName: 'scrum master certified', category: 'certification', aliases: ['csm', 'psm'] },
    { canonicalName: 'cissp', category: 'certification', aliases: ['certified information systems security professional'] },
    { canonicalName: 'comptia security+', category: 'certification', aliases: ['security plus', 'sec+'] },
    { canonicalName: 'istqb', category: 'certification', aliases: ['istqb foundation', 'software testing certification'] },
];

/**
 * Generate insert values for the seed data.
 */
export function generateSeedValues() {
    return SEED_SKILLS.map((skill) => ({
        id: randomUUID(),
        canonicalName: skill.canonicalName,
        category: skill.category,
        aliases: skill.aliases,
        parentId: null,
        status: 'active' as const,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));
}

// ── Additional Certifications & Courses ────────────────────────────────────────

export const ADDITIONAL_CERTIFICATIONS: SeedSkill[] = [
    // Cloud & DevOps
    { canonicalName: 'aws certified cloud practitioner', category: 'certification', aliases: ['clf-c02', 'aws cloud practitioner'] },
    { canonicalName: 'aws certified devops engineer', category: 'certification', aliases: ['aws devops'] },
    { canonicalName: 'azure administrator', category: 'certification', aliases: ['az-104'] },
    { canonicalName: 'azure developer associate', category: 'certification', aliases: ['az-204'] },
    { canonicalName: 'azure solutions architect expert', category: 'certification', aliases: ['az-305'] },
    { canonicalName: 'google cloud associate engineer', category: 'certification', aliases: ['gcp ace'] },
    { canonicalName: 'google cloud professional architect', category: 'certification', aliases: ['gcp pca'] },
    { canonicalName: 'hashicorp terraform associate', category: 'certification', aliases: ['terraform cert'] },
    { canonicalName: 'certified kubernetes application developer', category: 'certification', aliases: ['ckad'] },
    { canonicalName: 'docker certified associate', category: 'certification', aliases: ['dca'] },

    // Security
    { canonicalName: 'certified ethical hacker', category: 'certification', aliases: ['ceh', 'ec-council ceh'] },
    { canonicalName: 'oscp', category: 'certification', aliases: ['offensive security certified professional'] },
    { canonicalName: 'comptia network+', category: 'certification', aliases: ['network plus', 'net+'] },
    { canonicalName: 'cism', category: 'certification', aliases: ['certified information security manager'] },
    { canonicalName: 'ccsp', category: 'certification', aliases: ['certified cloud security professional'] },

    // Data & AI
    { canonicalName: 'aws machine learning specialty', category: 'certification', aliases: ['aws ml'] },
    { canonicalName: 'google professional machine learning engineer', category: 'certification', aliases: ['gcp ml engineer'] },
    { canonicalName: 'databricks certified data engineer', category: 'certification', aliases: ['databricks de'] },
    { canonicalName: 'snowflake snowpro core', category: 'certification', aliases: ['snowpro'] },
    { canonicalName: 'microsoft certified data analyst', category: 'certification', aliases: ['pl-300', 'power bi cert'] },

    // Agile & Management
    { canonicalName: 'safe agilist', category: 'certification', aliases: ['sa', 'scaled agile'] },
    { canonicalName: 'prince2 foundation', category: 'certification', aliases: ['prince2'] },
    { canonicalName: 'prince2 practitioner', category: 'certification', aliases: ['prince2 pract'] },
    { canonicalName: 'itil foundation', category: 'certification', aliases: ['itil 4', 'itil v4'] },
    { canonicalName: 'six sigma green belt', category: 'certification', aliases: ['lean six sigma', 'lssgb'] },
    { canonicalName: 'product owner certified', category: 'certification', aliases: ['cspo', 'pspo'] },

    // Development
    { canonicalName: 'oracle certified java programmer', category: 'certification', aliases: ['ocjp', 'java se cert'] },
    { canonicalName: 'microsoft certified azure ai engineer', category: 'certification', aliases: ['ai-102'] },
    { canonicalName: 'salesforce administrator', category: 'certification', aliases: ['salesforce admin'] },
    { canonicalName: 'salesforce developer', category: 'certification', aliases: ['salesforce dev'] },
];

// ── Additional Tools & Technologies ────────────────────────────────────────────

export const ADDITIONAL_TOOLS: SeedSkill[] = [
    // Data & Analytics
    { canonicalName: 'power bi', category: 'tool', aliases: ['powerbi', 'microsoft power bi'] },
    { canonicalName: 'tableau', category: 'tool', aliases: [] },
    { canonicalName: 'looker', category: 'tool', aliases: ['google looker'] },
    { canonicalName: 'apache spark', category: 'tool', aliases: ['spark', 'pyspark'] },
    { canonicalName: 'apache airflow', category: 'tool', aliases: ['airflow'] },
    { canonicalName: 'dbt', category: 'tool', aliases: ['data build tool'] },
    { canonicalName: 'snowflake', category: 'tool', aliases: [] },
    { canonicalName: 'bigquery', category: 'tool', aliases: ['google bigquery', 'bq'] },
    { canonicalName: 'databricks', category: 'tool', aliases: [] },
    { canonicalName: 'pandas', category: 'tool', aliases: [] },
    { canonicalName: 'numpy', category: 'tool', aliases: [] },
    { canonicalName: 'scikit-learn', category: 'tool', aliases: ['sklearn'] },
    { canonicalName: 'tensorflow', category: 'tool', aliases: ['tf'] },
    { canonicalName: 'pytorch', category: 'tool', aliases: ['torch'] },

    // CI/CD & DevOps
    { canonicalName: 'ansible', category: 'tool', aliases: [] },
    { canonicalName: 'puppet', category: 'tool', aliases: [] },
    { canonicalName: 'chef', category: 'tool', aliases: [] },
    { canonicalName: 'gitlab ci', category: 'tool', aliases: ['gitlab ci/cd'] },
    { canonicalName: 'argocd', category: 'tool', aliases: ['argo cd'] },
    { canonicalName: 'helm', category: 'tool', aliases: ['helm charts'] },
    { canonicalName: 'istio', category: 'tool', aliases: [] },
    { canonicalName: 'pulumi', category: 'tool', aliases: [] },

    // Messaging & Streaming
    { canonicalName: 'apache flink', category: 'tool', aliases: ['flink'] },
    { canonicalName: 'aws sqs', category: 'tool', aliases: ['sqs', 'simple queue service'] },
    { canonicalName: 'aws lambda', category: 'tool', aliases: ['lambda', 'serverless'] },
    { canonicalName: 'aws dynamodb', category: 'tool', aliases: ['dynamodb', 'dynamo'] },
    { canonicalName: 'aws s3', category: 'tool', aliases: ['s3'] },
    { canonicalName: 'aws ecs', category: 'tool', aliases: ['ecs', 'elastic container service'] },
    { canonicalName: 'aws cloudformation', category: 'tool', aliases: ['cloudformation', 'cfn'] },

    // Testing
    { canonicalName: 'jest', category: 'tool', aliases: [] },
    { canonicalName: 'cypress', category: 'tool', aliases: [] },
    { canonicalName: 'playwright', category: 'tool', aliases: [] },
    { canonicalName: 'selenium', category: 'tool', aliases: ['selenium webdriver'] },
    { canonicalName: 'junit', category: 'tool', aliases: [] },
    { canonicalName: 'pytest', category: 'tool', aliases: [] },

    // Design & Product
    { canonicalName: 'sketch', category: 'tool', aliases: [] },
    { canonicalName: 'adobe xd', category: 'tool', aliases: ['xd'] },
    { canonicalName: 'invision', category: 'tool', aliases: [] },
    { canonicalName: 'miro', category: 'tool', aliases: [] },
    { canonicalName: 'notion', category: 'tool', aliases: [] },
    { canonicalName: 'linear', category: 'tool', aliases: [] },

    // CRM & Business
    { canonicalName: 'salesforce', category: 'tool', aliases: ['sfdc'] },
    { canonicalName: 'hubspot', category: 'tool', aliases: [] },
    { canonicalName: 'zendesk', category: 'tool', aliases: [] },
    { canonicalName: 'intercom', category: 'tool', aliases: [] },
];

// ── Additional Frameworks ──────────────────────────────────────────────────────

export const ADDITIONAL_FRAMEWORKS: SeedSkill[] = [
    { canonicalName: 'astro', category: 'framework', aliases: ['astro.build'] },
    { canonicalName: 'nuxt.js', category: 'framework', aliases: ['nuxt', 'nuxtjs'] },
    { canonicalName: 'gatsby', category: 'framework', aliases: ['gatsbyjs'] },
    { canonicalName: 'electron', category: 'framework', aliases: ['electronjs'] },
    { canonicalName: 'tauri', category: 'framework', aliases: [] },
    { canonicalName: 'fastify', category: 'framework', aliases: [] },
    { canonicalName: 'hono', category: 'framework', aliases: [] },
    { canonicalName: 'drizzle orm', category: 'framework', aliases: ['drizzle'] },
    { canonicalName: 'prisma', category: 'framework', aliases: ['prisma orm'] },
    { canonicalName: 'typeorm', category: 'framework', aliases: ['type orm'] },
    { canonicalName: 'sequelize', category: 'framework', aliases: [] },
    { canonicalName: 'mongoose', category: 'framework', aliases: [] },
    { canonicalName: 'trpc', category: 'framework', aliases: ['t3 stack'] },
    { canonicalName: 'zustand', category: 'framework', aliases: [] },
    { canonicalName: 'redux', category: 'framework', aliases: ['redux toolkit', 'rtk'] },
    { canonicalName: 'mobx', category: 'framework', aliases: [] },
    { canonicalName: 'storybook', category: 'framework', aliases: [] },
    { canonicalName: 'material ui', category: 'framework', aliases: ['mui', 'material-ui'] },
    { canonicalName: 'chakra ui', category: 'framework', aliases: ['chakra'] },
    { canonicalName: 'shadcn/ui', category: 'framework', aliases: ['shadcn'] },
];

// ── Combined full seed (original + additions) ──────────────────────────────────

export const FULL_SEED_SKILLS: SeedSkill[] = [
    ...SEED_SKILLS,
    ...ADDITIONAL_CERTIFICATIONS,
    ...ADDITIONAL_TOOLS,
    ...ADDITIONAL_FRAMEWORKS,
];
