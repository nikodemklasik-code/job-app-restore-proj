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
