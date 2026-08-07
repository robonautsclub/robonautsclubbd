export type RobofestCampusAmbassador = {
  id: string
  name: string
  school: string
}

/** Public dropdown shows name + school only. */
export const ROBOFEST_CAMPUS_AMBASSADORS: RobofestCampusAmbassador[] = [
  { id: '01', name: 'Abdullah Al Munem Nehal', school: 'Sena Public School & College' },
  { id: '02', name: 'Abidur Rahim Manam', school: 'Dhaka Residential Model College' },
  { id: '03', name: 'Ahnaf Tajwar', school: 'Manarat Dhaka International School & College' },
  { id: '04', name: 'Alisha Mahazabin', school: 'Dhaka Cantonment Girls Public School & College' },
  { id: '05', name: 'Benojir Siddique Ava', school: 'Viqarunnisa Noon College (Dhanmondi Branch)' },
  { id: '06', name: 'Farhan Mazid Safwan', school: 'Udayan Higher Secondary School & College' },
  { id: '07', name: 'Ibrahim Khalid Saad', school: 'National Ideal College' },
  { id: '08', name: 'Jawat Chowdhury', school: 'Motijheel Model School & College' },
  { id: '09', name: 'Kazi Taseen Ul Bashar', school: 'Sunbeams School' },
  { id: '10', name: 'Maruf Hossain Faruk', school: 'BAF Shaheen College Dhaka' },
  { id: '11', name: 'Masfia Zaman', school: 'Rajuk Uttara Model College' },
  { id: '12', name: 'Md Forhad Ahmed Shoikot', school: 'BPATC College, Savar' },
  { id: '13', name: 'Md Idrak Karim', school: 'Scholastica' },
  { id: '14', name: 'Md Jahidul Islam', school: 'Dhaka Imperial College' },
  { id: '15', name: 'Md Shahin', school: 'Dhaka College' },
  { id: '16', name: 'Md Tanjim Alam', school: 'South Breeze School' },
  { id: '17', name: 'Md Tasrik Islam', school: 'Cantonment Public School & College Lalmonirhat' },
  { id: '18', name: 'Md. Muktakin', school: 'Dhaka Northern City College' },
  { id: '19', name: 'Md.MohtasimTahmid', school: 'Nirjhor Cantonment Public School & College' },
  { id: '20', name: 'Mehedi Hasan Zayed', school: 'Armed Police Battalion School & College Dhaka' },
  { id: '21', name: 'Mohammad Zafar Khan Fahad', school: 'Rajarbag Police Line School & College' },
  { id: '22', name: 'Mojahed Uddin Sijon', school: 'St. Joseph Higher Secondary School' },
  { id: '23', name: "Pritidipa Das", school: "CTG Govt. Womens' College" },
  { id: '24', name: 'Ramisa Tasnim Rahman', school: 'Lalmatia Girls High School & College' },
  { id: '25', name: 'Shahreen Mubashira', school: 'SOS Hermann Gmeiner College Dhaka' },
  { id: '26', name: 'Sheikh Md Hamim', school: 'Dr Mahbubur Rahman Mollah College' },
  { id: '27', name: 'Sneha Ahmed', school: 'Holy Cross College' },
  { id: '28', name: 'Tahsin Chowdhury Omar', school: 'Govt Shahid Suhrawardy College' },
  { id: '29', name: 'Wafia Nirsar Rahman', school: 'Viqarunnisa Noon College (Main Branch)' },
  { id: '30', name: 'Zubaer Riyad', school: 'Rajshahi College' },
]

export function getRobofestCampusAmbassadorById(
  id: string,
): RobofestCampusAmbassador | undefined {
  return ROBOFEST_CAMPUS_AMBASSADORS.find((a) => a.id === id)
}

export function formatCampusAmbassadorLabel(a: RobofestCampusAmbassador): string {
  return `${a.name} · ${a.school}`
}

/** Unique school names from the campus ambassador roster (for directory seed). */
export function getRobofestCampusAmbassadorSchools(): string[] {
  const seen = new Set<string>()
  const schools: string[] = []
  for (const a of ROBOFEST_CAMPUS_AMBASSADORS) {
    const name = a.school.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    schools.push(name)
  }
  return schools.sort((a, b) => a.localeCompare(b))
}
