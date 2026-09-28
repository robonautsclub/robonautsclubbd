// Shared events data
export type Event = {
  id: number
  title: string
  date: string
  time: string
  location: string
  description: string
  fullDescription?: string
  image: string
  eligibility?: string
  venue?: string
  agenda?: string
}

export const eventsData: Event[] = [
  {
    id: 1,
    title: 'RoboFest 2024 - National Qualifier',
    date: '2026-12-15',
    time: '10:00 AM - 5:00 PM',
    location: 'Uttara Community Center, Dhaka',
    venue: 'Uttara Community Center, Sector 7, Uttara, Dhaka',
    description:
      'Robonauts Club is hosting the official Bangladesh qualifier for RoboFest 2024! Teams will compete in innovative robotics challenges.',
    fullDescription:
      'Join us for the most exciting robotics competition of the year! This national qualifier brings together talented students from across Bangladesh to compete in various robotics challenges including line following, obstacle avoidance, and creative design categories. Winners will represent Bangladesh in the international RoboFest competition.',
    eligibility: 'Open for students in grades 3-12. Teams of 2-4 members.',
    image: '/robotics-event.jpg',
    agenda: '10:00 AM - 10:30 AM: Registration and Welcome\n10:30 AM - 11:00 AM: Opening Ceremony & Rules Briefing\n11:00 AM - 12:30 PM: Round 1 - Line Following Competition\n12:30 PM - 1:30 PM: Lunch Break\n1:30 PM - 3:00 PM: Round 2 - Obstacle Avoidance Challenge\n3:00 PM - 3:15 PM: Break\n3:15 PM - 4:30 PM: Round 3 - Creative Design Presentation\n4:30 PM - 5:00 PM: Results Announcement & Award Ceremony',
  },
  {
    id: 2,
    title: 'STEM Discovery Workshop',
    date: '2024-11-20',
    time: '2:00 PM - 5:00 PM',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'Explore hands-on science and engineering experiments designed for curious young minds.',
    fullDescription:
      'A comprehensive workshop introducing students to the fundamentals of STEM through interactive experiments. Participants will build simple circuits, explore basic programming concepts, and engage in team-based problem-solving activities. Perfect for beginners!',
    eligibility: 'Ideal for ages 8-16. No prior experience required.',
    image: '/workshop_kids.jpg',
    agenda: '2:00 PM - 2:15 PM: Welcome and Introduction to STEM\n2:15 PM - 3:00 PM: Hands-on Circuit Building Activity\n3:00 PM - 3:15 PM: Break and Refreshments\n3:15 PM - 4:00 PM: Basic Programming Concepts Session\n4:00 PM - 4:45 PM: Team Problem-Solving Challenge\n4:45 PM - 5:00 PM: Q&A and Closing Remarks',
  },
  {
    id: 3,
    title: 'Summer Coding Bootcamp',
    date: '2024-08-14',
    time: '4:00 PM - 7:00 PM (Daily)',
    location: 'Online/Remote',
    venue: 'Online via Zoom',
    description:
      'A weeklong intensive bootcamp on block coding, Python, and real-world robotics applications.',
    fullDescription:
      'An intensive week-long program covering block coding fundamentals, Python programming basics, and their applications in robotics. Students will complete multiple projects and receive certificates upon completion. Daily sessions with hands-on coding exercises.',
    eligibility: 'Ages 10-18. Basic computer skills recommended.',
    image: '/coding_bootcamp.jpg',
  },
  {
    id: 4,
    title: 'Robotics Olympiad Preparation',
    date: '2026-09-10',
    time: '3:00 PM - 6:00 PM',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'Specialized training program for students preparing for robotics olympiads and competitions.',
    fullDescription:
      'Focused training sessions covering competition strategies, advanced problem-solving techniques, and teamwork skills. Includes mock competitions and personalized feedback from experienced mentors.',
    eligibility: 'Students preparing for competitions. Intermediate level required.',
    image: '/robotics-event.jpg',
  },
  // Additional upcoming events
  {
    id: 5,
    title: 'Arduino Robotics Workshop',
    date: '2025-01-10',
    time: '10:00 AM - 4:00 PM',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'Learn to build and program robots using Arduino microcontrollers. Perfect for intermediate learners.',
    fullDescription:
      'A hands-on workshop covering Arduino programming, sensor integration, and motor control. Participants will build their own line-following robot and learn to program it for various challenges. All materials provided.',
    eligibility: 'Ages 12-18. Basic programming knowledge recommended.',
    image: '/robotics-event.jpg',
  },
  {
    id: 6,
    title: 'Robotics Innovation Challenge',
    date: '2025-01-25',
    time: '9:00 AM - 6:00 PM',
    location: 'Uttara Community Center, Dhaka',
    venue: 'Uttara Community Center, Sector 7, Uttara, Dhaka',
    description:
      'A day-long innovation challenge where teams design and build solutions to real-world problems using robotics.',
    fullDescription:
      'Teams will be given real-world problems to solve using robotics. This challenge encourages creativity, innovation, and teamwork. Judges from the robotics industry will evaluate projects. Prizes and certificates for winners.',
    eligibility: 'Open to all students. Teams of 3-5 members.',
    image: '/robotics-event.jpg',
  },
  {
    id: 7,
    title: 'Python for Robotics Bootcamp',
    date: '2025-02-05',
    time: '3:00 PM - 6:00 PM (5 sessions)',
    location: 'Online/Remote',
    venue: 'Online via Zoom',
    description:
      'Learn Python programming specifically for robotics applications. From basics to advanced control systems.',
    fullDescription:
      'A comprehensive 5-session bootcamp covering Python fundamentals, libraries for robotics (like PySerial, OpenCV), and building control systems. Each session includes hands-on coding exercises and mini-projects.',
    eligibility: 'Ages 14-18. No prior Python experience required.',
    image: '/coding_bootcamp.jpg',
  },
  {
    id: 8,
    title: 'Junior Robotics Explorer',
    date: '2025-02-15',
    time: '2:00 PM - 4:00 PM',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'An introductory workshop designed specifically for younger students to explore the world of robotics.',
    fullDescription:
      'A fun and engaging workshop for young learners. Students will build simple robots, learn basic concepts, and participate in interactive activities. Perfect introduction to robotics and STEM.',
    eligibility: 'Ages 6-10. No prior experience needed.',
    image: '/workshop_kids.jpg',
  },
  {
    id: 9,
    title: 'Advanced Robot Design & AI',
    date: '2026-03-01',
    time: '10:00 AM - 5:00 PM',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'Advanced workshop covering AI integration in robotics, machine learning, and autonomous navigation.',
    fullDescription:
      'For advanced students ready to take their robotics skills to the next level. Topics include computer vision, machine learning for robotics, path planning, and autonomous navigation. Includes hands-on projects with AI-powered robots.',
    eligibility: 'Ages 16+. Advanced programming and robotics experience required.',
    image: '/robotics-event.jpg',
  },
  {
    id: 10,
    title: 'Robotics Career Fair & Expo',
    date: '2025-03-20',
    time: '11:00 AM - 4:00 PM',
    location: 'Uttara Community Center, Dhaka',
    venue: 'Uttara Community Center, Sector 7, Uttara, Dhaka',
    description:
      'Explore career opportunities in robotics and meet industry professionals. Student project showcase included.',
    fullDescription:
      'A comprehensive career fair featuring robotics companies, universities, and professionals. Students can showcase their projects, network with industry experts, and learn about career paths in robotics and engineering. Free admission.',
    eligibility: 'Open to all students and parents.',
    image: '/robotics-event.jpg',
  },
  {
    id: 11,
    title: 'Drone Programming Workshop',
    date: '2025-04-05',
    time: '10:00 AM - 3:00 PM',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'Learn to program and control drones for various applications including aerial photography and autonomous flight.',
    fullDescription:
      'An exciting workshop introducing students to drone technology and programming. Participants will learn about flight controls, programming flight paths, and using drones for practical applications. Hands-on flying sessions included with safety protocols.',
    eligibility: 'Ages 12-18. Basic programming knowledge helpful but not required.',
    image: '/robotics-event.jpg',
  },
  {
    id: 12,
    title: '3D Printing & Robotics Integration',
    date: '2025-04-18',
    time: '2:00 PM - 6:00 PM',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'Discover how 3D printing revolutionizes robotics by creating custom parts and components for your projects.',
    fullDescription:
      'Learn to design and 3D print custom components for robotics projects. This workshop covers 3D modeling basics, printer operation, and integrating 3D-printed parts into robotic systems. Participants will design and print their own robot component.',
    eligibility: 'Ages 14-18. Interest in design and engineering recommended.',
    image: '/robotics-event.jpg',
  },
  {
    id: 13,
    title: 'Robotics for Girls - Empowerment Workshop',
    date: '2025-05-03',
    time: '10:00 AM - 4:00 PM',
    location: 'Uttara Community Center, Dhaka',
    venue: 'Uttara Community Center, Sector 7, Uttara, Dhaka',
    description:
      'A special workshop designed to encourage and empower girls in robotics and STEM fields.',
    fullDescription:
      'An inclusive workshop celebrating girls in robotics! Featuring female mentors from the robotics industry, hands-on projects, and discussions about careers in STEM. This event aims to inspire and support the next generation of female engineers and innovators.',
    eligibility: 'Open to girls ages 10-18. All skill levels welcome.',
    image: '/workshop_kids.jpg',
  },
  {
    id: 14,
    title: 'Sensor Integration Masterclass',
    date: '2025-05-15',
    time: '3:00 PM - 7:00 PM',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'Master the art of integrating various sensors (ultrasonic, infrared, temperature) into your robotics projects.',
    fullDescription:
      'Deep dive into sensor technology and integration. Learn to work with multiple sensor types, process sensor data, and create responsive robotic systems. Hands-on projects include building a multi-sensor robot that can navigate and respond to its environment.',
    eligibility: 'Ages 14-18. Intermediate robotics experience required.',
    image: '/robotics-event.jpg',
  },
  {
    id: 15,
    title: 'RoboFest 2025 - Regional Qualifier',
    date: '2025-06-01',
    time: '9:00 AM - 6:00 PM',
    location: 'Uttara Community Center, Dhaka',
    venue: 'Uttara Community Center, Sector 7, Uttara, Dhaka',
    description:
      'The biggest robotics competition of the year! Regional qualifier for RoboFest 2025 international competition.',
    fullDescription:
      'Join hundreds of teams competing in multiple categories including autonomous navigation, sumo wrestling, line following, and creative design. Winners advance to the national championship. This is the premier robotics competition event in Bangladesh with prizes, trophies, and recognition for top performers.',
    eligibility: 'Open for students in grades 3-12. Teams of 2-4 members required.',
    image: '/robotics-event.jpg',
  },
  {
    id: 16,
    title: 'Summer Robotics Camp 2025',
    date: '2025-06-20',
    time: '9:00 AM - 4:00 PM (5 days)',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'An intensive 5-day summer camp covering all aspects of robotics from building to programming to competition.',
    fullDescription:
      'Our flagship summer program! Five full days of immersive robotics learning. Students will build multiple robots, learn advanced programming, participate in daily challenges, and complete a final project. Includes lunch, materials, and certificate. Perfect for students looking to accelerate their robotics journey.',
    eligibility: 'Ages 10-16. All skill levels welcome. Limited to 30 participants.',
    image: '/workshop_kids.jpg',
  },
  {
    id: 17,
    title: 'IoT & Smart Robotics Workshop',
    date: '2025-07-10',
    time: '10:00 AM - 5:00 PM',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'Learn to build Internet of Things (IoT) enabled robots that can be controlled remotely and share data online.',
    fullDescription:
      'Explore the intersection of robotics and IoT technology. Build robots that connect to the internet, can be controlled via mobile apps, and collect and share data. Topics include WiFi modules, cloud connectivity, and remote monitoring systems.',
    eligibility: 'Ages 16+. Advanced programming and electronics knowledge required.',
    image: '/robotics-event.jpg',
  },
  {
    id: 18,
    title: 'Robotics Parent-Child Workshop',
    date: '2026-07-25',
    time: '2:00 PM - 5:00 PM',
    location: 'Robonauts Club Lab, Uttara',
    venue: 'Robonauts Club Lab, Sector 7, Uttara, Dhaka',
    description:
      'A special workshop where parents and children build robots together, fostering family bonding through STEM.',
    fullDescription:
      'A unique opportunity for families to learn robotics together! Parents and children work as a team to build and program a robot. This workshop promotes family engagement in STEM education and helps parents understand what their children are learning. Fun for all ages!',
    eligibility: 'Open to parent-child pairs. Children ages 8-14. No prior experience needed.',
    image: '/workshop_kids.jpg',
    agenda: '2:00 PM - 2:20 PM: Welcome and Introduction\n2:20 PM - 3:00 PM: Building Your First Robot Together\n3:00 PM - 3:15 PM: Break and Family Networking\n3:15 PM - 4:00 PM: Programming and Testing Session\n4:00 PM - 4:45 PM: Robot Challenge and Competition\n4:45 PM - 5:00 PM: Showcase and Award Certificates',
  },
  {
    id: 19,
    title: 'Mobile Robotics & App Development',
    date: '2026-08-08',
    time: '3:00 PM - 7:00 PM',
    location: 'Online/Remote',
    venue: 'Online via Zoom',
    description:
      'Create mobile apps to control your robots and learn about wireless communication protocols.',
    fullDescription:
      'Learn to develop mobile applications for robot control. This workshop covers app development basics, Bluetooth/WiFi communication, and creating user-friendly interfaces for robot control. Participants will build a working app to control a robot.',
    eligibility: 'Ages 14-18. Basic programming knowledge recommended.',
    image: '/coding_bootcamp.jpg',
  },
  {
    id: 20,
    title: 'Robotics Showcase & Competition',
    date: '2026-08-22',
    time: '10:00 AM - 5:00 PM',
    location: 'Uttara Community Center, Dhaka',
    venue: 'Uttara Community Center, Sector 7, Uttara, Dhaka',
    description:
      'Showcase your robotics projects and compete in various challenges. Open exhibition for the community.',
    fullDescription:
      'A community-wide robotics showcase featuring student projects, live demonstrations, and friendly competitions. Open to the public! Students can display their work, compete in speed challenges, and win prizes. Great opportunity to see the amazing work being done by young robotics enthusiasts.',
    eligibility: 'Open to all. Participants must register in advance.',
    image: '/robotics-event.jpg',
  },
]

