'use client'
import React, { useState } from 'react';
import Image from 'next/image';

// --- Types ---

type Category = 'All' | 'Workshops' | 'Events' | 'Achievements' | 'News';

interface Post {
  id: number;
  author: string;
  avatar: string; // URL for the author avatar
  date: string;
  category: Category;
  content: string;
  image?: string; // Optional URL for post image
  likes: number;
  comments: number;
}

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
}

// --- Mock Data ---

const POSTS: Post[] = [
  {
    id: 1,
    author: 'Robonauts Club Admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    date: '2 hours ago',
    category: 'Workshops',
    content: '🚀 Registration is now OPEN for our "Intro to Arduino" weekend workshop! Students will learn how to build their first line-follower robot. Limited seats available in Uttara batch.',
    image: 'https://images.unsplash.com/photo-1555677284-6a6f971638e0?auto=format&fit=crop&q=80&w=1000',
    likes: 45,
    comments: 12,
  },
  {
    id: 2,
    author: 'Mentorship Team',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mentor',
    date: 'Yesterday at 4:00 PM',
    category: 'Achievements',
    content: 'Huge congratulations to our Senior Team for securing 2nd place at the Dhaka Regional Science Fair! 🥈 Your eco-friendly irrigation system impressed the judges. We are so proud!',
    image: 'https://images.unsplash.com/photo-1567168544813-cc03465b4fa8?auto=format&fit=crop&q=80&w=1000',
    likes: 128,
    comments: 34,
  },
  {
    id: 3,
    author: 'Robonauts Club Admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    date: 'Jan 5, 2026',
    category: 'News',
    content: 'We are excited to announce our new partnership with local tech firms to provide internship opportunities for our advanced coding students. Real-world experience starts here.',
    likes: 89,
    comments: 5,
  },
  {
    id: 4,
    author: 'Event Coordinator',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Event',
    date: 'Jan 2, 2026',
    category: 'Events',
    content: 'Don\'t miss our "Parent-Teacher STEM Night" this Friday. Come see what your children have been building and discuss their future path in engineering.',
    likes: 56,
    comments: 8,
  },
];

const UPCOMING_EVENTS: Event[] = [
  { id: 1, title: 'Python for Kids Batch 4', date: 'Jan 10, 10:00 AM', location: 'Lab A, Uttara' },
  { id: 2, title: 'National Robotics Prep', date: 'Jan 15, 3:00 PM', location: 'Main Hall' },
  { id: 3, title: 'Science Fair Showcase', date: 'Jan 22, 9:00 AM', location: 'City Convention Ctr' },
];

// --- Components ---

