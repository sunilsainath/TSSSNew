/**
 * Declarative definitions of every admin-manageable entity.
 *
 * The same definitions drive: the form UI, server-side validation, and the
 * list tables. Adding a field is a one line change here.
 */

export type FieldSpec =
  | {
      name: string;
      label: string;
      type: "text" | "email" | "tel" | "url" | "date" | "number";
      required?: boolean;
      placeholder?: string;
      hint?: string;
      min?: number;
      max?: number;
      step?: string;
      colSpan?: 1 | 2;
    }
  | {
      name: string;
      label: string;
      type: "textarea";
      required?: boolean;
      rows?: number;
      hint?: string;
      placeholder?: string;
      colSpan?: 1 | 2;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: Array<{ value: string; label: string }>;
      required?: boolean;
      hint?: string;
      placeholder?: string;
      colSpan?: 1 | 2;
    }
  | {
      name: string;
      label: string;
      type: "checkbox";
      hint?: string;
      colSpan?: 1 | 2;
    }
  | {
      name: string;
      label: string;
      type: "image";
      hint?: string;
      required?: boolean;
      colSpan?: 1 | 2;
    }
  | {
      name: string;
      label: string;
      type: "password";
      required?: boolean;
      hint?: string;
      colSpan?: 1 | 2;
    };

export type EntityKey =
  | "banner"
  | "page_content"
  | "event_category"
  | "event"
  | "event_gallery"
  | "donation_settings"
  | "media_item"
  | "blog"
  | "member"
  | "blood_request"
  | "district"
  | "area"
  | "blood_help_admin"
  | "donor"
  | "donation_request"
  | "donation_camp"
  | "site_settings"
  | "user"
  | "photo_booth_template"
  | "photo_booth_slot";

export type EntitySpec = {
  key: EntityKey;
  /** Minimum role allowed to edit. */
  minimumRole: "blood_help_manager" | "content_manager" | "admin" | "super_admin";
  /** Database table this entity writes to. */
  table: string;
  singular: string;
  plural: string;
  fields: FieldSpec[];
  /** Table name written to audit_logs. */
  auditEntity: string;
};

const TRUE_FALSE: Array<{ value: string; label: string }> = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

