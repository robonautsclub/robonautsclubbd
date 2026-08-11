export const ROBOFEST_CAMPUS_AMBASSADORS_COLLECTION = 'robofestCampusAmbassadors'

export const PUBLIC_ROBOFEST_AMBASSADORS_TAG = 'public-robofest-ambassadors'

export type RobofestCampusAmbassador = {
  id: string
  name: string
  school: string
  phone?: string
  email?: string
  isActive: boolean
}

export type RobofestCampusAmbassadorWriteInput = {
  name: string
  school: string
  phone?: string
  email?: string
  isActive?: boolean
}

/** Seed roster used to populate Firestore (and as empty-collection fallback). */
export const ROBOFEST_CAMPUS_AMBASSADOR_SEED: RobofestCampusAmbassador[] = [
  {
    id: '01',
    name: 'Abdullah Al Munem Nehal',
    school: 'Sena Public School & College',
    phone: '01612614455',
    email: 'abdullahalmunemnehal@gmail.com',
    isActive: true,
  },
  {
    id: '02',
    name: 'Abidur Rahim Manam',
    school: 'Dhaka Residential Model College',
    phone: '01885800508',
    email: 'unbeatenmanam@gmail.com',
    isActive: true,
  },
  {
    id: '03',
    name: 'Ahnaf Tajwar',
    school: 'Manarat Dhaka International School & College',
    phone: '01670294042',
    email: 'ahnaftajwar29nafi@gmail.com',
    isActive: true,
  },
  {
    id: '04',
    name: 'Alisha Mahazabin',
    school: 'Dhaka Cantonment Girls Public School & College',
    phone: '01963896859',
    email: 'sadiaislam16012008@gmail.com',
    isActive: true,
  },
  {
    id: '05',
    name: 'Benojir Siddique Ava',
    school: 'Viqarunnisa Noon College (Dhanmondi Branch)',
    phone: '01629819826',
    email: 'avabenojirsiddique@gmail.com',
    isActive: true,
  },
  {
    id: '06',
    name: 'Farhan Mazid Safwan',
    school: 'Udayan Higher Secondary School & College',
    phone: '01855597506',
    email: 'farhan.mazid150@gmail.com',
    isActive: true,
  },
  {
    id: '07',
    name: 'Ibrahim Khalid Saad',
    school: 'National Ideal College',
    phone: '01936127808',
    email: 'ks0899630@gmail.com',
    isActive: true,
  },
  {
    id: '08',
    name: 'Jawad Hossain',
    school: 'International Hope School Bangladesh (Chittagong Branch)',
    phone: '01352297966',
    email: 'jawadhossain987@gmail.com',
    isActive: true,
  },
  {
    id: '09',
    name: 'Jawat Chowdhury',
    school: 'Motijheel Model School & College',
    phone: '01752158559',
    email: 'jawatchowdhury821@gmail.com',
    isActive: true,
  },
  {
    id: '10',
    name: 'Kazi Taseen Ul Bashar',
    school: 'Sunbeams School',
    phone: '01979228756',
    email: 'kazitaseen12@gmail.com',
    isActive: true,
  },
  {
    id: '11',
    name: 'Maruf Hossain Faruk',
    school: 'BAF Shaheen College Dhaka',
    phone: '01568478103',
    email: 'mh9593843@gmail.com',
    isActive: true,
  },
  {
    id: '12',
    name: 'Masfia Zaman',
    school: 'Rajuk Uttara Model College',
    phone: '01750834794',
    email: 'masfiazaman419@gmail.com',
    isActive: true,
  },
  {
    id: '13',
    name: 'Md Forhad Ahmed Shoikot',
    school: 'BPATC College, Savar',
    phone: '01302447261',
    email: 'forhadahmedshoikot@gmail.com',
    isActive: true,
  },
  {
    id: '14',
    name: 'Md Idrak Karim',
    school: 'Scholastica',
    phone: '01894698945',
    email: 'only.idrak@gmail.com',
    isActive: true,
  },
  {
    id: '15',
    name: 'Md Jahidul Islam',
    school: 'Dhaka Imperial College',
    phone: '01646374985',
    email: 'mdjahidulislamjihad1293@gmail.com',
    isActive: true,
  },
  {
    id: '16',
    name: 'Md Shahin',
    school: 'Dhaka College',
    phone: '01406711101',
    email: 'shahinbinnazrul6368@gmail.com',
    isActive: true,
  },
  {
    id: '17',
    name: 'Md Tanjim Alam',
    school: 'South Breeze School',
    phone: '01720010991',
    email: 'tanjimalam2468@gmail.com',
    isActive: true,
  },
  {
    id: '18',
    name: 'Md Tasrik Islam',
    school: 'Cantonment Public School & College Lalmonirhat',
    phone: '01774640552',
    email: 'prantotasrik@gmail.com',
    isActive: true,
  },
  {
    id: '19',
    name: 'Md. Muktakin',
    school: 'Dhaka Northern City College',
    phone: '01970937283',
    email: 'cocmustakimfacebook@gmail.com',
    isActive: true,
  },
  {
    id: '20',
    name: 'Md. MohtasimTahmid',
    school: 'Nirjhor Cantonment Public School & College',
    phone: '01927993125',
    email: 'mohatasimtahmid@gmail.com',
    isActive: true,
  },
  {
    id: '21',
    name: 'Mehedi Hasan Zayed',
    school: 'Armed Police Battalion School & College Dhaka',
    phone: '01720106230',
    email: 'mhzmidu205@gmail.com',
    isActive: true,
  },
  {
    id: '22',
    name: 'Mohammad Zafar Khan Fahad',
    school: 'Rajarbag Police Line School & College',
    phone: '01646928639',
    email: 'fahad81020008khan@gmail.com',
    isActive: true,
  },
  {
    id: '23',
    name: 'Mojahed Uddin Sijon',
    school: 'St. Joseph Higher Secondary School',
    phone: '01810284354',
    email: 'mojaheduddinsijon8@gmail.com',
    isActive: true,
  },
  {
    id: '24',
    name: 'Pritidipa Das',
    school: "CTG Govt. Womens' College",
    phone: '01813875899',
    email: 'jenzcore1@gmail.com',
    isActive: true,
  },
  {
    id: '25',
    name: 'Ramisa Tasnim Rahman',
    school: 'Lalmatia Girls High School & College',
    phone: '01917597207',
    email: 'ramisatasnim2007@gmail.com',
    isActive: true,
  },
  {
    id: '26',
    name: 'Shahreen Mubashira',
    school: 'SOS Hermann Gmeiner College Dhaka',
    phone: '01794656778',
    email: 'shahreensfiya29@gmail.com',
    isActive: true,
  },
  {
    id: '27',
    name: 'Sheikh Md Hamim',
    school: 'Dr Mahbubur Rahman Mollah College',
    phone: '01887778709',
    email: 'sheikhhamim40@gmail.com',
    isActive: true,
  },
  {
    id: '28',
    name: 'Sneha Ahmed',
    school: 'Holy Cross College',
    phone: '01961894232',
    email: 'snehaahmed164@gmail.com',
    isActive: true,
  },
  {
    id: '29',
    name: 'Tahmidul Alam Neel',
    school: 'International Hope School Bangladesh (Uttara Branch)',
    phone: '01318322400',
    email: 'neel5303ihsb@gmail.com',
    isActive: true,
  },
  {
    id: '30',
    name: 'Tahsin Chowdhury Omar',
    school: 'Govt Shahid Suhrawardy College',
    phone: '01712019677',
    email: 'chowdhury.tahsin287@gmail.com',
    isActive: true,
  },
  {
    id: '31',
    name: 'Wafia Nirsar Rahman',
    school: 'Viqarunnisa Noon College (Main Branch)',
    phone: '01318203104',
    email: 'wafianirsarrahman@gmail.com',
    isActive: true,
  },
  {
    id: '32',
    name: 'Zubaer Riyad',
    school: 'Rajshahi College',
    phone: '01645714139',
    email: 'zubaerriyad27@gmail.com',
    isActive: true,
  },
]

