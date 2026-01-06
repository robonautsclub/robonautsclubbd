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
  "Robotics Workshops",
  "Hands-on Training",
  "Robo Fair",
  "Competitions and Simulations",
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
    <footer className="bg-brand-light text-brand-dark">
      {/* Top accent strip */}
      <div className="h-2 w-full bg-linear-to-r from-blue-200 via-gray-200 to-red-200" />

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Top Section */}
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Brand */}
          <div className="flex items-start gap-4">
            <Image
              src="/robologo.jpg"
              alt="Robonauts Club Logo"
              width={72}
              height={72}
              className="object-contain w-14 h-14"
              priority
            />
            <div>
              <h2 className="text-xl font-semibold text-brand-blue">
                {COMPANY.name}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-brand-dark/70">
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
                className="
                  flex h-10 w-10 items-center justify-center rounded-full
                  border border-brand-blue/20
                  bg-white text-brand-blue
                  shadow-sm transition
                  hover:bg-brand-blue hover:text-white hover:border-brand-blue
                  focus:outline-none focus:ring-2 focus:ring-brand-blue/30
                "
              >
                <Icon className="text-lg" />
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className="mt-8 mb-6 h-px w-full"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(17,24,39,0.12), transparent)",
          }}
        />

        {/* Main Content */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          {/* Navigation */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link}>
                  <a href="#" className="transition hover:text-brand-blue">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Our Services
            </h3>
            <ul className="space-y-3 text-sm">
              {SERVICES.map((service) => (
                <li key={service} className="text-brand-dark/70">
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-blue">
              Contact
            </h3>
            <div className="space-y-3 text-sm">
              <a
                href={`mailto:${COMPANY.email}`}
                className="flex items-center gap-2 transition hover:text-brand-blue"
              >
                <Mail size={16} />
                {COMPANY.email}
              </a>

              <a
                href={`tel:${COMPANY.phone}`}
                className="flex items-center gap-2 transition hover:text-brand-blue"
              >
                <Phone size={16} />
                {COMPANY.phone}
              </a>

              <p className="text-brand-dark/70">{COMPANY.location}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div
        className="h-1 w-full"
        style={{
          backgroundImage: "linear-gradient(90deg, #2C2C2C, #D61C4E)",
        }}
      />

      {/* Bottom text row */}
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-col gap-2 text-sm text-brand-dark/80 md:flex-row md:items-center md:justify-between">
          <span>
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </span>

          <a
            href="https://github.com/salahakramfuad"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-brand-blue"
          >
            Developed by <span className="font-semibold">Mohammad Salah</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
