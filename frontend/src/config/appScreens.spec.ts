import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appScreens } from './appScreens';

describe('appScreens practice namespace', () => {
  it('keeps practice modules under /practice/* paths', () => {
    expect(appScreens.interviewPractice.path).toBe('/practice/interview');
    expect(appScreens.coach.path).toBe('/practice/coach');
    expect(appScreens.dailyWarmup.path).toBe('/practice/daily-warmup');
    expect(appScreens.negotiation.path).toBe('/practice/negotiation');
    expect(appScreens.casePractice.path).toBe('/practice/case');
  });

  it('keeps core mature-module paths unchanged', () => {
    expect(appScreens.skills.path).toBe('/skills');
    expect(appScreens.jobRadar.path).toBe('/job-radar');
    expect(appScreens.legal.path).toBe('/legal');
    expect(appScreens.billing.path).toBe('/billing');
  });
});

describe('router practice compatibility', () => {
  const routerFile = readFileSync(resolve(process.cwd(), 'src/router.tsx'), 'utf-8');

  it('defines canonical /practice/* routes', () => {
    expect(routerFile).toContain("path: 'practice/interview'");
    expect(routerFile).toContain("path: 'practice/daily-warmup'");
    expect(routerFile).toContain("path: 'practice/coach'");
    expect(routerFile).toContain("path: 'practice/negotiation'");
    expect(routerFile).toContain("path: 'practice/case'");
  });

  it('keeps redirects from legacy routes to /practice/*', () => {
    expect(routerFile).toContain("path: 'interview', element: <Navigate to=\"/practice/interview\" replace />");
    expect(routerFile).toContain("path: 'warmup', element: <Navigate to=\"/practice/daily-warmup\" replace />");
    expect(routerFile).toContain("path: 'coach', element: <Navigate to=\"/practice/coach\" replace />");
    expect(routerFile).toContain("path: 'negotiation', element: <Navigate to=\"/practice/negotiation\" replace />");
    expect(routerFile).toContain("path: 'case-practice', element: <Navigate to=\"/practice/case\" replace />");
  });
});
