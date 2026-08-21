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
      className="space-y-3"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`faq-${index}`}
          className="group rounded-2xl border border-slate-200/80 bg-white overflow-hidden transition-all duration-300 hover:border-indigo-200 data-[state=open]:border-indigo-200 data-[state=open]:shadow-[0_12px_28px_-18px_rgba(79,70,229,0.35)]"
        >
          <AccordionTrigger className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left rounded-none hover:no-underline hover:bg-slate-50/80 data-[state=open]:bg-indigo-50/40 transition-colors duration-300 [&>svg]:size-5 [&>svg]:text-slate-400 [&>svg]:translate-y-0 group-hover:[&>svg]:text-indigo-500 data-[state=open]:[&>svg]:text-indigo-500">
            <span className="font-semibold text-sm sm:text-base text-gray-900 pr-4 group-hover:text-indigo-700 group-data-[state=open]:text-indigo-700 transition-colors text-left">
              {item.question}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-5 sm:px-6 pb-5 pt-1 text-sm sm:text-base text-gray-600 leading-relaxed border-t border-slate-100">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
