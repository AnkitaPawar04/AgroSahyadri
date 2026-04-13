// All Maharashtra districts
export const maharashtraDistricts = [
  'Ahmednagar',
  'Akola',
  'Amravati',
  'Aurangabad',
  'Beed',
  'Bhandara',
  'Buldhana',
  'Chandrapur',
  'Colaba',
  'Dhule',
  'Gadchiroli',
  'Garhchiroli',
  'Gondia',
  'Hingoli',
  'Jalgaon',
  'Jalna',
  'Jhunjhunu',
  'Kolhapur',
  'Latur',
  'Malwan',
  'Marigaon',
  'Miraj',
  'Nanded',
  'Nandurbar',
  'Nashik',
  'Navi Mumbai',
  'Nulkhed',
  'Osmanabd',
  'Palghar',
  'Parbhani',
  'Parli Vaijnath',
  'Pimpri-Chinchwad',
  'Pune',
  'Raigad',
  'Ratnagiri',
  'Sangli',
  'Satara',
  'Solapur',
  'Talegaon',
  'Thane',
  'Usmanabad',
  'Varad',
  'Vasai',
  'Wardha',
  'Washim',
  'Yavatmal',
];

export const filterDistricts = (searchTerm) => {
  if (!searchTerm) return maharashtraDistricts;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return maharashtraDistricts.filter((district) =>
    district.toLowerCase().includes(lowerSearchTerm)
  );
};
