export type Locale = "en" | "th";

export const DEFAULT_LOCALE: Locale = "en";

export type Messages = Record<string, string>;

export const MESSAGES_BY_LOCALE: Record<Locale, Messages> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.incoming": "Incoming",
    "nav.bookings": "Bookings",
    "nav.workflow": "Workflow",
    "nav.followUps": "Follow-ups",
    "nav.customers": "Customers",
    "nav.cars": "Cars",
    "nav.services": "Services",
    "nav.packages": "Packages",
    "nav.staff": "Staff",
    "nav.analytics": "Analytics",
    "nav.support": "Support",
    "nav.settings": "Settings",

    "nav.operations": "Operations",
    "nav.management": "Management",

    "common.studio": "Detailing Studio",
    "common.logout": "Log out",

    "status.booked": "Booked",
    "status.arrived": "Arrived",
    "status.in_progress": "In Progress",
    "status.quality_check": "Quality Check",
    "status.finished": "Finished",
    "status.paid": "Paid",
    "status.cancelled": "Cancelled",

    "workflow.next": "Next",
    "workflow.noJobs": "No jobs",

    "auth.login.heroTitle": "Run your detailing studio with precision.",
    "auth.login.heroSubtitle": "The command center for professional detailing operations. Track bookings, manage workflow, and deliver exceptional results.",
    "auth.login.feature1.title": "5-Second Overview",
    "auth.login.feature1.body": "Dashboard shows what matters instantly.",
    "auth.login.feature2.title": "2-Click Updates",
    "auth.login.feature2.body": "Move jobs through workflow stages.",
    "auth.login.feature3.title": "Secure & Private",
    "auth.login.feature3.body": "Studio-scoped data isolation.",
    "auth.login.feature4.title": "Live Analytics",
    "auth.login.feature4.body": "Revenue, workload, and trends.",

    "auth.signup.title": "Create your account.",
    "auth.signup.subtitle": "Confirm your email and request access to a studio.",

    "i18n.en": "EN",
    "i18n.th": "TH",
  },
  th: {
    "nav.dashboard": "แดชบอร์ด",
    "nav.incoming": "งานเข้า",
    "nav.bookings": "การจอง",
    "nav.workflow": "เวิร์กโฟลว์",
    "nav.followUps": "ติดตามผล",
    "nav.customers": "ลูกค้า",
    "nav.cars": "รถ",
    "nav.services": "บริการ",
    "nav.packages": "แพ็กเกจ",
    "nav.staff": "พนักงาน",
    "nav.analytics": "วิเคราะห์",
    "nav.support": "ซัพพอร์ต",
    "nav.settings": "ตั้งค่า",

    "nav.operations": "การดำเนินงาน",
    "nav.management": "การจัดการ",

    "common.studio": "สตูดิโอดีเทลลิ่ง",
    "common.logout": "ออกจากระบบ",

    "status.booked": "จองแล้ว",
    "status.arrived": "มาถึงแล้ว",
    "status.in_progress": "กำลังทำ",
    "status.quality_check": "ตรวจคุณภาพ",
    "status.finished": "เสร็จแล้ว",
    "status.paid": "ชำระแล้ว",
    "status.cancelled": "ยกเลิก",

    "workflow.next": "ถัดไป",
    "workflow.noJobs": "ไม่มีงาน",

    "auth.login.heroTitle": "บริหารร้านดีเทลลิ่งอย่างแม่นยำ",
    "auth.login.heroSubtitle": "ศูนย์บัญชาการสำหรับงานดีเทลลิ่งมืออาชีพ จัดการการจอง เวิร์กโฟลว์ และส่งมอบงานคุณภาพ",
    "auth.login.feature1.title": "ภาพรวมใน 5 วินาที",
    "auth.login.feature1.body": "แดชบอร์ดแสดงสิ่งสำคัญทันที",
    "auth.login.feature2.title": "อัปเดตใน 2 คลิก",
    "auth.login.feature2.body": "เลื่อนงานตามขั้นตอนเวิร์กโฟลว์",
    "auth.login.feature3.title": "ปลอดภัยและเป็นส่วนตัว",
    "auth.login.feature3.body": "ข้อมูลแยกตามสตูดิโอ",
    "auth.login.feature4.title": "สถิติแบบเรียลไทม์",
    "auth.login.feature4.body": "รายได้ ภาระงาน และแนวโน้ม",

    "auth.signup.title": "สร้างบัญชีของคุณ",
    "auth.signup.subtitle": "ยืนยันอีเมลและขอเข้าร่วมสตูดิโอ",

    "i18n.en": "EN",
    "i18n.th": "ไทย",
  },
};

export function isLocale(input: unknown): input is Locale {
  return input === "en" || input === "th";
}
