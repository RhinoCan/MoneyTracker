//Given a country code, determine which of the dateFormat templates it should use AS A DEFAULT.
import { DateFormatTemplate } from "@/types/CommonTypes";

export function determineDateFormatFromCountry(countryCode: string) {

if (!countryCode) return DateFormatTemplate.ISO;

//Get the country code, e.g. the US portion of 'en-US', from the current locale.
const code = countryCode.toUpperCase();

//The listed countries use the USA format.
if (['US', 'CA'].includes(code)) {
  return DateFormatTemplate.USA;
}

//The listed countries use the EUR format.
if (['GB', 'DE', 'FR', 'CH', 'ES', 'IT', 'RU'].includes(code)) {
  return DateFormatTemplate.EUR;
}

//Everyone else uses the ISO format.
return DateFormatTemplate.ISO;
}