"use client";
import Image from "next/image";

import dynamic from "next/dynamic";
import {
  Trophy,
  Users,
  Award,
  Target,
  GraduationCap,
  Lightbulb,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
} from "lucide-react";

/**
 * Leaflet map must be dynamically loaded on the client
 */
const MapClient = dynamic(() => import("./MapClient"), {
  ssr: false,
});

// Constants
const STATS = [
  { icon: Users, value: "500+", label: "Active Members" },
  { icon: Trophy, value: "50+", label: "Events Hosted" },
  { icon: Award, value: "15+", label: "Competition Awards" },
  { icon: Target, value: "100+", label: "Projects Completed" },
];

const STAT_ICON_COLORS = [
  "text-indigo-500",
  "text-blue-500",
  "text-purple-500",
  "text-indigo-500",
];

const CORE_VALUES = [
  {
    title: "Innovation",
    description: "Creative problem solving and cutting-edge thinking",
    icon: Lightbulb,
  },
  {
    title: "Collaboration",
    description: "Learning together and building strong communities",
    icon: Users,
  },
  {
    title: "Empowerment",
    description: "Building confidence and unlocking potential",
    icon: Target,
  },
];

const WHAT_WE_DO_ITEMS = [
  {
    title: "Robotics Workshops",
    description:
      "Hands-on workshops covering robot assembly, programming, and troubleshooting.",
  },
  {
    title: "Competition Training",
    description:
      "Specialized programs preparing students for national and international robotics competitions.",
  },
  {
    title: "STEM Education",
    description:
      "Comprehensive STEM curriculum integrating science, technology, engineering, and mathematics.",
  },
  {
    title: "Project-Based Learning",
    description:
      "Students work on real-world projects that develop problem-solving and critical thinking skills.",
  },
  {
    title: "Mentorship Programs",
    description:
      "One-on-one and group mentorship from experienced robotics educators and engineers.",
  },
  {
    title: "Community Events",
    description:
      "Regular community events, exhibitions, and showcases celebrating student achievements.",
  },
];

const TEAM_MEMBERS = [
  {
    name: "Dr. Ahmed Rahman",
    role: "Lead Robotics Instructor",
    expertise: "Robotics Engineering, Competition Strategy",
    icon: GraduationCap,
  },
  {
    name: "Fatima Khan",
    role: "STEM Education Specialist",
    expertise: "Curriculum Development, Student Mentorship",
    icon: Lightbulb,
  },
  {
    name: "Mohammad Hassan",
    role: "Programming & AI Mentor",
    expertise: "Python, Machine Learning, Arduino",
    icon: Target,
  },
  {
    name: "Ayesha Ali",
    role: "Competition Coordinator",
    expertise: "Event Management, Team Building",
    icon: Trophy,
  },
  {
    name: "Rashid Islam",
    role: "Hardware & Electronics Expert",
    expertise: "Circuit Design, Sensor Integration",
    icon: Award,
  },
  {
    name: "Sara Ahmed",
    role: "Youth Program Director",
    expertise: "Educational Psychology, Student Engagement",
    icon: Users,
  },
];

const TEAM_ICON_COLORS = [
  "text-indigo-500",
  "text-blue-500",
  "text-purple-500",
  "text-indigo-500",
  "text-blue-500",
  "text-purple-500",
];

const TEAM_BG_COLORS = [
  "bg-indigo-100",
  "bg-blue-100",
  "bg-purple-100",
  "bg-indigo-100",
  "bg-blue-100",
  "bg-purple-100",
];

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="text-center mb-12">
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
      {title}
    </h2>
    {subtitle && (
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
    )}
  </div>
);

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Header */}
      <section
        className="relative text-white py-24 px-6 overflow-hidden"
        style={{
          backgroundImage: "url('/roboclass.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-300 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">About Robonauts Club</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
              Where Innovation Meets Curiosity
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Empowering young minds through hands-on STEM education in Dhaka.
              Join us in exploring the exciting world of robotics, automation,
              and innovation.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          
             {/* Who We Are Section */}
          <section className="mb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                  Who We Are
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Founded in 2022, <strong className="text-indigo-500">Robonauts Club</strong> delivers engaging
                    STEM education through real-world projects.
                  </p>
                  <p>
                    We help students turn curiosity into confidence, providing
                    hands-on learning experiences that prepare them for future
                    challenges in technology and engineering.
                  </p>
                </div>
              </div>

              <div className="h-80 bg-linear-to-br from-indigo-400 via-blue-400 to-purple-400 rounded-2xl flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                <Image
                  src="/pocketcinema.jpg"
                  alt="Robonauts Workshop"
                  
                  priority
                  width={1000}
                  height={1000}
                />
              </div>
            </div>
          </section>
          {/* Achievements & Impact Section - Moved to Top */}
          <section className="mb-20">
            <SectionHeader
              title="Our Achievements & Impact"
              subtitle="Celebrating milestones and student success"
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {STATS.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center hover:shadow-md transition-shadow"
                  >
                    <Icon
                      className={`w-8 h-8 ${STAT_ICON_COLORS[index]} mx-auto mb-3`}
                    />
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="bg-linear-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 md:p-12 border border-indigo-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Making a Difference
              </h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Student Success Stories
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Our students have gone on to win national robotics
                    competitions, secure scholarships, and pursue careers in
                    engineering and technology. Many have represented Bangladesh in
                    international robotics olympiads.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Community Impact
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    We&apos;ve partnered with schools across Dhaka to bring
                    robotics education to underserved communities, organizing free
                    workshops and providing resources to students who might not
                    otherwise have access to STEM education.
                  </p>
                </div>
              </div>
            </div>
          </section>

         

          {/* Core Values Section */}
          <section className="mb-20">
            <SectionHeader
              title="Our Core Values"
              subtitle="The principles that guide everything we do"
            />

            <div className="grid md:grid-cols-3 gap-6">
              {CORE_VALUES.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* What We Do Section */}
          <section className="mb-20 bg-white py-20 rounded-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeader
                title="What We Do"
                subtitle="Comprehensive robotics and STEM education programs"
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {WHAT_WE_DO_ITEMS.map((item, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Team / Mentors Section */}
          <section className="mb-20 bg-white py-20 rounded-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionHeader
                title="Our Team & Mentors"
                subtitle="Meet the passionate educators guiding our students"
              />
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TEAM_MEMBERS.map((member, index) => {
                  const Icon = member.icon;
                  return (
                    <div
                      key={index}
                      className="p-6 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl ${TEAM_BG_COLORS[index]} flex items-center justify-center mb-4`}
                      >
                        <Icon className={`w-6 h-6 ${TEAM_ICON_COLORS[index]}`} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {member.name}
                      </h3>
                      <p className={`text-sm font-semibold ${TEAM_ICON_COLORS[index]} mb-2`}>
                        {member.role}
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {member.expertise}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          {/* Contact Information & Location Section - Moved to Top */}
          <section className="mb-20">
            <SectionHeader title="Contact Information" subtitle="Get in touch with us" />

            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              <div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                        <p className="text-gray-700">Uttara, Dhaka, Bangladesh, 1230</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Service Area</p>
                        <p className="text-gray-700">Dhaka, Dhaka Division, Bangladesh</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Mobile</p>
                        <p className="text-gray-700">01824-863366</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">WhatsApp</p>
                        <p className="text-gray-700">+880 1824-863366</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                        <a href="mailto:info@robonautsclub.com" className="text-gray-700 hover:text-indigo-600 transition-colors">
                          info@robonautsclub.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-sm bg-white">
                  <MapClient />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
