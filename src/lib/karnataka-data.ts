// Static cascading data for Karnataka address fields

export const divisions = [
  "Bengaluru Division",
  "Mysuru Division",
  "Belgaum Division",
  "Gulbarga Division",
];

export const districtsByDivision: Record<string, string[]> = {
  "Bengaluru Division": [
    "Bengaluru Urban",
    "Bengaluru Rural",
    "Ramanagara",
    "Tumkur",
    "Chitradurga",
    "Davanagere",
    "Kolar",
    "Chikkaballapura",
  ],
  "Mysuru Division": ["Mysuru", "Mandya", "Hassan", "Chamarajanagar", "Kodagu"],
  "Belgaum Division": ["Belgaum", "Dharwad", "Haveri", "Gadag", "Uttara Kannada"],
  "Gulbarga Division": ["Gulbarga", "Bidar", "Raichur", "Yadgir", "Bellary", "Koppal"],
};

export const taluksByDistrict: Record<string, string[]> = {
  "Bengaluru Urban": ["Bangalore North", "Bangalore South", "Anekal"],
  "Bengaluru Rural": ["Dod Ballapur", "Devanahalli", "Hosakote", "Nelamangala"],
  Ramanagara: ["Ramanagara", "Channapatna", "Magadi", "Kanakapura"],
  Tumkur: ["Tumkur", "Tiptur", "Gubbi", "Sira"],
  Chitradurga: ["Chitradurga", "Hosadurga", "Holalkere"],
  Davanagere: ["Davanagere", "Harihar", "Jagalur"],
  Kolar: ["Kolar", "Bangarpet", "Mulbagal", "Srinivaspur"],
  Chikkaballapura: ["Chikkaballapura", "Chintamani", "Sidlaghatta", "Gudibanda"],
  Mysuru: ["Mysuru", "Nanjangud", "T. Narsipur", "H.D. Kote", "Hunsur", "Periyapatna"],
  Mandya: ["Mandya", "Maddur", "Srirangapatna", "Pandavapura", "Nagamangala"],
  Hassan: ["Hassan", "Belur", "Sakleshpur", "Arsikere", "Channarayapatna"],
  Chamarajanagar: ["Chamarajanagar", "Kollegal", "Gundlupet", "Yelandur"],
  Kodagu: ["Madikeri", "Virajpet", "Somwarpet"],
  Belgaum: ["Belgaum", "Athani", "Chikkodi", "Gokak", "Khanapur", "Ramdurg"],
  Dharwad: ["Dharwad", "Hubli", "Kundgol", "Navalgund"],
  Haveri: ["Haveri", "Ranebennur", "Byadgi", "Savanur"],
  Gadag: ["Gadag", "Nargund", "Ron", "Mundargi"],
  "Uttara Kannada": ["Karwar", "Sirsi", "Kumta", "Honnavar", "Ankola"],
  Gulbarga: ["Gulbarga", "Aland", "Afzalpur", "Chincholi", "Sedam"],
  Bidar: ["Bidar", "Basavakalyan", "Bhalki", "Humnabad", "Aurad"],
  Raichur: ["Raichur", "Sindhanur", "Manvi", "Devadurga", "Lingasugur"],
  Yadgir: ["Yadgir", "Shahapur", "Shorapur"],
  Bellary: ["Bellary", "Hospet", "Sandur", "Siruguppa"],
  Koppal: ["Koppal", "Gangavathi", "Kushtagi", "Yelburga"],
};

export const cmcTmcOptions = ["CMC", "TMC", "TP", "GBA", "MC"];

export const pattanaPanchayathiByTaluk: Record<string, string[]> = {
  Devanahalli: ["Devanahalli(TMC)", "Vijayapura(TMC)"],
  Hosakote: ["Hosakote(TMC)", "Nandagudi(TMC)"],
  "Dod Ballapur": ["Dod Ballapur(TMC)"],
  Nelamangala: ["Nelamangala(TMC)"],
  "Bangalore North": ["Yelahanka(CMC)", "Mahadevapura(CMC)"],
  "Bangalore South": ["Bommanahalli(CMC)", "Bannerghatta(TMC)"],
  Anekal: ["Anekal(TMC)", "Attibele(TMC)"],
};

export const urbanWards = ["URBAN NO.1", "URBAN NO.2", "URBAN NO.3", "URBAN NO.4", "URBAN NO.5"];

export const gramPanchayathiByTaluk: Record<string, string[]> = {
  Devanahalli: ["Sadahalli GP", "Budigere GP", "Kodigehalli GP", "Yelahanka GP"],
  Hosakote: ["Anugondanahalli GP", "Jadigenahalli GP", "Sulibele GP"],
  "Dod Ballapur": ["Mylanahalli GP", "Tubagere GP"],
  Nelamangala: ["Tyamagondlu GP", "Bashettihalli GP"],
  "Bangalore North": ["Jakkur GP", "Thanisandra GP"],
  "Bangalore South": ["Begur GP", "Gottigere GP"],
  Anekal: ["Marsur GP", "Mayasandra GP", "Haragadde GP"],
};

export const villagesByGP: Record<string, string[]> = {
  "Sadahalli GP": ["Sadahalli", "Bagalur", "Chikkajala"],
  "Budigere GP": ["Budigere", "Kannamangala"],
  "Kodigehalli GP": ["Kodigehalli", "Bettahalasur"],
  "Anugondanahalli GP": ["Anugondanahalli", "Muddenahalli"],
  "Jadigenahalli GP": ["Jadigenahalli", "Lakkondahalli"],
  "Mylanahalli GP": ["Mylanahalli", "Arasinakunte"],
  "Jakkur GP": ["Jakkur", "Allalasandra"],
  "Begur GP": ["Begur", "Akshayanagar"],
  "Marsur GP": ["Marsur", "Kumbalgudu"],
};
