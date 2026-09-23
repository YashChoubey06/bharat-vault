export function inScope(parcel, scope = {}) {
  return ["state", "district", "tehsil"].every(key => !scope[key] || (parcel[key] || parcel.village?.[key]) === scope[key]);
}
