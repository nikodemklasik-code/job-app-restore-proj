import { InterviewSessionContext } from '../models/interview.types.js';
import { ClosingSummaryOrchestrator } from './closing-summary-orchestrator.js';
import { CoachHandoffOrchestrator } from './coach-handoff-orchestrator.js';
import { assembleInterviewReport } from '../services/interview-report-assembler.service.js';
import { PdfGeneratorService } from '../services/pdf-generator.service.js';
import type { PdfReportPayload } from '../services/pdf-report.service.js';

export class ReportOrchestrator {
  constructor(
    private readonly closingSummaryOrchestrator: ClosingSummaryOrchestrator,
    private readonly coachHandoffOrchestrator: CoachHandoffOrchestrator,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  async generate(session: InterviewSessionContext) {
    const closingSummary = await this.closingSummaryOrchestrator.generate(session);
    const coachHandoff = await this.coachHandoffOrchestrator.generate(session);
    const report = assembleInterviewReport({
      session,
      closingSummary,
      coachHandoff,
    });

    const pdfPayload: PdfReportPayload = {
      sessionMetadata: {
        role:    report.sessionMetadata.role,
        level:   report.sessionMetadata.level,
        persona: report.sessionMetadata.persona,
        date:    new Date(report.sessionMetadata.generatedAt).toLocaleDateString('en-GB'),
      },
      interviewFeedback: {
        overallSummary:       report.overallSummary,
        topStrengths:         report.topStrengths,
        areasToStrengthen:    report.areasToStrengthen,
        recruiterPerspective: report.recruiterPerspective,
        nextInterviewFocus:   report.nextInterviewFocus,
      },
      coachHandoff: {
        topStrengths:            report.topStrengths,
        areasToStrengthen:       report.areasToStrengthen,
        weakestSections:         [],
        communicationPatterns:   [],
        recommendedCoachModules: report.coachRecommendations,
      },
    };

    const pdfBuffer = await this.pdfGeneratorService.generateReportPdf(pdfPayload);

    return {
      closingSummary,
      coachHandoff,
      report,
      pdfBuffer,
    };
  }
}
