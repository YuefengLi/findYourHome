export type AreaRange = "80-90" | "90-100" | "100-120";

export interface CommunityLink {
  title: string;
  url: string;
}

export interface MetroDistance {
  line?: string;
  station?: string;
  distance_m: number;
  path_type?: string;
}

export interface TargetDistance {
  id?: string;
  name?: string;
  distance_m: number;
}

export interface BuildingLayout {
  area_sqm_range: AreaRange;
  layout_tags?: string[];
  main_supply?: boolean;
}

export interface BuildingType {
  type?: string;
  total_floors_range?: string;
  notes?: string;
  layouts?: BuildingLayout[];
}

export interface Community {
  id: string;
  slug?: string;
  routeKey: string;
  source_file: string;
  name_zh: string;
  alias?: string[];
  city?: string;
  district?: string;
  area?: string;
  address_brief?: string;
  tags: string[];
  links?: CommunityLink[];
  build?: {
    build_year_range?: string;
    property_type?: string;
    developer?: string;
    property_mgmt_company?: string;
  };
  price?: {
    level?: string;
    ref_wan_per_sqm?: number;
    ref_total_wan_range?: string;
  };
  distance?: {
    metro?: MetroDistance[];
    to_targets?: TargetDistance[];
  };
  transport?: {
    bus?: string;
    drive_notes?: string;
  };
  living?: {
    commerce?: string;
    hospital?: string;
    park?: string;
    school?: string;
  };
  property?: {
    green_rate?: number;
    landscaping?: string;
    has_pool?: boolean;
    has_kids_playground?: boolean;
    has_separation_ped_car?: boolean;
    management_fee?: {
      cny_per_sqm_month_range?: string;
      note?: string;
    };
    parking?: {
      monthly_rent_cny_range?: string;
      spot_price_wan_range?: string;
      ratio_note?: string;
    };
    facilities_note?: string;
  };
  housing_stock?: {
    building_types?: BuildingType[];
    my_focus?: {
      area_sqm_range?: AreaRange;
      notes?: string;
    };
  };
  pros?: string[];
  cons?: string[];
  risks?: string[];
  images?: {
    cover?: string;
    gallery?: string[];
  };
  notes_md?: string;
  updated_at: string;
}
