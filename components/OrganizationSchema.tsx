import { getOrganizationSchema } from '@/lib/seo'

export default function OrganizationSchema() {
  const schemaJson = JSON.stringify(getOrganizationSchema())
  
  return (
    <template
      id="organization-schema"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: schemaJson }}
    />
  )
}

