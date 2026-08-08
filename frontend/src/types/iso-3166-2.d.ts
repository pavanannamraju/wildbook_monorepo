declare module "iso-3166-2" {
  export type IsoSubdivision = {
    type: string;
    name: string;
    countryName?: string;
    countryCode?: string;
    code?: string;
    regionCode?: string;
  };

  export type IsoCountry = {
    name: string;
    code: string;
    sub: Record<string, { type: string; name: string }>;
  };

  const iso3166: {
    data: Record<string, IsoCountry>;
    country(codeOrName: string): IsoCountry | null;
    subdivision(code: string): IsoSubdivision | null;
    subdivision(country: string, region: string): IsoSubdivision | null;
    codes: Record<string, string>;
  };

  export default iso3166;
}
