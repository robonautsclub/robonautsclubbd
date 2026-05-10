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
      className="space-y-4"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`faq-${index}`}
          className="group border-2 border-gray-200 rounded-xl bg-white overflow-hidden hover:border-indigo-200 hover:shadow-lg transition-all duration-300 data-[state=open]:border-indigo-200 data-[state=open]:shadow-lg"
        >
          <AccordionTrigger
            className="w-full px-6 py-5 text-left rounded-none hover:no-underline hover:bg-linear-to-r hover:from-indigo-50/50 hover:to-transparent data-[state=open]:bg-linear-to-r data-[state=open]:from-indigo-50/50 data-[state=open]:to-transparent transition-all duration-300 [&>svg]:size-5 [&>svg]:text-gray-500 [&>svg]:translate-y-0 group-hover:[&>svg]:text-indigo-500 data-[state=open]:[&>svg]:text-indigo-500"
          >
            <span className="font-semibold text-base text-gray-900 pr-4 group-hover:text-indigo-600 group-data-[state=open]:text-indigo-600 transition-colors text-left">
              {item.question}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-5 pt-4 text-base text-gray-600 leading-relaxed border-t border-gray-100">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
