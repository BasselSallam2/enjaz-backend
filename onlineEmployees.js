

export const onlineEmployees = new Map();


export function getRandomEmployeeEntry(map) {
    const entries = Array.from(map.entries()); 
    if (entries.length === 0) return null;
  
    const randomIndex = Math.floor(Math.random() * entries.length);
    return entries[randomIndex]; 
  }
  