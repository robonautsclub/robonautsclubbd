export const SCHOOL_DIRECTORY_COLLECTION = 'school_directory'
export const PRIVATE_CANDIDATE_OPTION = 'Private Candidate'
export const SCHOOL_NOT_FOUND_OPTION = '__OTHER__'

export type SchoolDirectoryEntry = {
  id: string
  name: string
  medium: 'english'
  country: 'bangladesh'
  city?: string
  isActive: boolean
  createdAt?: Date | string
  updatedAt?: Date | string
}

export type SchoolDirectoryWriteInput = {
  name: string
  city?: string
  isActive?: boolean
}

export const BANGLADESH_ENGLISH_MEDIUM_SCHOOLS: Array<{ name: string; city: string }> = [
  { name: 'Scholastica', city: 'Dhaka' },
  { name: 'Sunnydale School', city: 'Dhaka' },
  { name: 'Mastermind School', city: 'Dhaka' },
  { name: 'Sunbeams School', city: 'Dhaka' },
  { name: 'The Aga Khan School', city: 'Dhaka' },
  { name: 'American International School Dhaka', city: 'Dhaka' },
  { name: 'International School Dhaka', city: 'Dhaka' },
  { name: 'Manarat Dhaka International School and College', city: 'Dhaka' },
  { name: 'South Breeze School', city: 'Dhaka' },
  { name: 'Glenrich International School', city: 'Dhaka' },
  { name: 'Maple Leaf International School', city: 'Dhaka' },
  { name: 'Playpen School', city: 'Dhaka' },
  { name: 'Oxford International School', city: 'Dhaka' },
  { name: 'Academia', city: 'Dhaka' },
  { name: 'STS School Dhaka', city: 'Dhaka' },
  { name: 'European Standard School', city: 'Dhaka' },
  { name: 'Dhanmondi Tutorial', city: 'Dhaka' },
  { name: "Lalmatia Women's College (English Version)", city: 'Dhaka' },
  { name: 'Sir John Wilson School', city: 'Dhaka' },
  { name: 'HEED International School', city: 'Dhaka' },
  { name: 'Green Herald International School', city: 'Dhaka' },
  { name: 'Willes Little Flower School and College (English Version)', city: 'Dhaka' },
  { name: 'The New School Dhaka', city: 'Dhaka' },
  { name: 'Chittagong Grammar School', city: 'Chattogram' },
  { name: 'South Point School and College', city: 'Chattogram' },
  { name: 'Chittagong Independent University School', city: 'Chattogram' },
  { name: 'Sunshine Grammar School and College', city: 'Chattogram' },
  { name: 'Scholars School and College', city: 'Chattogram' },
  { name: 'Faujdarhat Cadet College (English Version)', city: 'Chattogram' },
  { name: 'Silverdale Preparatory and Girls High School', city: 'Chattogram' },
  { name: 'The Riverain School', city: 'Sylhet' },
  { name: 'Blue Bird School and College (English Version)', city: 'Sylhet' },
  { name: 'Sunny Hill School', city: 'Sylhet' },
  { name: 'Auckland International School', city: 'Sylhet' },
  { name: 'Scholarshome School and College', city: 'Sylhet' },
  { name: 'Rajshahi University School (English Version)', city: 'Rajshahi' },
  { name: 'Rajshahi Collegiate School (English Version)', city: 'Rajshahi' },
  { name: 'Scholars School and College Bogura', city: 'Bogura' },
  { name: 'Cantonment Public School and College Rangpur (English Version)', city: 'Rangpur' },
  { name: 'Khulna Public School and College (English Version)', city: 'Khulna' },
  { name: 'Jessore Cantonment School and College (English Version)', city: 'Jashore' },
  { name: 'Barishal Cadet College (English Version)', city: 'Barishal' },
  { name: 'Cumilla Modern High School (English Version)', city: 'Cumilla' },
  { name: 'Cantonment Public School and College, Mymensingh (English Version)', city: 'Mymensingh' },
]
