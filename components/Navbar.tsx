import Link from 'next/link'
import Image from 'next/image'
import { SITE_CONFIG } from '@/lib/site-config'
import NavbarScrollShell from '@/components/NavbarScrollShell'
import NavbarDesktopMenu from '@/components/NavbarDesktopMenu'
import NavbarMobileMenu from '@/components/NavbarMobileMenu'

export default function Nav() {
  const menuItems = SITE_CONFIG.navLinks

  return (
    <NavbarScrollShell>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:inset-x-0 focus:top-2 mx-auto w-max rounded-lg bg-indigo-500 px-3 py-2 text-white"
      >
        Skip to content
      </a>

      <nav aria-label="Primary" className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-3 group no-underline hover:no-underline focus:no-underline"
          >
            <Image
              src={SITE_CONFIG.assets.logo}
              alt={SITE_CONFIG.name}
              width={48}
              height={48}
              priority
              className="rounded-full object-contain ring-1 ring-gray-200 group-hover:ring-indigo-200 transition"
            />
            <span className="hidden md:block text-2xl font-semibold leading-tight text-gray-900 tracking-tight">
              Robonauts
            </span>
          </Link>

          <NavbarDesktopMenu menuItems={menuItems} />
          <NavbarMobileMenu menuItems={menuItems} />
        </div>
      </nav>
    </NavbarScrollShell>
  )
}
