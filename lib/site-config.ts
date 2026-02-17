/**
 * Single source of truth for all website constants.
 * Import from here instead of hardcoding values across the codebase.
 */

export const SITE_CONFIG = {
  name: "Robonauts",
  alternateName: "Robonauts  Bangladesh",
  tagline: "Innovation meets curiosity in STEM education",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://robonautsclub.com",
  description:
    "Bangladesh's first youth robotics club preparing students for Robofest & global STEM challenges.",
  extendedDescription:
    "Bangladesh's first youth robotics club preparing students for Robofest & global STEM challenges. Join 500+ members for hands-on robotics workshops, competitions, and international opportunities.",
  email: "info@robonautsclub.com",
  noreplyEmail: "noreply@robonautsclub.com",
  phone: "+8801824863366",
  location: "5B, House #4, Road #7, Sector #3, Uttara",
  address: {
    streetAddress: "5B, House #4, Road #7, Sector #3",
    locality: "Uttara",
    region: "Dhaka",
    country: "BD",
  },
  social: {
    facebook: "https://www.facebook.com/robonautsclub",
    instagram: "https://www.instagram.com/robonauts_club",
    whatsapp: "https://wa.me/8801824863366",
    linkedin: "/linkedin",
    youtube: "/youtube",
  },
  navLinks: [
    { title: "Home", href: "/" },
    { title: "Events", href: "/events" },
    { title: "About us", href: "/about" },
  ],
  services: [
    "Robotics Workshops",
    "Hands-on Training",
    "Robo Fair",
    "Competitions and Simulations",
  ],
  metadata: {
    defaultTitle:
      "Robonauts Club | Bangladesh's Premier Youth Robotics & STEM Education",
    titleTemplate: "%s | Robonauts Club",
    defaultDescription:
      "Bangladesh's first youth robotics club preparing students for Robofest & global STEM challenges. Join 500+ members for hands-on robotics workshops, competitions, and international opportunities.",
    keywords: [
      "robotics Bangladesh",
      "STEM education Bangladesh",
      "Robofest Bangladesh",
      "youth robotics club",
      "robotics workshop Dhaka",
      "STEM training Bangladesh",
      "robotics competition Bangladesh",
      "robotics education",
      "coding workshop Bangladesh",
      "AI education Bangladesh",
      "electronics training",
      "robotics for kids",
      "robotics for students",
      "robotics club Dhaka",
      "STEM club Bangladesh",
    ],
    defaultImage: "/robobanner.gif",
    defaultImageAlt:
      "Robonauts Club - Bangladesh's Premier Youth Robotics",
    twitterCreator: "@robonauts_club",
  },
  assets: {
    logo: "/robologo.png",
    defaultEventImage: "/robotics-event.jpg",
  },
  developer: {
    name: "Mohammad Salah",
    url: "https://github.com/salahakramfuad",
  },
} as const;
