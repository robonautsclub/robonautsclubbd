import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  Check,
  Construction,
  ExternalLink,
  Flag,
  Gamepad2,
  Globe,
  HardHat,
  Lightbulb,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Rocket,
  Signal,
  Swords,
  Users,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Map Material Symbols names (stored in Robofest content) → lucide icons. */
const ICON_MAP: Record<string, LucideIcon> = {
  smart_toy: Bot,
  precision_manufacturing: HardHat,
  calendar_month: Calendar,
  location_on: MapPin,
  apartment: Building2,
  call: Phone,
  open_in_new: ExternalLink,
  arrow_forward: ArrowRight,
  arrow_back: ArrowLeft,
  rocket_launch: Rocket,
  mail: Mail,
  phone_in_talk: PhoneCall,
  signal_cellular_alt: Signal,
  sports_esports: Gamepad2,
  check: Check,
  sports_kabaddi: Swords,
  construction: Construction,
  timeline: Workflow,
  lightbulb: Lightbulb,
  group: Users,
  flag: Flag,
  public: Globe,
}

type Props = {
  name: string
  className?: string
}

export default function RobofestIcon({ name, className }: Props) {
  const Icon = ICON_MAP[name] ?? Bot
  return <Icon className={cn('size-[1em] shrink-0', className)} aria-hidden />
}
