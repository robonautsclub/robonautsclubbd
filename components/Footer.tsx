import { Mail, Phone } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaWhatsapp,
} from "react-icons/fa";
import Image from "next/image";

/* ================== CONSTANTS ================== */

const COMPANY = {
  name: "Robonauts Club",
  tagline: "Innovation meets curiosity in STEM education",
  email: "info@robonautsclub.com",
  phone: "+8801824863366",
  location: "Dhaka, Bangladesh",
  facebook: "https://www.facebook.com/robonautsclub",
};

const NAV_LINKS = ["Home", "Events", "About Us"];

const SERVICES = [
  "Interactive Workshops",
  "Hands-on Projects",
  "STEM Mentoring",
  "Competitions",
];

const SOCIAL_LINKS = [
  { icon: FaFacebookF, href: COMPANY.facebook, label: "Facebook" },
  { icon: FaInstagram, href: "#", label: "Instagram" },
  { icon: FaLinkedinIn, href: "#", label: "LinkedIn" },
  { icon: FaYoutube, href: "#", label: "YouTube" },
  { icon: FaWhatsapp, href: "#", label: "WhatsApp" },
];

/* ================== COMPONENT ================== */

export default function Footer() {
  return (
    <footer className="bg-slate-50 text-slate-700">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Top Section */}
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl  text-xl font-bold text-white overflow-hidden">
              <span className="w-10 h-10 block">
                <Image
                  src="/robologo.jpg"
                  alt="Robonauts Club Logo"
                  width={40}
                  height={40}
                  className="object-contain w-10 h-10"
                  priority
                />
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {COMPANY.name}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-slate-600">
                {COMPANY.tagline}
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex gap-3">
            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-purple-600 hover:bg-purple-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Icon className="text-lg" />
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 border-t border-slate-200" />

        {/* Main Content */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="transition hover:text-purple-600"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900">
              Our Services
            </h3>
            <ul className="space-y-3 text-sm">
              {SERVICES.map((service) => (
                <li key={service} className="text-slate-600">
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900">
              Contact
            </h3>
            <div className="space-y-3 text-sm">
              <a
                href={`mailto:${COMPANY.email}`}
                className="flex items-center gap-2 transition hover:text-purple-600"
              >
                <Mail size={16} />
                {COMPANY.email}
              </a>

              <a
                href={`tel:${COMPANY.phone}`}
                className="flex items-center gap-2 transition hover:text-purple-600"
              >
                <Phone size={16} />
                {COMPANY.phone}
              </a>

              <p className="text-slate-600">{COMPANY.location}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
      </div>
    </footer>
  );
}
