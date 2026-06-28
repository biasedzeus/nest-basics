import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

@Injectable()
export class TailorService {
  private geminiClient: GoogleGenAI | null = null;
  private openaiClient: OpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (geminiKey) {
      this.geminiClient = new GoogleGenAI({ apiKey: geminiKey });
    }

    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
    }
  }

  async tailorResume(
    resumeText: string,
    jobDescription: string,
    additionalInstructions?: string,
  ): Promise<string> {
    const systemPrompt = `
You are an expert ATS-optimized resume writer. Your task is to tailor a candidate's resume to match a target job description.
Align the candidate's experience and skills with the job requirements. Keep all job history and education details truthful, but rephrase, highlight, and prioritize experiences, accomplishments, and skills that are highly relevant to the target job.

Ensure the output is written in clean, valid Markdown. Do not include any explanations, introductory text, or markdown code block markers (like \`\`\`markdown). Return ONLY the raw markdown of the tailored resume.

The output resume should follow this standard structure:
1. Header: Name, contact information (email, phone, LinkedIn, GitHub, etc. extracted from the original resume).
2. Professional Summary: A compelling 3-4 sentence summary tailored to the target role.
3. Skills: Grouped/categorized skills matching the job requirements.
4. Work Experience: Rephrased bullet points highlighting relevant achievements, action verbs, and quantitative metrics.
5. Education.
6. Certifications / Projects (if applicable).
`;

    const userPrompt = `
Here is the original resume text:
---
${resumeText}
---

Here is the target job description:
---
${jobDescription}
---

${additionalInstructions ? `Additional user instructions:\n${additionalInstructions}\n` : ''}

Generate the tailored resume in Markdown format.
`;

    // 1. Try Gemini
    if (this.geminiClient) {
      try {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `${systemPrompt}\n\n${userPrompt}`,
        });

        const text = response.text || '';
        // Strip markdown code block wrappers if the model still generated them
        const cleanedText = this.stripMarkdownWrappers(text);
        return cleanedText;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(`Gemini API Error: ${message}`);
      }
    }

    // 2. Try OpenAI
    if (this.openaiClient) {
      try {
        const response = await this.openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        });

        const text = response.choices[0]?.message?.content || '';
        const cleanedText = this.stripMarkdownWrappers(text);
        return cleanedText;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new BadRequestException(`OpenAI API Error: ${message}`);
      }
    }

    throw new BadRequestException(
      'No API credentials found. Please set GEMINI_API_KEY or OPENAI_API_KEY in your environment.',
    );
  }

  private stripMarkdownWrappers(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```markdown')) {
      cleaned = cleaned.substring(11);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }
}
