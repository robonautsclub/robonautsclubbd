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
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
            current === cat
              ? 'bg-[#003B73] text-white shadow-md' // Brand Blue
              : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

const PostCard = ({ post }: { post: Post }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 hover:shadow-md transition-shadow">
    {/* Header */}
    <div className="flex items-center mb-4">
      <Image
        src={post.avatar}
        alt={post.author}
        className="w-10 h-10 rounded-full bg-gray-100"
        width={40}
        height={40}
      />
      <div className="ml-3">
        <h3 className="text-sm font-bold text-[#2C2C2C]">{post.author}</h3>
        <p className="text-xs text-gray-500">{post.date}</p>
      </div>
      <span className={`ml-auto px-2 py-1 text-xs font-medium rounded-md ${
        post.category === 'Workshops' ? 'bg-purple-100 text-purple-700' :
        post.category === 'Achievements' ? 'bg-yellow-100 text-yellow-700' :
        post.category === 'Events' ? 'bg-pink-100 text-pink-700' :
        'bg-blue-100 text-[#003B73]'
      }`}>
        {post.category}
      </span>
    </div>

    {/* Content */}
    <p className="text-[#2C2C2C] text-sm md:text-base leading-relaxed mb-4 whitespace-pre-line">
      {post.content}
    </p>

    {/* Image Attachment */}
    {post.image && (
      <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
        <Image
          src={post.image}
          alt="Post attachment"
          className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
          width={600}
          height={256}
          style={{ width: '100%', height: '16rem' }}
        />
      </div>
    )}

    {/* Footer / Actions */}
    <div className="flex items-center pt-4 border-t border-gray-50 text-gray-500 text-sm">
      <button className="flex items-center space-x-2 hover:text-[#D61C4E] transition-colors group">
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span>{post.likes} Likes</span>
      </button>
      
      <button className="flex items-center space-x-2 ml-6 hover:text-[#003B73] transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>{post.comments} Comments</span>
      </button>

      <button className="ml-auto flex items-center space-x-2 hover:text-[#003B73]">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
    </div>
  </div>
);

const SidebarCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
    <h3 className="font-bold text-[#003B73] text-lg mb-4 border-b border-gray-100 pb-2">{title}</h3>
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
    <div className="min-h-screen bg-[#F3F6F9] pt-10 pb-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar (Desktop only) - Profile/Quick Stats */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center sticky top-24">
             <div className="w-20 h-20 mx-auto bg-linear-to-tr from-[#003B73] to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
               RC
             </div>
             <h2 className="text-xl font-bold text-[#2C2C2C]">Robonauts Club</h2>
             <p className="text-sm text-gray-500 mb-6">Empowering Future Innovators</p>
             
             <div className="grid grid-cols-2 gap-2 mb-6 text-left">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <span className="block text-xl font-bold text-[#003B73]">1.2k</span>
                  <span className="text-xs text-gray-600">Members</span>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <span className="block text-xl font-bold text-[#D61C4E]">85</span>
                  <span className="text-xs text-gray-600">Projects</span>
                </div>
             </div>
             
             <button className="w-full py-2 bg-[#D61C4E] hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-md">
               Post Update
             </button>
          </div>
        </div>

        {/* Center Feed */}
        <div className="lg:col-span-2">
          {/* Feed Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#2C2C2C] mb-2">Activity Feed</h1>
            <p className="text-gray-500 text-sm">Latest updates from our workshops and students.</p>
          </div>

          <CategoryFilter current={activeCategory} onSelect={setActiveCategory} />

          {/* Create Post Input Placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex items-center space-x-4">
             <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
             <div className="grow bg-gray-50 h-10 rounded-full flex items-center px-4 text-gray-400 text-sm cursor-text hover:bg-gray-100 transition-colors">
               What&apos;s happening at the club?
             </div>
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-10 text-gray-500">
                No posts found in this category.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Events & Info */}
        <div className="lg:col-span-1 space-y-6">
          <SidebarCard title="Upcoming Events">
            <ul className="space-y-4">
              {UPCOMING_EVENTS.map(event => (
                <li key={event.id} className="flex space-x-3 group cursor-pointer">
                  <div className="shrink-0 w-12 text-center bg-blue-50 rounded-lg py-2 group-hover:bg-[#003B73] group-hover:text-white transition-colors">
                    <span className="block text-xs font-bold uppercase text-gray-500 group-hover:text-blue-200">
                      {event.date.split(' ')[0]}
                    </span>
                    <span className="block text-lg font-bold text-[#003B73] group-hover:text-white">
                      {event.date.split(' ')[1].replace(',', '')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#003B73] transition-colors">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <button className="w-full mt-4 text-sm text-[#003B73] font-medium hover:underline">
              View Calendar →
            </button>
          </SidebarCard>

          <SidebarCard title="Contact Support">
            <p className="text-sm text-gray-600 mb-4">
              Need help with registration or workshop details?
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-700">
                <span className="font-semibold w-16">Phone:</span>
                <a href="tel:01824863366" className="hover:text-[#D61C4E]">01824-863366</a>
              </div>
              <div className="flex items-center text-gray-700">
                <span className="font-semibold w-16">Email:</span>
                <a href="mailto:info@robonautsclub.com" className="hover:text-[#D61C4E]">info@robonautsclub.com</a>
              </div>
            </div>
          </SidebarCard>
        </div>

      </div>
    </div>
  );
};

export default Feed;