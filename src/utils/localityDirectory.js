/**
 * MediMitra Comprehensive Locality Directory & Geo-Resolver Engine
 * Maps neighborhoods, localities, towns, and PIN codes across India to exact GPS coordinates.
 * Enables instant 1-click area proximity calculations (e.g. Balapur, Kukatpally, Gachibowli, Santosh Nagar, etc.)
 */

export const POPULAR_LOCALITIES = [
  // --- South Hyderabad & Old City (Balapur, Chandrayangutta, Charminar cluster) ---
  { name: 'Balapur', district: 'Rangareddy', state: 'Telangana', lat: 17.3090, lng: 78.5080, group: 'South Hyderabad' },
  { name: 'Barkas', district: 'Hyderabad', state: 'Telangana', lat: 17.3185, lng: 78.4890, group: 'South Hyderabad' },
  { name: 'Chandrayangutta', district: 'Hyderabad', state: 'Telangana', lat: 17.3240, lng: 78.4820, group: 'South Hyderabad' },
  { name: 'Santosh Nagar', district: 'Hyderabad', state: 'Telangana', lat: 17.3490, lng: 78.5120, group: 'South Hyderabad' },
  { name: 'Kanchanbagh / DRDO', district: 'Hyderabad', state: 'Telangana', lat: 17.3415, lng: 78.5040, group: 'South Hyderabad' },
  { name: 'Falaknuma', district: 'Hyderabad', state: 'Telangana', lat: 17.3340, lng: 78.4680, group: 'South Hyderabad' },
  { name: 'Charminar / Old City', district: 'Hyderabad', state: 'Telangana', lat: 17.3616, lng: 78.4747, group: 'South Hyderabad' },
  { name: 'Malakpet', district: 'Hyderabad', state: 'Telangana', lat: 17.3735, lng: 78.5045, group: 'South-East Hyderabad' },
  { name: 'LB Nagar', district: 'Rangareddy', state: 'Telangana', lat: 17.3580, lng: 78.5520, group: 'South-East Hyderabad' },
  { name: 'Vanasthalipuram', district: 'Rangareddy', state: 'Telangana', lat: 17.3325, lng: 78.5620, group: 'South-East Hyderabad' },
  { name: 'Dilsukhnagar', district: 'Hyderabad', state: 'Telangana', lat: 17.3688, lng: 78.5247, group: 'South-East Hyderabad' },
  { name: 'Kothapet / Chaitanyapuri', district: 'Hyderabad', state: 'Telangana', lat: 17.3650, lng: 78.5380, group: 'South-East Hyderabad' },
  { name: 'Nagole', district: 'Medchal-Malkajgiri', state: 'Telangana', lat: 17.3750, lng: 78.5650, group: 'East Hyderabad' },
  { name: 'Pahadi Shareef', district: 'Rangareddy', state: 'Telangana', lat: 17.2910, lng: 78.4890, group: 'South Hyderabad' },
  { name: 'Shamshabad (Airport Area)', district: 'Rangareddy', state: 'Telangana', lat: 17.2540, lng: 78.4280, group: 'South Hyderabad' },

  // --- West Hyderabad & IT Corridor ---
  { name: 'Gachibowli', district: 'Rangareddy', state: 'Telangana', lat: 17.4401, lng: 78.3489, group: 'West Hyderabad / IT' },
  { name: 'Hitech City / Madhapur', district: 'Rangareddy', state: 'Telangana', lat: 17.4483, lng: 78.3915, group: 'West Hyderabad / IT' },
  { name: 'Kondapur', district: 'Rangareddy', state: 'Telangana', lat: 17.4645, lng: 78.3612, group: 'West Hyderabad / IT' },
  { name: 'Kukatpally / KPHB', district: 'Medchal-Malkajgiri', state: 'Telangana', lat: 17.4875, lng: 78.4012, group: 'North-West Hyderabad' },
  { name: 'Miyapur', district: 'Medchal-Malkajgiri', state: 'Telangana', lat: 17.4968, lng: 78.3614, group: 'North-West Hyderabad' },
  { name: 'Banjara Hills', district: 'Hyderabad', state: 'Telangana', lat: 17.4165, lng: 78.4485, group: 'Central Hyderabad' },
  { name: 'Jubilee Hills', district: 'Hyderabad', state: 'Telangana', lat: 17.4326, lng: 78.4071, group: 'Central Hyderabad' },
  { name: 'Mehdipatnam', district: 'Hyderabad', state: 'Telangana', lat: 17.3912, lng: 78.4382, group: 'Central Hyderabad' },
  { name: 'Somajiguda / Punjagutta', district: 'Hyderabad', state: 'Telangana', lat: 17.4243, lng: 78.4578, group: 'Central Hyderabad' },
  { name: 'Ameerpet / SR Nagar', district: 'Hyderabad', state: 'Telangana', lat: 17.4375, lng: 78.4483, group: 'Central Hyderabad' },
  { name: 'Sanath Nagar', district: 'Hyderabad', state: 'Telangana', lat: 17.4580, lng: 78.4410, group: 'Central Hyderabad' },

  // --- North & East Hyderabad / Secunderabad ---
  { name: 'Secunderabad (Clock Tower)', district: 'Hyderabad', state: 'Telangana', lat: 17.4410, lng: 78.4980, group: 'Secunderabad' },
  { name: 'Begumpet', district: 'Hyderabad', state: 'Telangana', lat: 17.4440, lng: 78.4680, group: 'Secunderabad' },
  { name: 'Malkajgiri', district: 'Medchal-Malkajgiri', state: 'Telangana', lat: 17.4520, lng: 78.5310, group: 'Secunderabad' },
  { name: 'Alwal / Bolarum', district: 'Medchal-Malkajgiri', state: 'Telangana', lat: 17.5020, lng: 78.5280, group: 'North Hyderabad' },
  { name: 'Kompally', district: 'Medchal-Malkajgiri', state: 'Telangana', lat: 17.5380, lng: 78.4870, group: 'North Hyderabad' },
  { name: 'Medchal', district: 'Medchal-Malkajgiri', state: 'Telangana', lat: 17.6297, lng: 78.4814, group: 'North Hyderabad' },
  { name: 'Uppal', district: 'Medchal-Malkajgiri', state: 'Telangana', lat: 17.4020, lng: 78.5600, group: 'East Hyderabad' },
  { name: 'Tarnaka / Osmania Univ', district: 'Hyderabad', state: 'Telangana', lat: 17.4280, lng: 78.5320, group: 'East Hyderabad' },
  { name: 'ECIL / AS Rao Nagar', district: 'Medchal-Malkajgiri', state: 'Telangana', lat: 17.4870, lng: 78.5720, group: 'North-East Hyderabad' },
  { name: 'Ghatkesar', district: 'Medchal-Malkajgiri', state: 'Telangana', lat: 17.4478, lng: 78.6820, group: 'East Hyderabad' },

  // --- Major National Metro Hubs ---
  { name: 'Delhi NCR (Central / Connaught Place)', district: 'New Delhi', state: 'Delhi', lat: 28.6315, lng: 77.2167, group: 'Delhi NCR' },
  { name: 'AIIMS New Delhi Area (Ansari Nagar)', district: 'South Delhi', state: 'Delhi', lat: 28.5672, lng: 77.2100, group: 'Delhi NCR' },
  { name: 'Mumbai City (Parel / Dadar)', district: 'Mumbai City', state: 'Maharashtra', lat: 19.0033, lng: 72.8427, group: 'Mumbai MMR' },
  { name: 'Bengaluru (Kalasipalya / Victoria)', district: 'Bengaluru Urban', state: 'Karnataka', lat: 12.9619, lng: 77.5750, group: 'Bengaluru' },
  { name: 'Chennai (Park Town / RGGGH)', district: 'Chennai', state: 'Tamil Nadu', lat: 13.0805, lng: 80.2778, group: 'Chennai' },
  { name: 'Kolkata (College Street / Central)', district: 'Kolkata', state: 'West Bengal', lat: 22.5744, lng: 88.3629, group: 'Kolkata' },
  { name: 'Lucknow (Chowk / KGMU)', district: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8687, lng: 80.9150, group: 'Lucknow' }
];

/**
 * Calculates Haversine distance in kilometers between two GPS points
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Identifies closest known locality for a given latitude & longitude
 */
export function identifyNearestLocality(lat, lng) {
  if (lat == null || lng == null) return null;

  let nearest = null;
  let minDistance = Infinity;

  for (const loc of POPULAR_LOCALITIES) {
    const dist = calculateDistanceKm(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = { ...loc, distance: dist };
    }
  }

  if (nearest && minDistance <= 8) {
    return nearest;
  }
  return null;
}

/**
 * Resolves search text to coordinates if user searches for an area name (e.g. "Balapur", "Kukatpally", "Gachibowli")
 */
export function resolveLocalityCoordinates(searchTerm) {
  if (!searchTerm || typeof searchTerm !== 'string') return null;
  const clean = searchTerm.trim().toLowerCase();
  
  return POPULAR_LOCALITIES.find(loc => 
    loc.name.toLowerCase().includes(clean) || 
    clean.includes(loc.name.toLowerCase())
  );
}
