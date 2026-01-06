'use client'
import React from 'react';
import Image from 'next/image';

// --- Helper Components ---

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="text-center mb-12">
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
    {subtitle && <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>}
  </div>
);

// Dummy event data
const events = [
  {
    id: 1,
    title: "RoboFest 2024 - National Qualifier",
    date: "July 13, 2024",
    time: "10:00 AM - 5:00 PM",
    location: "Uttara Community Center, Dhaka",
    description:
      "Robonauts Club is hosting the official Bangladesh qualifier for RoboFest 2024! Teams will compete in innovative robotics challenges. Open for students in grades 3-12.",
    image: "/robotics-event.jpg",
    link: "#",
  },
  {
    id: 2,
    title: "STEM Discovery Workshop",
    date: "August 3, 2024",
    time: "2:00 PM - 5:00 PM",
    location: "Robonauts Club Lab, Uttara",
    description:
      "Explore hands-on science and engineering experiments designed for curious young minds. Ideal for ages 8-16. Free registration, limited seats.",
    image: "/workshop_kids.jpg",
    link: "#",
  },
  {
    id: 3,
    title: "Summer Coding Bootcamp",
    date: "August 14-20, 2024",
    time: "4:00 PM - 7:00 PM (Daily)",
    location: "Online/Remote",
    description:
      "A weeklong intensive bootcamp on block coding, Python, and real-world robotics applications. Includes project submissions and certificates.",
    image: "/coding_bootcamp.jpg",
    link: "#",
  },
];

const EventCard = ({
  title,
  date,
  time,
  location,
  description,
  image,
  link,
}: typeof events[0]) => (
  <div className="rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 bg-white overflow-hidden flex flex-col md:flex-row">
    <div className="md:w-1/3 w-full h-48 md:h-auto relative">
      <Image
        src={image}
        alt={title}
        fill
        className="object-cover object-center"
        style={{ minHeight: "100%" }}
        sizes="(max-width: 768px) 100vw, 33vw"
        priority
      />
    </div>
    <div className="flex-1 p-8 flex flex-col gap-3">
      <h3 className="text-xl font-bold text-indigo-900">{title}</h3>
      <div className="text-sm text-gray-500 flex flex-wrap gap-x-6 gap-y-2 mb-1">
        <span>
          <span className="font-semibold">Date:</span> {date}
        </span>
        <span>
          <span className="font-semibold">Time:</span> {time}
        </span>
        <span>
          <span className="font-semibold">Location:</span> {location}
        </span>
      </div>
      <p className="text-gray-700 text-base flex-1">{description}</p>
      <div className="mt-2">
        <a
          href={link}
          className="inline-block py-2 px-5 bg-indigo-600 hover:bg-indigo-800 transition-colors text-white font-semibold rounded-lg text-sm"
        >
          Learn More
        </a>
      </div>
    </div>
  </div>
);

// --- Main Page ---

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Header */}
      <section className="relative bg-linear-to-br from-indigo-900 via-blue-900 to-blue-600 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Upcoming Events & Workshops
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Stay up to date with Robonauts Club&apos;s latest competitions, hands-on STEM workshops, and seasonal bootcamps.
          </p>
        </div>
        {/* Decorative pattern can go here */}
      </section>

      {/* Events List */}
      <main className="flex-1 py-20 px-6 max-w-6xl mx-auto">
        <SectionHeader
          title="What's Happening?"
          subtitle="Explore our latest and upcoming STEM events. Click 'Learn More' for registration details."
        />

        <div className="space-y-10">
          {events.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <p className="text-lg text-indigo-900 font-medium mb-4">
            Want to organize a special STEM event for your school or community?
          </p>
          <a
            href="mailto:info@robonautsclub.com"
            className="inline-block py-3 px-7 bg-indigo-700 hover:bg-blue-900 text-white rounded-lg font-semibold text-base transition-colors"
          >
            Contact Us
          </a>
        </div>
      </main>
    </div>
  );
}
