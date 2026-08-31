import { memo } from 'react'
import { LegalPageLayout, Paragraph, Section, SectionTitle } from '../../components/LegalPage'
import { CONTENT_POLICY } from '../../data/legal-pages'

const ContentPolicy = memo(() => (
  <LegalPageLayout
    title={CONTENT_POLICY.title}
    activeSlug={CONTENT_POLICY.slug}
    tableOfContents={CONTENT_POLICY.sections.map(s => ({ id: s.id, label: s.title }))}
  >
    {CONTENT_POLICY.sections.map(section => (
      <Section key={section.id} id={section.id}>
        <SectionTitle>{section.title}</SectionTitle>
        {section.paragraphs.map((text, i) => (
          <Paragraph key={i}>{text}</Paragraph>
        ))}
      </Section>
    ))}
  </LegalPageLayout>
))

ContentPolicy.displayName = 'ContentPolicy'

export { ContentPolicy }
