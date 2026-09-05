import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'FinTech Corporate',
    industry: 'fintech',
    primaryColor: '#1e3a5f',
    secondaryColor: '#3b6ea5',
    font: 'Georgia',
    fontSize: 'medium',
    spacing: 'normal',
    layout: 'single-column',
    headerStyle: 'classic',
    sectionStyle: 'underline',
    accentStyle: 'minimal',
    atsSafe: true,
  },
  {
    name: 'AI Startup Minimal',
    industry: 'ai-startup',
    primaryColor: '#0f172a',
    secondaryColor: '#22d3ee',
    font: 'Inter',
    fontSize: 'medium',
    spacing: 'compact',
    layout: 'single-column',
    headerStyle: 'modern',
    sectionStyle: 'bold-caps',
    accentStyle: 'accent-bar',
    atsSafe: true,
  },
  {
    name: 'Engineering Technical',
    industry: 'software',
    primaryColor: '#1f2937',
    secondaryColor: '#2563eb',
    font: 'Inter',
    fontSize: 'medium',
    spacing: 'normal',
    layout: 'single-column',
    headerStyle: 'classic',
    sectionStyle: 'underline',
    accentStyle: 'minimal',
    atsSafe: true,
  },
  {
    name: 'ATS Professional',
    industry: 'general',
    primaryColor: '#111827',
    secondaryColor: '#374151',
    font: 'Arial',
    fontSize: 'medium',
    spacing: 'normal',
    layout: 'single-column',
    headerStyle: 'classic',
    sectionStyle: 'plain',
    accentStyle: 'none',
    atsSafe: true,
  },
  {
    name: 'Healthcare Trust',
    industry: 'healthcare',
    primaryColor: '#0e5f6e',
    secondaryColor: '#3b8fa3',
    font: 'Calibri',
    fontSize: 'medium',
    spacing: 'normal',
    layout: 'single-column',
    headerStyle: 'classic',
    sectionStyle: 'underline',
    accentStyle: 'minimal',
    atsSafe: true,
  },
  {
    name: 'Creative Marketing',
    industry: 'marketing',
    primaryColor: '#7c2d12',
    secondaryColor: '#ea580c',
    font: 'Poppins',
    fontSize: 'medium',
    spacing: 'relaxed',
    layout: 'single-column',
    headerStyle: 'modern',
    sectionStyle: 'bold-caps',
    accentStyle: 'accent-bar',
    atsSafe: true,
  },
  {
    name: 'Legal Conservative',
    industry: 'legal',
    primaryColor: '#1c1917',
    secondaryColor: '#57534e',
    font: 'Georgia',
    fontSize: 'medium',
    spacing: 'normal',
    layout: 'single-column',
    headerStyle: 'classic',
    sectionStyle: 'plain',
    accentStyle: 'none',
    atsSafe: true,
  },
  {
    // Mirrors the dense, black-and-white, underlined-headers look of the
    // classic Overleaf/LaTeX academic CV templates (moderncv, Jake's Resume,
    // Awesome-CV) -- serif type, tight spacing, no color accents.
    name: 'Overleaf Academic',
    industry: 'academic',
    primaryColor: '#000000',
    secondaryColor: '#333333',
    font: 'Georgia',
    fontSize: 'small',
    spacing: 'compact',
    layout: 'single-column',
    headerStyle: 'classic',
    sectionStyle: 'underline',
    accentStyle: 'none',
    atsSafe: true,
  },
];

async function main() {
  for (const t of templates) {
    const existing = await prisma.designTemplate.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.designTemplate.create({ data: t });
    }
  }
  console.log(`Seeded ${templates.length} design templates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
