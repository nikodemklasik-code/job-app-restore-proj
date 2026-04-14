export function mapCoachModules(areasToStrengthen: string[]): string[] {
  const modules = new Set<string>();

  for (const area of areasToStrengthen) {
    const lower = area.toLowerCase();

    if (lower.includes('result') || lower.includes('impact')) {
      modules.add('measurable impact');
    }

    if (lower.includes('ownership') || lower.includes('role')) {
      modules.add('ownership language');
    }

    if (lower.includes('wide') || lower.includes('concise') || lower.includes('sedno')) {
      modules.add('concise answering');
    }

    if (lower.includes('behavioral') || lower.includes('example')) {
      modules.add('STAR / behavioral');
    }
  }

  return Array.from(modules);
}
