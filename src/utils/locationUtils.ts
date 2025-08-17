// Location utility functions
export function formatLocation(
  cityVillage?: string,
  district?: string
): string {
  if (cityVillage && district) {
    return `${cityVillage}, ${district}`;
  } else if (cityVillage) {
    return cityVillage;
  } else if (district) {
    return district;
  } else {
    return "Not specified";
  }
}

export function getDistrictOptions(): Array<{ value: string; label: string }> {
  return [
    { value: "", label: "Select District" },
    { value: "Belize", label: "Belize" },
    { value: "Cayo", label: "Cayo" },
    { value: "Corozal", label: "Corozal" },
    { value: "Orange Walk", label: "Orange Walk" },
    { value: "Stann Creek", label: "Stann Creek" },
    { value: "Toledo", label: "Toledo" },
  ];
}

export function getCityVillageOptionsByDistrict(
  district: string
): Array<{ value: string; label: string }> {
  const cities: { [key: string]: Array<{ value: string; label: string }> } = {
    Belize: [
      { value: "", label: "Select City/Village" },
      { value: "Belize City", label: "Belize City" },
      { value: "Ladyville", label: "Ladyville" },
      { value: "Burrell Boom", label: "Burrell Boom" },
      { value: "Hattieville", label: "Hattieville" },
      { value: "Sand Hill", label: "Sand Hill" },
      { value: "San Pedro", label: "San Pedro" },
      { value: "Caye Caulker", label: "Caye Caulker" },
    ],
    Cayo: [
      { value: "", label: "Select City/Village" },
      { value: "Belmopan", label: "Belmopan" },
      { value: "San Ignacio", label: "San Ignacio" },
      { value: "Santa Elena", label: "Santa Elena" },
      { value: "Benque Viejo del Carmen", label: "Benque Viejo del Carmen" },
      { value: "Spanish Lookout", label: "Spanish Lookout" },
      { value: "Bullet Tree Falls", label: "Bullet Tree Falls" },
    ],
    Corozal: [
      { value: "", label: "Select City/Village" },
      { value: "Corozal Town", label: "Corozal Town" },
      { value: "Sarteneja", label: "Sarteneja" },
      { value: "Chunox", label: "Chunox" },
      { value: "Consejo", label: "Consejo" },
    ],
    "Orange Walk": [
      { value: "", label: "Select City/Village" },
      { value: "Orange Walk Town", label: "Orange Walk Town" },
      { value: "San Estevan", label: "San Estevan" },
      { value: "Shipyard", label: "Shipyard" },
      { value: "Trial Farm", label: "Trial Farm" },
    ],
    "Stann Creek": [
      { value: "", label: "Select City/Village" },
      { value: "Dangriga", label: "Dangriga" },
      { value: "Placencia", label: "Placencia" },
      { value: "Hopkins", label: "Hopkins" },
      { value: "Seine Bight", label: "Seine Bight" },
      { value: "Independence", label: "Independence" },
    ],
    Toledo: [
      { value: "", label: "Select City/Village" },
      { value: "Punta Gorda", label: "Punta Gorda" },
      { value: "San Antonio", label: "San Antonio" },
      { value: "Barranco", label: "Barranco" },
      { value: "Monkey River", label: "Monkey River" },
    ],
  };

  return cities[district] || [{ value: "", label: "Select City/Village" }];
}