const CategoryFilter = ({ 
  current, 
  onSelect 
}: { 
  current: Category; 
  onSelect: (c: Category) => void 
}) => {
  const categories: Category[] = ['All', 'Workshops', 'Events', 'Achievements', 'News'];
  
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 transform ${
            current === cat
              ? 'bg-gradient-to-r from-[#003B73] to-[#0056b3] text-white shadow-lg shadow-blue-500/30 scale-105' 
              : 'bg-white text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-blue-200 hover:shadow-md hover:scale-105'
          }`}
        >
          {cat}
          {current === cat && (
            <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-[#D61C4E] to-pink-500 rounded-full"></span>
          )}
        </button>
      ))}
    </div>
  );
};

const PostCard = ({ post }: { post: Post }) => (
  <article className="group bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6 hover:shadow-xl hover:border-blue-100 transition-all duration-300 transform hover:-translate-y-1">
    {/* Header */}
    <div className="flex items-start mb-5">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#003B73] to-blue-600 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
        <Image
          src={post.avatar}
          alt={post.author}
          className="relative w-12 h-12 rounded-full bg-gray-100 ring-2 ring-white shadow-md"
          width={48}
          height={48}
        />
      </div>
      <div className="ml-4 flex-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#2C2C2C] group-hover:text-[#003B73] transition-colors">{post.author}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{post.date}</p>
          </div>
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm ${
            post.category === 'Workshops' ? 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200' :
            post.category === 'Achievements' ? 'bg-gradient-to-r from-yellow-100 to-amber-50 text-yellow-700 border border-yellow-200' :
            post.category === 'Events' ? 'bg-gradient-to-r from-pink-100 to-rose-50 text-pink-700 border border-pink-200' :
            'bg-gradient-to-r from-blue-100 to-indigo-50 text-[#003B73] border border-blue-200'
          }`}>
            {post.category}
          </span>
        </div>
      </div>
    </div>

    {/* Content */}
    <p className="text-[#2C2C2C] text-base leading-relaxed mb-5 whitespace-pre-line">
      {post.content}
    </p>

    {/* Image Attachment */}
    {post.image && (
      <div className="mb-5 rounded-2xl overflow-hidden border border-gray-100 shadow-inner group/image">
        <div className="relative overflow-hidden">
          <Image
            src={post.image}
            alt="Post attachment"
            className="w-full h-72 object-cover group-hover/image:scale-110 transition-transform duration-700"
            width={600}
            height={288}
            style={{ width: '100%', height: '18rem' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity"></div>
        </div>
      </div>
    )}

    {/* Footer / Actions */}
    <div className="flex items-center pt-5 border-t border-gray-100 text-gray-600">
      <button className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-red-50 hover:text-[#D61C4E] transition-all duration-200 group/btn">
        <svg className="w-5 h-5 group-hover/btn:scale-125 group-hover/btn:fill-[#D61C4E] transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="font-medium">{post.likes}</span>
      </button>
      
      <button className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-blue-50 hover:text-[#003B73] transition-all duration-200 group/btn">
        <svg className="w-5 h-5 group-hover/btn:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="font-medium">{post.comments}</span>
      </button>

      <button className="ml-auto flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-gray-50 hover:text-[#003B73] transition-all duration-200">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
    </div>
  </article>
);

const SidebarCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6 hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center mb-5 pb-4 border-b border-gray-100">
      <div className="w-1 h-6 bg-gradient-to-b from-[#003B73] to-[#D61C4E] rounded-full mr-3"></div>
      <h3 className="font-bold text-[#003B73] text-lg">{title}</h3>
    </div>
    {children}
  </div>
);

// --- Main Page ---

const Feed = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const filteredPosts = activeCategory === 'All' 
    ? POSTS 
    : POSTS.filter(post => post.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F6F9] via-white to-blue-50/30 pt-12 pb-24 px-4 md:px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar (Desktop only) - Profile/Quick Stats */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 text-center sticky top-24 overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#003B73] via-blue-600 to-[#D61C4E] opacity-10 blur-3xl"></div>
              <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-[#003B73] to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-xl ring-4 ring-blue-100">
                RC
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#2C2C2C] mb-1">Robonauts Club</h2>
            <p className="text-sm text-gray-500 mb-6">Empowering Future Innovators</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                <span className="block text-2xl font-bold bg-gradient-to-r from-[#003B73] to-blue-600 bg-clip-text text-transparent">1.2k</span>
                <span className="text-xs text-gray-600 font-medium">Members</span>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl border border-red-100 hover:shadow-md transition-shadow">
                <span className="block text-2xl font-bold bg-gradient-to-r from-[#D61C4E] to-pink-600 bg-clip-text text-transparent">85</span>
                <span className="text-xs text-gray-600 font-medium">Projects</span>
              </div>
            </div>
            
            <button className="w-full py-3 bg-gradient-to-r from-[#D61C4E] to-pink-600 hover:from-[#c01a45] hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105">
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Post Update</span>
              </span>
            </button>
          </div>
        </div>

        {/* Center Feed */}
        <div className="lg:col-span-2">
          {/* Feed Header */}
          <div className="mb-10">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-1 h-8 bg-gradient-to-b from-[#003B73] to-[#D61C4E] rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-[#2C2C2C] to-[#003B73] bg-clip-text text-transparent">Activity Feed</h1>
                <p className="text-gray-500 text-sm mt-1">Latest updates from our workshops and students.</p>
              </div>
            </div>
          </div>

          <CategoryFilter current={activeCategory} onSelect={setActiveCategory} />

          {/* Create Post Input Placeholder */}
          <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-5 mb-8 hover:shadow-lg transition-all duration-300 group cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#003B73] to-blue-600 shrink-0 shadow-md ring-2 ring-white"></div>
              <div className="flex-1 bg-gradient-to-r from-gray-50 to-blue-50/50 h-12 rounded-2xl flex items-center px-5 text-gray-400 text-sm border border-gray-100 group-hover:border-blue-200 group-hover:from-blue-50 group-hover:to-indigo-50 transition-all">
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                  <span>What&apos;s happening at the club?</span>
                </span>
              </div>
            </div>
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No posts found in this category.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Events & Info */}
        <div className="lg:col-span-1 space-y-6">
          <SidebarCard title="Upcoming Events">
            <ul className="space-y-4">
              {UPCOMING_EVENTS.map(event => (
                <li key={event.id} className="flex space-x-3 group cursor-pointer p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                  <div className="shrink-0 w-14 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl py-2.5 group-hover:from-[#003B73] group-hover:to-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md border border-blue-100 group-hover:border-blue-500">
                    <span className="block text-xs font-bold uppercase text-gray-500 group-hover:text-blue-100 transition-colors">
                      {event.date.split(' ')[0]}
                    </span>
                    <span className="block text-lg font-bold text-[#003B73] group-hover:text-white transition-colors">
                      {event.date.split(' ')[1].replace(',', '')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#003B73] transition-colors line-clamp-2">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{event.location}</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <button className="w-full mt-5 py-2.5 text-sm text-[#003B73] font-semibold hover:bg-blue-50 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 group">
              <span>View Calendar</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </SidebarCard>

          <SidebarCard title="Contact Support">
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Need help with registration or workshop details?
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mr-3 group-hover:from-blue-200 group-hover:to-indigo-200 transition-colors">
                  <svg className="w-5 h-5 text-[#003B73]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Phone</span>
                  <a href="tel:01824863366" className="text-[#003B73] font-semibold hover:text-[#D61C4E] transition-colors">01824-863366</a>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center mr-3 group-hover:from-red-200 group-hover:to-pink-200 transition-colors">
                  <svg className="w-5 h-5 text-[#D61C4E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-medium block">Email</span>
                  <a href="mailto:info@robonautsclub.com" className="text-[#003B73] font-semibold hover:text-[#D61C4E] transition-colors break-all">info@robonautsclub.com</a>
                </div>
              </div>
            </div>
          </SidebarCard>
        </div>

      </div>
    </div>
  );
};

export default Feed;