export const ENTITY_SPECS: Record<EntityKey, EntitySpec> = {
  banner: {
    key: "banner",
    table: "site_banners",
    minimumRole: "content_manager",
    singular: "banner",
    plural: "banners",
    auditEntity: "site_banners",
    fields: [
      {
        name: "message",
        label: "Banner message",
        type: "text",
        required: true,
        hint: "Shown at the top of every page",
        colSpan: 2,
      },
      {
        name: "banner_type",
        label: "Banner type",
        type: "select",
        required: true,
        options: [
          { value: "info", label: "Information (blue)" },
          { value: "success", label: "Success (green)" },
          { value: "warning", label: "Warning (amber)" },
          { value: "urgent", label: "Urgent (red)" },
        ],
      },
      {
        name: "is_enabled",
        label: "Show this banner on the website",
        type: "checkbox",
        hint: "The banner only appears while enabled and inside its date window.",
      },
      { name: "link_url", label: "Link URL", type: "url", placeholder: "/events/devotional-events" },
      { name: "link_label", label: "Link label", type: "text", placeholder: "Learn more" },
      { name: "start_date", label: "Start date & time", type: "date", hint: "Optional" },
      { name: "end_date", label: "End date & time", type: "date", hint: "Optional" },
    ],
  },

  page_content: {
    key: "page_content",
    table: "page_content",
    minimumRole: "content_manager",
    singular: "content block",
    plural: "content blocks",
    auditEntity: "page_content",
    fields: [
      { name: "key", label: "Content key", type: "text", required: true, hint: "e.g. about_intro" },
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "text" },
      { name: "body", label: "Body", type: "textarea", rows: 6 },
      {
        name: "meta_json",
        label: "Meta (JSON)",
        type: "textarea",
        rows: 6,
        hint: 'Optional JSON, e.g. {"members":[{"name":"…","role":"…"}]}',
        colSpan: 2,
      },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
  },

  event_category: {
    key: "event_category",
    table: "event_categories",
    minimumRole: "content_manager",
    singular: "category",
    plural: "categories",
    auditEntity: "event_categories",
    fields: [
      { name: "name", label: "Category name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", hint: "Auto-generated if left blank" },
      { name: "description", label: "Description", type: "textarea", rows: 3, colSpan: 2 },
      { name: "cover_image", label: "Cover image", type: "image" },
      { name: "display_order", label: "Display order", type: "number", min: 0 },
      { name: "is_active", label: "Active (visible on the website)", type: "checkbox" },
    ],
  },

  event: {
    key: "event",
    table: "events",
    minimumRole: "content_manager",
    singular: "event",
    plural: "events",
    auditEntity: "events",
    fields: [
      { name: "category_id", label: "Category", type: "select", required: true, options: [] },
      { name: "title", label: "Event title", type: "text", required: true, colSpan: 2 },
      { name: "slug", label: "Slug", type: "text", hint: "Auto-generated if left blank" },
      { name: "event_date", label: "Event date", type: "date", required: true },
      { name: "end_date", label: "End date", type: "date", hint: "Optional" },
      { name: "location", label: "Location", type: "text" },
      { name: "summary", label: "Short description", type: "textarea", rows: 3, colSpan: 2 },
      { name: "content", label: "Detailed note", type: "textarea", rows: 8, colSpan: 2 },
      { name: "cover_image", label: "Cover image", type: "image" },
      { name: "youtube_url", label: "YouTube URL", type: "url" },
      {
        name: "external_links",
        label: "External links",
        type: "textarea",
        rows: 3,
        hint: "One URL per line",
      },
      { name: "is_featured", label: "Featured event", type: "checkbox" },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
  },

  event_gallery: {
    key: "event_gallery",
    table: "event_gallery",
    minimumRole: "content_manager",
    singular: "gallery image",
    plural: "gallery images",
    auditEntity: "event_gallery",
    fields: [
      { name: "event_id", label: "Event", type: "select", required: true, options: [] },
      { name: "image_url", label: "Image", type: "image", required: true },
      { name: "caption", label: "Caption", type: "text" },
      { name: "display_order", label: "Display order", type: "number", min: 0 },
    ],
  },

  donation_settings: {
    key: "donation_settings",
    table: "donation_settings",
    minimumRole: "content_manager",
    singular: "donation settings",
    plural: "donation settings",
    auditEntity: "donation_settings",
    fields: [
      { name: "account_name", label: "Account name", type: "text" },
      { name: "bank_name", label: "Bank name", type: "text" },
      { name: "account_number", label: "Account number", type: "text" },
      { name: "ifsc", label: "IFSC code", type: "text" },
      { name: "branch", label: "Branch", type: "text" },
      { name: "upi_id", label: "UPI ID", type: "text" },
      { name: "qr_code_url", label: "Donation QR code", type: "image" },
      { name: "instructions", label: "Donation instructions", type: "textarea", rows: 5, colSpan: 2 },
      { name: "transparency_note", label: "Transparency note", type: "textarea", rows: 5, colSpan: 2 },
      { name: "is_donation_open", label: "Accepting donations", type: "checkbox" },
    ],
  },

  media_item: {
    key: "media_item",
    table: "media_items",
    minimumRole: "content_manager",
    singular: "media item",
    plural: "media items",
    auditEntity: "media_items",
    fields: [
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "youtube", label: "YouTube video" },
          { value: "news", label: "News / press article" },
        ],
      },
      { name: "title", label: "Title", type: "text", required: true, colSpan: 2 },
      { name: "url", label: "URL", type: "url", required: true, colSpan: 2 },
      { name: "thumbnail_url", label: "Thumbnail image", type: "image" },
      { name: "source_name", label: "Media organisation", type: "text" },
      { name: "publication_date", label: "Publication date", type: "date" },
      { name: "description", label: "Description", type: "textarea", rows: 4, colSpan: 2 },
      { name: "display_order", label: "Display order", type: "number", min: 0 },
      { name: "is_published", label: "Published", type: "checkbox" },
    ],
  },

  blog: {
    key: "blog",
    table: "blogs",
    minimumRole: "content_manager",
    singular: "blog",
    plural: "blogs",
    auditEntity: "blogs",
    fields: [
      { name: "author_name", label: "Author name", type: "text", required: true, hint: "Shown on the article" },
      { name: "author_email", label: "Author email", type: "email", required: true, hint: "Kept private, never shown" },
      { name: "author_mobile", label: "Author mobile", type: "tel" },
      { name: "title", label: "Title", type: "text", required: true, colSpan: 2 },
      { name: "slug", label: "Slug", type: "text", hint: "Auto-generated if left blank" },
      { name: "category", label: "Category", type: "text", required: true },
      { name: "featured_image", label: "Featured image", type: "image" },
      { name: "excerpt", label: "Excerpt", type: "textarea", rows: 3, colSpan: 2 },
      { name: "content", label: "Content", type: "textarea", rows: 10, colSpan: 2 },
      { name: "is_featured", label: "Featured blog", type: "checkbox" },
      { name: "status", label: "Status", type: "select", required: true, options: [
        { value: "pending", label: "Pending review" },
        { value: "approved", label: "Approved (public)" },
        { value: "rejected", label: "Rejected" },
        { value: "unpublished", label: "Approved but unpublished" },
      ] },
      { name: "review_note", label: "Internal review note", type: "textarea", rows: 2, colSpan: 2 },
    ],
  },

  member: {
    key: "member",
    table: "members",
    minimumRole: "content_manager",
    singular: "member",
    plural: "members",
    auditEntity: "members",
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "father_name", label: "Father's name", type: "text" },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        placeholder: "Not recorded",
        options: [
          { value: "", label: "Not recorded" },
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" },
          { value: "prefer_not_to_say", label: "Prefer not to say" },
        ],
      },
      {
        name: "blood_group",
        label: "Blood group",
        type: "select",
        placeholder: "Not recorded",
        options: [
          { value: "", label: "Not recorded" },
          { value: "A+", label: "A+" },
          { value: "A-", label: "A-" },
          { value: "B+", label: "B+" },
          { value: "B-", label: "B-" },
          { value: "AB+", label: "AB+" },
          { value: "AB-", label: "AB-" },
          { value: "O+", label: "O+" },
          { value: "O-", label: "O-" },
          { value: "UNKNOWN", label: "I Don't Know" },
        ],
      },
      { name: "date_of_birth", label: "Date of birth", type: "date", required: true },
      { name: "village", label: "Village / Mandal", type: "text" },
      { name: "state_code", label: "State", type: "text", placeholder: "e.g. TS" },
      { name: "country_code", label: "Country code", type: "text", placeholder: "e.g. IN" },
      { name: "phone_country_code", label: "Dialling code", type: "text", placeholder: "e.g. 91" },
      { name: "mobile_number", label: "Mobile number", type: "tel", required: true },
      { name: "email", label: "Email", type: "email" },
      {
        name: "designation",
        label: "Designation",
        type: "text",
        hint: "Printed on the ID card, e.g. Founder & Chairman",
      },
      {
        name: "profile_photo_url",
        label: "Profile photo",
        type: "image",
        hint: "Shown on the ID card. A clear head-and-shoulders photograph works best.",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "active", label: "Active" },
          { value: "disabled", label: "Disabled" },
        ],
      },
      { name: "notes", label: "Internal notes", type: "textarea", rows: 3, colSpan: 2 },
    ],
  },

  blood_request: {
    key: "blood_request",
    table: "blood_help_requests",
    minimumRole: "blood_help_manager",
    singular: "blood help request",
    plural: "blood help requests",
    auditEntity: "blood_help_requests",
    fields: [
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "NEW", label: "New" },
          { value: "CONTACTED", label: "Contacted" },
          { value: "IN_PROGRESS", label: "In progress" },
          { value: "RESOLVED", label: "Resolved" },
          { value: "CLOSED", label: "Closed" },
        ],
      },
      { name: "assigned_admin_id", label: "Assigned administrator", type: "select", options: [] },
      { name: "resolution_note", label: "Resolution note", type: "textarea", rows: 4, colSpan: 2 },
    ],
  },

  district: {
    key: "district",
    table: "districts",
    minimumRole: "blood_help_manager",
    singular: "district",
    plural: "districts",
    auditEntity: "districts",
    fields: [
      { name: "name", label: "District name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", hint: "Auto-generated if left blank" },
      { name: "display_order", label: "Display order", type: "number", min: 0 },
      { name: "is_active", label: "Active (shown on the blood help form)", type: "checkbox" },
    ],
  },

  area: {
    key: "area",
    table: "areas",
    minimumRole: "blood_help_manager",
    singular: "area",
    plural: "areas",
    auditEntity: "areas",
    fields: [
      { name: "district_id", label: "District", type: "select", required: true, options: [] },
      { name: "name", label: "Area name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", hint: "Auto-generated if left blank" },
      { name: "display_order", label: "Display order", type: "number", min: 0 },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },

  blood_help_admin: {
    key: "blood_help_admin",
    table: "blood_help_admins",
    minimumRole: "blood_help_manager",
    singular: "blood help administrator",
    plural: "blood help administrators",
    auditEntity: "blood_help_admins",
    fields: [
      { name: "admin_name", label: "Administrator name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", hint: "Receives email notifications" },
      { name: "whatsapp_number", label: "WhatsApp number", type: "tel", hint: "With country code, e.g. 919876543210" },
      { name: "phone_number", label: "Phone number", type: "tel" },
      { name: "district_id", label: "District", type: "select", options: [] },
      { name: "area_id", label: "Area (optional)", type: "select", options: [], hint: "Leave empty to cover the whole district" },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },

  donor: {
    key: "donor",
    table: "donors",
    minimumRole: "blood_help_manager",
    singular: "donor",
    plural: "donors",
    auditEntity: "donors",
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "father_name", label: "Father's name", type: "text" },
      {
        name: "blood_group",
        label: "Blood group",
        type: "select",
        required: true,
        options: [
          { value: "O+", label: "O+" },
          { value: "O-", label: "O-" },
          { value: "A+", label: "A+" },
          { value: "A-", label: "A-" },
          { value: "B+", label: "B+" },
          { value: "B-", label: "B-" },
          { value: "AB+", label: "AB+" },
          { value: "AB-", label: "AB-" },
        ],
      },
      { name: "mobile_number", label: "Mobile number", type: "tel", required: true },
      { name: "phone_country_code", label: "Dialling code", type: "text", placeholder: "e.g. 91" },
      { name: "email", label: "Email", type: "email" },
      { name: "date_of_birth", label: "Date of birth", type: "date" },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        placeholder: "Not recorded",
        options: [
          { value: "", label: "Not recorded" },
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" },
          { value: "prefer_not_to_say", label: "Prefer not to say" },
        ],
      },
      { name: "country_code", label: "Country code", type: "text", placeholder: "e.g. IN" },
      { name: "state_code", label: "State", type: "text", placeholder: "e.g. TS" },
      { name: "city", label: "City / District", type: "text" },
      { name: "area", label: "Area / Locality", type: "text" },
      { name: "address", label: "Address", type: "text", colSpan: 2 },
      { name: "last_donation_date", label: "Last donation date", type: "date" },
      { name: "is_willing", label: "Willing to donate", type: "checkbox" },
      { name: "availability", label: "Availability", type: "text", hint: "e.g. weekends, evenings" },
      {
        name: "preferred_contact",
        label: "Preferred contact",
        type: "select",
        options: [
          { value: "phone", label: "Phone call" },
          { value: "whatsapp", label: "WhatsApp message" },
          { value: "email", label: "Email" },
        ],
      },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },

  donation_request: {
    key: "donation_request",
    table: "donation_requests",
    minimumRole: "blood_help_manager",
    singular: "donation request",
    plural: "donation requests",
    auditEntity: "donation_requests",
    fields: [
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "pending", label: "Pending" },
          { value: "in_progress", label: "In Progress" },
          { value: "fulfilled", label: "Fulfilled" },
          { value: "cancelled", label: "Cancelled" },
        ],
      },
      { name: "patient_name", label: "Patient name", type: "text", required: true },
      {
        name: "blood_group",
        label: "Blood group required",
        type: "select",
        required: true,
        options: [
          { value: "O+", label: "O+" },
          { value: "O-", label: "O-" },
          { value: "A+", label: "A+" },
          { value: "A-", label: "A-" },
          { value: "B+", label: "B+" },
          { value: "B-", label: "B-" },
          { value: "AB+", label: "AB+" },
          { value: "AB-", label: "AB-" },
        ],
      },
      { name: "units_required", label: "Units required", type: "number", required: true, min: 1, max: 50 },
      { name: "fulfilled_units", label: "Units fulfilled", type: "number", min: 0 },
      { name: "hospital_name", label: "Hospital name", type: "text", required: true },
      { name: "hospital_location", label: "Hospital location", type: "text" },
      { name: "area", label: "Area / Locality", type: "text" },
      { name: "city", label: "City / District", type: "text" },
      { name: "state_code", label: "State", type: "text", placeholder: "e.g. TS" },
      { name: "contact_person", label: "Contact person", type: "text" },
      { name: "contact_number", label: "Contact number", type: "tel", required: true },
      { name: "contact_country_code", label: "Dialling code", type: "text", placeholder: "e.g. 91" },
      { name: "request_date", label: "Request date", type: "date" },
      { name: "required_date", label: "Required by", type: "date" },
      { name: "notes", label: "Notes", type: "textarea", rows: 3, colSpan: 2 },
    ],
  },

  donation_camp: {
    key: "donation_camp",
    table: "donation_camps",
    minimumRole: "content_manager",
    singular: "donation camp",
    plural: "donation camps",
    auditEntity: "donation_camps",
    fields: [
      { name: "name", label: "Camp name", type: "text", required: true, colSpan: 2 },
      { name: "camp_date", label: "Camp date", type: "date", required: true },
      { name: "organizing_organization", label: "Organizing organization", type: "text" },
      { name: "location", label: "Location", type: "text" },
      { name: "area", label: "Area / Locality", type: "text" },
      { name: "city", label: "City / District", type: "text" },
      { name: "state_code", label: "State", type: "text", placeholder: "e.g. TS" },
      { name: "notes", label: "Notes", type: "textarea", rows: 3, colSpan: 2 },
    ],
  },

  site_settings: {
    key: "site_settings",
    table: "site_settings",
    minimumRole: "admin",
    singular: "organization settings",
    plural: "settings",
    auditEntity: "site_settings",
    fields: [
      { name: "organization_name", label: "Organization name", type: "text", required: true },
      { name: "short_name", label: "Short name", type: "text", required: true },
      { name: "tagline", label: "Tagline", type: "text", colSpan: 2 },
      { name: "about_short", label: "About (short)", type: "textarea", rows: 4, colSpan: 2 },
      { name: "mission", label: "Mission", type: "textarea", rows: 3 },
      { name: "vision", label: "Vision", type: "textarea", rows: 3 },
      { name: "contact_email", label: "Contact email", type: "email" },
      { name: "contact_phone", label: "Contact phone", type: "tel" },
      { name: "contact_address", label: "Contact address", type: "text" },
      { name: "whatsapp_number", label: "WhatsApp number", type: "tel" },
      { name: "youtube_url", label: "YouTube URL", type: "url" },
      { name: "facebook_url", label: "Facebook URL", type: "url" },
      { name: "instagram_url", label: "Instagram URL", type: "url" },
      { name: "twitter_url", label: "Twitter / X URL", type: "url" },
      { name: "map_embed_url", label: "Map embed URL", type: "url", colSpan: 2 },
      { name: "registration_open", label: "Registration form open", type: "checkbox" },
      { name: "blood_help_open", label: "Blood help form open", type: "checkbox" },
      { name: "registration_paused_message", label: "Registration paused message", type: "textarea", rows: 2, colSpan: 2 },
      { name: "blood_help_paused_message", label: "Blood help paused message", type: "textarea", rows: 2, colSpan: 2 },
      { name: "central_admin_email", label: "Central admin email", type: "email", hint: "Receives unassigned requests" },
      { name: "email_notifications_enabled", label: "Email notifications enabled", type: "checkbox" },
      { name: "whatsapp_notifications_enabled", label: "WhatsApp notifications enabled", type: "checkbox" },
    ],
  },

  user: {
    key: "user",
    table: "users",
    minimumRole: "super_admin",
    singular: "team member",
    plural: "team members",
    auditEntity: "users",
    fields: [
      { name: "email", label: "Email", type: "email", required: true },
      { name: "full_name", label: "Full name", type: "text" },
      {
        name: "role",
        label: "Role",
        type: "select",
        required: true,
        options: [
          { value: "super_admin", label: "Super Admin" },
          { value: "admin", label: "Admin" },
          { value: "content_manager", label: "Content Manager" },
          { value: "blood_help_manager", label: "Blood Help Manager" },
        ],
      },
      { name: "password", label: "Temporary password", type: "password", hint: "Only used when creating a new login" },
      { name: "is_active", label: "Active", type: "checkbox" },
    ],
  },

  photo_booth_template: {
    key: "photo_booth_template",
    table: "photo_booth_templates",
    minimumRole: "content_manager",
    singular: "photo booth template",
    plural: "photo booth templates",
    auditEntity: "photo_booth_templates",
    fields: [
      { name: "name", label: "Template name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", hint: "Auto-generated if left blank" },
      { name: "description", label: "Description", type: "textarea", rows: 2, colSpan: 2 },
      {
        name: "frame_image",
        label: "Frame image",
        type: "image",
        required: true,
        hint: "Transparent PNG. The photo windows must be transparent so photos show through.",
      },
      { name: "preview_image", label: "Preview image", type: "image", hint: "Shown in the template list" },
      {
        name: "width",
        label: "Canvas width (px)",
        type: "number",
        required: true,
        min: 320,
        max: 4000,
        hint: "Must match the frame PNG width",
      },
      {
        name: "height",
        label: "Canvas height (px)",
        type: "number",
        required: true,
        min: 320,
        max: 4000,
        hint: "Must match the frame PNG height",
      },
      { name: "display_order", label: "Display order", type: "number", min: 0 },
      { name: "is_featured", label: "Feature this template", type: "checkbox" },
      { name: "is_active", label: "Available to visitors", type: "checkbox" },
    ],
  },

  photo_booth_slot: {
    key: "photo_booth_slot",
    table: "photo_booth_slots",
    minimumRole: "content_manager",
    singular: "photo window",
    plural: "photo windows",
    auditEntity: "photo_booth_slots",
    fields: [
      { name: "template_id", label: "Template", type: "select", required: true, options: [] },
      { name: "label", label: "Label", type: "text", hint: "Shown to visitors, e.g. Photo 1" },
      {
        name: "shape",
        label: "Shape",
        type: "select",
        required: true,
        options: [
          { value: "rect", label: "Rectangle" },
          { value: "circle", label: "Circle" },
        ],
      },
      { name: "x", label: "X position", type: "number", required: true, min: 0 },
      { name: "y", label: "Y position", type: "number", required: true, min: 0 },
      { name: "width", label: "Width", type: "number", required: true, min: 10 },
      { name: "height", label: "Height", type: "number", required: true, min: 10 },
      { name: "radius", label: "Corner radius", type: "number", min: 0 },
      { name: "rotation", label: "Rotation (°)", type: "number", min: -180 },
      { name: "display_order", label: "Display order", type: "number", min: 0 },
    ],
  },
};

export const BOOL_FIELDS = TRUE_FALSE;
