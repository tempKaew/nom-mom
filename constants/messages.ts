/**
 * User-facing and API error messages.
 */

export const MESSAGES = {
  AUTH: {
    MISSING_OR_INVALID:
      "Missing or invalid Authorization (LIFF ID token required)",
    USER_NOT_FOUND: "User not found",
    ID_TOKEN_REQUIRED:
      "ไม่สามารถรับ ID token ได้ กรุณาเปิดใช้ scope 「openid」ใน LINE Developers Console → LIFF → แก้ไข LIFF app → Scope แล้วลองล็อกอาออกและเข้าใหม่",
  },
  LIFF: {
    NOT_SET: "NEXT_PUBLIC_LIFF_ID is not set.",
  },
  USER: {
    ALREADY_REGISTERED: "User already registered",
    CHECK_FAILED: "Check user failed",
  },
  BABY: {
    NOT_FOUND_OR_ACCESS_DENIED: "Baby not found or access denied",
    NOT_FOUND: "Baby not found",
    ID_REQUIRED: "Baby ID required",
    NAME_REQUIRED: "name is required",
    ADD_FAILED: "เพิ่มเด็กไม่สำเร็จ",
    UPDATE_FAILED: "Update failed",
    SAVE_FAILED: "บันทึกไม่สำเร็จ",
    DELETE_FAILED: "ลบข้อมูลเด็กไม่สำเร็จ",
    DELETE_OWNER_ONLY: "Only the baby owner can delete",
  },
  LOGS: {
    BABY_ID_REQUIRED: "babyId required",
    MILK_LOAD_FAILED: "Failed to load milk logs",
    DIAPER_LOAD_FAILED: "Failed to load diaper logs",
    MILK_ADD_FAILED: "เพิ่มรายการนมไม่สำเร็จ",
    DIAPER_ADD_FAILED: "เพิ่มรายการผ้าอ้อมไม่สำเร็จ",
    TYPE_REQUIRED: "type is required",
  },
  AVATAR: {
    UPLOAD_FAILED: "อัพโหลดรูปไม่สำเร็จ",
    MISSING_FILE: "Missing file in form-data (field: file)",
    INVALID_BODY: "Send image as multipart/form-data (file) or raw image body",
    BUCKET_ERROR:
      "Upload failed. Ensure bucket 'baby-avatars' exists and is public.",
  },
  GROWTH: {
    ADD_FAILED: "บันทึกข้อมูลการเติบโตไม่สำเร็จ",
    LOAD_FAILED: "โหลดข้อมูลการเติบโตไม่สำเร็จ",
    AT_LEAST_ONE_FIELD:
      "กรุณากรอกข้อมูลอย่างน้อย 1 รายการ (น้ำหนัก, ส่วนสูง, หรือรอบศีรษะ)",
  },
  SLEEP: {
    ADD_FAILED: "บันทึกข้อมูลการนอนไม่สำเร็จ",
    LOAD_FAILED: "โหลดข้อมูลการนอนไม่สำเร็จ",
    STARTED_AT_REQUIRED: "started_at is required",
  },
  APPOINTMENTS: {
    ADD_FAILED: "บันทึกนัดหมายไม่สำเร็จ",
    LOAD_FAILED: "โหลดข้อมูลนัดหมายไม่สำเร็จ",
    UPDATE_FAILED: "อัปเดตนัดหมายไม่สำเร็จ",
    TITLE_REQUIRED: "title is required",
    APPOINTMENT_AT_REQUIRED: "appointment_at is required",
  },
  INVITES: {
    ONLY_OWNER: "Only the baby owner can manage invite codes",
    ONLY_OWNER_CREATE: "Only the baby owner can create invite codes",
    BABY_ID_REQUIRED: "babyId query parameter is required",
    LABEL_REQUIRED: "label is required (e.g. ป้า, แม่, พ่อ)",
    CREATE_FAILED: "สร้างรหัสเชิญไม่สำเร็จ",
    TOKEN_REQUIRED: "token is required",
    NOT_FOUND_OR_EXPIRED: "รหัสเชิญไม่ถูกต้องหรือหมดอายุแล้ว",
    ALREADY_MEMBER: "คุณเป็นสมาชิกของเด็กคนนี้อยู่แล้ว",
    REDEEM_FAILED: "ใช้รหัสเชิญไม่สำเร็จ",
  },
  PUMPING: {
    ADD_FAILED: "บันทึกการปั๊มนมไม่สำเร็จ",
    LOAD_FAILED: "โหลดข้อมูลการปั๊มนมไม่สำเร็จ",
    START_TIME_REQUIRED: "start_time is required",
  },
  EXCRETION: {
    ADD_FAILED: "บันทึกการขับถ่ายไม่สำเร็จ",
    LOAD_FAILED: "โหลดข้อมูลการขับถ่ายไม่สำเร็จ",
  },
  GENERAL: {
    LOAD_FAILED: "Failed to load",
    LOAD_DATA_FAILED: "Failed to load data",
    INTERNAL_ERROR: "Internal server error",
    DATABASE_ERROR: "Database error",
  },
  UI: {
    // Bottom navigation
    NAV_HOME: "หน้าหลัก",
    NAV_LOG: "บันทึก",
    NAV_GROWTH: "การเติบโต",
    NAV_MEDICAL: "สุขภาพ",
    NAV_PROFILE: "โปรไฟล์",

    // Section headings
    SECTION_RECENT: "ล่าสุด",
    SECTION_QUICK_RECORD: "บันทึกด่วน",
    SECTION_ACTIVITY_LOG: "บันทึกกิจกรรม",
    SECTION_UPCOMING_APPOINTMENTS: "นัดหมอที่กำลังจะมาถึง",

    // Baby header
    WEIGHT: "น้ำหนัก",
    HEIGHT: "ส่วนสูง",
    ADD_BABY_TO_START: "เพิ่มเด็กเพื่อเริ่มต้น",

    // Misc labels
    COMING_SOON: "เร็วๆ นี้",
    LINE_ACCOUNT: "บัญชี LINE",
    SEE_ALL: "ดูทั้งหมด →",
    ADD_FIRST_BABY: "เพิ่มเด็กคนแรก →",

    // Log filter tabs
    FILTER_ALL: "ทั้งหมด",
    FILTER_FEEDING: "ป้อนนม",
    FILTER_DIAPER: "การขับถ่าย",
    FILTER_SLEEP: "การนอน",
    FILTER_MEDICAL: "การแพทย์",
    FILTER_PUMPING: "ปั๊มนม",

    // Invite status badges
    INVITE_ACTIVE: "ใช้งานได้",
    INVITE_USED: "ใช้แล้ว",
    INVITE_EXPIRED: "หมดอายุ",

    // Empty states
    EMPTY_UPCOMING_APPOINTMENTS: "ไม่มีนัดที่กำลังจะมาถึง",
    EMPTY_RECORDS: "ยังไม่มีรายการบันทึก",
    EMPTY_GROWTH: "ยังไม่มีข้อมูลการเติบโต",
    EMPTY_GROWTH_HINT: "กดปุ่ม + เพื่อบันทึกข้อมูลแรก",
    EMPTY_BABIES: "ยังไม่มีเด็ก",
    EMPTY_INVITES: "ยังไม่มีรหัสเชิญ",
    NOT_SUPPORTED: "ยังไม่รองรับในเวอร์ชันนี้",

    // Activity labels
    ACTIVITY_FEEDING: "ป้อนนม",
    ACTIVITY_BREASTFEED: "นมแม่",
    ACTIVITY_BOTTLE: "นมขวด",
    ACTIVITY_PUMP: "ปั๊มนม",
    ACTIVITY_FORMULA: "นมผสม",
    ACTIVITY_EXCRETION: "การขับถ่าย",
    ACTIVITY_SLEEP: "การนอน",
    ACTIVITY_MEDICAL: "สุขภาพ",
    ACTIVITY_APPOINTMENT: "นัดหมอ",

    // Diaper detail labels
    DIAPER_WET: "ฉี่",
    DIAPER_DIRTY: "อึ",
    DIAPER_BOTH: "ฉี่ & อึ",

    // Actions
    RETRY: "ลองใหม่",
    BACK_TO_DASHBOARD: "กลับไปหน้าหลัก",
    BACK: "กลับ",
  },
} as const;
