export type RegistryLookupInput = {
  employerName?: string | null;
  sourceUrl?: string | null;
  timeoutMs: number;
};

export type RegistryLookupOutput = {
  status: 'done' | 'blocked' | 'failed';
  finalUrl?: string;
  title?: string;
  rawContent?: string;
  metadata?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  blockReason?: string;
};

/** MVP stub — replace with real Companies House / OpenCorporates adapter later. */
export class RegistryLookupStubClient {
  async searchCompany(input: RegistryLookupInput): Promise<RegistryLookupOutput> {
    const employerName = input.employerName?.trim();

    if (!employerName) {
      return {
        status: 'failed',
        errorCode: 'MISSING_EMPLOYER_NAME',
        errorMessage: 'Employer name is required for registry lookup',
      };
    }

    const fakePayload = {
      company_name: employerName,
      company_status: 'active',
      company_number: '12345678',
      jurisdiction: 'uk',
      incorporated_on: '2019-03-15',
      registered_office_address: 'London, United Kingdom',
    };

    return {
      status: 'done',
      finalUrl: `https://registry.example.test/company/${encodeURIComponent(
        employerName.toLowerCase().replace(/\s+/g, '-'),
      )}`,
      title: `${employerName} registry record`,
      rawContent: JSON.stringify(fakePayload),
      metadata: {
        source_system: 'registry_stub',
        content_type: 'application/json',
      },
    };
  }
}
