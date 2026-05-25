export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "interview_scheduled"
  | "final_review"
  | "approved"
  | "rejected";

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          slug: string;
          name: string;
          location: string;
          city: string | null;
          price_monthly: number;
          currency: string;
          compatibility_score: number | null;
          cover_image_url: string | null;
          category_id: string | null;
          available_from: string | null;
          room_type: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      property_amenities: {
        Row: {
          id: string;
          property_id: string;
          icon: string;
          label: string;
          sort_order: number;
        };
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          image_url: string;
          alt_text: string | null;
          sort_order: number;
        };
      };
      property_categories: {
        Row: {
          id: string;
          slug: string;
          label: string;
          sort_order: number;
        };
      };
      profiles: {
        Row: {
          id: string;
          slug: string | null;
          display_name: string;
          avatar_url: string | null;
          role_title: string | null;
          bio_quote: string | null;
          profile_score: number;
          is_discoverable: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      showcase_members: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          role_title: string | null;
          avatar_url: string | null;
          bio_quote: string | null;
          compatibility_score: number | null;
          created_at: string;
        };
      };
      showcase_member_tags: {
        Row: {
          id: string;
          showcase_member_id: string;
          tag: string;
        };
      };
      applications: {
        Row: {
          id: string;
          profile_id: string;
          property_id: string;
          status: ApplicationStatus;
          progress_percent: number;
          applied_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          profile_id: string;
          property_id: string;
          status?: ApplicationStatus;
          progress_percent?: number;
          applied_at?: string;
        };
      };
    };
    Views: {
      properties_list: {
        Row: {
          id: string;
          slug: string;
          name: string;
          location: string;
          city: string | null;
          price_monthly: number;
          currency: string;
          compatibility_score: number | null;
          cover_image_url: string | null;
          available_from: string | null;
          room_type: string | null;
          category_slug: string | null;
          category_label: string | null;
        };
      };
    };
  };
};
