
type TDistrictType = 'strict' | 'non-strict';

export interface TDistrict {
  _id: string;
  name: string;
  logo: string;
  code: string;
  type: TDistrictType;
}