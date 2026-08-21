'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type FAQItem = {
  question: string
  answer: string
}

type FAQAccordionProps = {
  items: FAQItem[]
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="faq-0"
      className="divide-y divide-slate-200/80 border-y border-slate-200/80"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`faq-${index}`}
          className="border-0"
        >
          <AccordionTrigger className="group py-5 text-left hover:no-underline sm:py-6 [&>svg]:size-5 [&>svg]:text-slate-400 group-hover:[&>svg]:text-indigo-500 data-[state=open]:[&>svg]:text-indigo-600">
            <span className="pr-4 text-left text-base font-semibold text-gray-900 transition-colors group-hover:text-indigo-700 group-data-[state=open]:text-indigo-700 sm:text-lg">
              {item.question}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-5 text-sm leading-relaxed text-gray-600 sm:pb-6 sm:text-base">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