/** @deprecated Prefer seed or Firestore-backed list; kept for transitional imports. */
export const ROBOFEST_CAMPUS_AMBASSADORS = ROBOFEST_CAMPUS_AMBASSADOR_SEED

export function getRobofestCampusAmbassadorSeedById(
  id: string,
): RobofestCampusAmbassador | undefined {
  return ROBOFEST_CAMPUS_AMBASSADOR_SEED.find((a) => a.id === id)
}

/** Sync seed lookup (fallback only). Prefer Firestore helpers on the server. */
export function getRobofestCampusAmbassadorById(
  id: string,
): RobofestCampusAmbassador | undefined {
  return getRobofestCampusAmbassadorSeedById(id)
}

export function formatCampusAmbassadorLabel(
  a: Pick<RobofestCampusAmbassador, 'name' | 'school'>,
): string {
  return `${a.name} · ${a.school}`
}

/** Unique school names from the campus ambassador seed (for directory seed). */
export function getRobofestCampusAmbassadorSchools(): string[] {
  const seen = new Set<string>()
  const schools: string[] = []
  for (const a of ROBOFEST_CAMPUS_AMBASSADOR_SEED) {
    const name = a.school.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    schools.push(name)
  }
  return schools.sort((a, b) => a.localeCompare(b))
}

export function mapRobofestCampusAmbassadorDoc(
  id: string,
  data: Record<string, unknown>,
): RobofestCampusAmbassador | null {
  const name = typeof data.name === 'string' ? data.name.trim() : ''
  const school = typeof data.school === 'string' ? data.school.trim() : ''
  if (!name || !school) return null

  const phone =
    typeof data.phone === 'string' && data.phone.trim()
      ? data.phone.trim()
      : undefined
  const email =
    typeof data.email === 'string' && data.email.trim()
      ? data.email.trim().toLowerCase()
      : undefined
  const isActive = typeof data.isActive === 'boolean' ? data.isActive : true

  return {
    id,
    name,
    school,
    phone,
    email,
    isActive,
  }
}

export function sortRobofestCampusAmbassadors(
  list: RobofestCampusAmbassador[],
): RobofestCampusAmbassador[] {
  return [...list].sort((a, b) => {
    const byId = a.id.localeCompare(b.id, undefined, { numeric: true })
    if (byId !== 0) return byId
    return a.name.localeCompare(b.name)
  })
}

export function nextRobofestCampusAmbassadorId(
  existingIds: string[],
): string {
  let max = 0
  for (const id of existingIds) {
    const n = Number.parseInt(id, 10)
    if (Number.isFinite(n) && n > max) max = n
  }
  return String(max + 1).padStart(2, '0')
}
