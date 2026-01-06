"use client";

import dynamic from "next/dynamic";

/**
 * Leaflet map must be dynamically loaded on the client
 */
const MapClient = dynamic(() => import("./MapClient"), {
  ssr: false,
});

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="text-center mb-14">
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
      {title}
    </h2>
    {subtitle && (
      <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
    )}
  </div>
);

export default function AboutPage() {
  return (
    <main className="bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-28">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
            Where Innovation Meets{" "}
            <span className="text-blue-300">Curiosity</span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-3xl mx-auto">
            Empowering young minds through hands-on STEM education in Dhaka.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="py-20 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6">Who We Are</h2>
          <p className="text-gray-600 mb-4">
            Founded in 2022, <strong>Robonauts Club</strong> delivers engaging
            STEM education through real-world projects.
          </p>
          <p className="text-gray-600">
            We help students turn curiosity into confidence.
          </p>
        </div>

        <div className="h-72 md:h-96 bg-gray-200 rounded-2xl flex items-center justify-center text-gray-500">
          Workshop Image
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader title="Our Core Values" />

          <div className="grid md:grid-cols-3 gap-8">
            {[
              ["Innovation", "Creative problem solving"],
              ["Collaboration", "Learning together"],
              ["Empowerment", "Building confidence"],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="p-8 rounded-2xl border bg-gray-50 hover:shadow-md transition"
              >
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <SectionHeader title="Visit Us" subtitle="Uttara, Dhaka" />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border">
              <p>📍 Uttara, Dhaka</p>
              <p>📞 01824-863366</p>
              <p>✉️ info@robonautsclub.com</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <MapClient />
          </div>
        </div>
      </section>
    </main>
  );
}
