/**
 * Education & Training Provider Taxonomy
 *
 * Universities, colleges, bootcamps, and online platforms for learning recommendations.
 */

export type ProviderType = 'university' | 'college' | 'online_platform' | 'bootcamp' | 'professional_body';

export interface EducationProvider {
    name: string;
    type: ProviderType;
    url: string;
    domains: string[]; // skill domains covered
    country: string;
}

export const EDUCATION_PROVIDERS: EducationProvider[] = [
    // ── UK Universities ────────────────────────────────────────────────────────
    { name: 'University of Oxford', type: 'university', url: 'https://www.ox.ac.uk', domains: ['computer_science', 'mathematics', 'engineering', 'business'], country: 'UK' },
    { name: 'University of Cambridge', type: 'university', url: 'https://www.cam.ac.uk', domains: ['computer_science', 'mathematics', 'engineering', 'natural_sciences'], country: 'UK' },
    { name: 'Imperial College London', type: 'university', url: 'https://www.imperial.ac.uk', domains: ['engineering', 'computer_science', 'data_science', 'business'], country: 'UK' },
    { name: 'UCL', type: 'university', url: 'https://www.ucl.ac.uk', domains: ['computer_science', 'data_science', 'engineering', 'healthcare'], country: 'UK' },
    { name: 'University of Edinburgh', type: 'university', url: 'https://www.ed.ac.uk', domains: ['computer_science', 'ai', 'data_science', 'informatics'], country: 'UK' },
    { name: 'University of Manchester', type: 'university', url: 'https://www.manchester.ac.uk', domains: ['computer_science', 'engineering', 'business', 'data_science'], country: 'UK' },
    { name: 'King\'s College London', type: 'university', url: 'https://www.kcl.ac.uk', domains: ['computer_science', 'cybersecurity', 'healthcare', 'law'], country: 'UK' },
    { name: 'University of Bristol', type: 'university', url: 'https://www.bristol.ac.uk', domains: ['computer_science', 'engineering', 'mathematics'], country: 'UK' },
    { name: 'University of Leeds', type: 'university', url: 'https://www.leeds.ac.uk', domains: ['computer_science', 'business', 'engineering', 'healthcare'], country: 'UK' },
    { name: 'University of Glasgow', type: 'university', url: 'https://www.gla.ac.uk', domains: ['computer_science', 'engineering', 'data_science'], country: 'UK' },
    { name: 'University of Birmingham', type: 'university', url: 'https://www.birmingham.ac.uk', domains: ['computer_science', 'cybersecurity', 'ai', 'engineering'], country: 'UK' },
    { name: 'University of Southampton', type: 'university', url: 'https://www.southampton.ac.uk', domains: ['computer_science', 'web_science', 'cybersecurity', 'ai'], country: 'UK' },
    { name: 'University of Warwick', type: 'university', url: 'https://warwick.ac.uk', domains: ['computer_science', 'mathematics', 'business', 'data_science'], country: 'UK' },
    { name: 'Queen Mary University of London', type: 'university', url: 'https://www.qmul.ac.uk', domains: ['computer_science', 'engineering', 'ai'], country: 'UK' },
    { name: 'Loughborough University', type: 'university', url: 'https://www.lboro.ac.uk', domains: ['engineering', 'computer_science', 'design'], country: 'UK' },

    // ── UK Colleges (FE) ───────────────────────────────────────────────────────
    { name: 'City of London College', type: 'college', url: 'https://www.colc.ac.uk', domains: ['business', 'computing', 'accounting'], country: 'UK' },
    { name: 'Westminster Kingsway College', type: 'college', url: 'https://www.westking.ac.uk', domains: ['computing', 'business', 'hospitality'], country: 'UK' },
    { name: 'Barking & Dagenham College', type: 'college', url: 'https://www.bdc.ac.uk', domains: ['computing', 'engineering', 'business'], country: 'UK' },
    { name: 'City & Islington College', type: 'college', url: 'https://www.candi.ac.uk', domains: ['computing', 'business', 'health'], country: 'UK' },
    { name: 'Lambeth College', type: 'college', url: 'https://www.lambethcollege.ac.uk', domains: ['computing', 'business', 'construction'], country: 'UK' },

    // ── Online Platforms ───────────────────────────────────────────────────────
    { name: 'Coursera', type: 'online_platform', url: 'https://www.coursera.org', domains: ['computer_science', 'data_science', 'ai', 'business', 'cloud', 'cybersecurity'], country: 'Global' },
    { name: 'Udemy', type: 'online_platform', url: 'https://www.udemy.com', domains: ['programming', 'web_development', 'data_science', 'devops', 'design', 'business'], country: 'Global' },
    { name: 'Pluralsight', type: 'online_platform', url: 'https://www.pluralsight.com', domains: ['cloud', 'devops', 'cybersecurity', 'programming', 'data'], country: 'Global' },
    { name: 'LinkedIn Learning', type: 'online_platform', url: 'https://www.linkedin.com/learning', domains: ['business', 'technology', 'creative', 'management'], country: 'Global' },
    { name: 'freeCodeCamp', type: 'online_platform', url: 'https://www.freecodecamp.org', domains: ['web_development', 'javascript', 'python', 'data_science'], country: 'Global' },
    { name: 'Codecademy', type: 'online_platform', url: 'https://www.codecademy.com', domains: ['programming', 'web_development', 'data_science', 'ai'], country: 'Global' },
    { name: 'edX', type: 'online_platform', url: 'https://www.edx.org', domains: ['computer_science', 'data_science', 'business', 'engineering'], country: 'Global' },
    { name: 'Udacity', type: 'online_platform', url: 'https://www.udacity.com', domains: ['ai', 'data_science', 'cloud', 'programming', 'autonomous_systems'], country: 'Global' },
    { name: 'A Cloud Guru', type: 'online_platform', url: 'https://acloudguru.com', domains: ['aws', 'azure', 'gcp', 'cloud', 'devops'], country: 'Global' },
    { name: 'DataCamp', type: 'online_platform', url: 'https://www.datacamp.com', domains: ['data_science', 'python', 'r', 'sql', 'machine_learning'], country: 'Global' },
    { name: 'Brilliant', type: 'online_platform', url: 'https://brilliant.org', domains: ['mathematics', 'computer_science', 'physics', 'logic'], country: 'Global' },
    { name: 'The Odin Project', type: 'online_platform', url: 'https://www.theodinproject.com', domains: ['web_development', 'javascript', 'ruby', 'html_css'], country: 'Global' },
    { name: 'Frontend Masters', type: 'online_platform', url: 'https://frontendmasters.com', domains: ['javascript', 'react', 'typescript', 'css', 'node'], country: 'Global' },
    { name: 'Egghead.io', type: 'online_platform', url: 'https://egghead.io', domains: ['javascript', 'react', 'typescript', 'web_development'], country: 'Global' },
    { name: 'Scrimba', type: 'online_platform', url: 'https://scrimba.com', domains: ['web_development', 'react', 'javascript', 'css'], country: 'Global' },

    // ── Bootcamps ──────────────────────────────────────────────────────────────
    { name: 'Le Wagon', type: 'bootcamp', url: 'https://www.lewagon.com', domains: ['web_development', 'data_science', 'ruby', 'javascript'], country: 'UK' },
    { name: 'Makers Academy', type: 'bootcamp', url: 'https://makers.tech', domains: ['software_engineering', 'ruby', 'javascript', 'tdd'], country: 'UK' },
    { name: 'Northcoders', type: 'bootcamp', url: 'https://northcoders.com', domains: ['javascript', 'react', 'node', 'sql'], country: 'UK' },
    { name: 'Codeclan', type: 'bootcamp', url: 'https://codeclan.com', domains: ['software_development', 'python', 'javascript', 'java'], country: 'UK' },
    { name: 'General Assembly', type: 'bootcamp', url: 'https://generalassemb.ly', domains: ['web_development', 'data_science', 'ux_design', 'product_management'], country: 'UK' },
    { name: 'Flatiron School', type: 'bootcamp', url: 'https://flatironschool.com', domains: ['software_engineering', 'data_science', 'cybersecurity', 'product_design'], country: 'Global' },
    { name: 'School of Code', type: 'bootcamp', url: 'https://www.schoolofcode.co.uk', domains: ['web_development', 'javascript', 'react', 'node'], country: 'UK' },

    // ── Professional Bodies ────────────────────────────────────────────────────
    { name: 'BCS (British Computer Society)', type: 'professional_body', url: 'https://www.bcs.org', domains: ['computer_science', 'it_management', 'cybersecurity'], country: 'UK' },
    { name: 'IET (Institution of Engineering and Technology)', type: 'professional_body', url: 'https://www.theiet.org', domains: ['engineering', 'technology', 'cybersecurity'], country: 'UK' },
    { name: 'CIMA', type: 'professional_body', url: 'https://www.cimaglobal.com', domains: ['accounting', 'finance', 'management'], country: 'UK' },
    { name: 'CIPD', type: 'professional_body', url: 'https://www.cipd.org', domains: ['hr', 'people_management', 'learning_development'], country: 'UK' },
    { name: 'PMI', type: 'professional_body', url: 'https://www.pmi.org', domains: ['project_management', 'agile', 'programme_management'], country: 'Global' },
];

/**
 * Find education providers relevant to a skill domain.
 */
export function findProvidersForSkill(skillDomain: string): EducationProvider[] {
    const lower = skillDomain.toLowerCase().replace(/[^a-z]/g, '_');
    return EDUCATION_PROVIDERS.filter((p) =>
        p.domains.some((d) => d.includes(lower) || lower.includes(d)),
    );
}

/**
 * Get providers by type.
 */
export function getProvidersByType(type: ProviderType): EducationProvider[] {
    return EDUCATION_PROVIDERS.filter((p) => p.type === type);
}
