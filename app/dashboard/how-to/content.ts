export type HowToArticle = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  content: string[];
};

export const HOW_TO_ARTICLES: HowToArticle[] = [
  {
    slug: "better-baby-sleep-routine",
    title: "ทำ routine ก่อนนอนให้ลูกหลับง่ายขึ้น",
    summary: "แนวทางสั้นๆ สำหรับสร้างสัญญาณก่อนนอนให้ลูกคุ้นเคยและงอแงน้อยลง",
    category: "การนอน",
    readTime: "อ่าน 3 นาที",
    content: [
      "เริ่ม routine เดิมทุกวันในเวลาใกล้เคียงกัน เช่น อาบน้ำ เช็ดตัว ใส่ชุดนอน หรี่ไฟ และเปิดเสียงเบาๆ",
      "ลดสิ่งกระตุ้นก่อนนอน 20-30 นาที เช่น ของเล่นเสียงดัง แสงจ้า หรือการเล่นที่ตื่นเต้นมากเกินไป",
      "ใช้สัญญาณซ้ำ เช่น เพลงกล่อมประโยคเดิม สัมผัสเดิม จะช่วยให้ลูกรู้ว่าใกล้เวลานอน",
      "หากลูกงอแง ให้ปลอบแบบสั้นและสม่ำเสมอ ไม่เปลี่ยนวิธีบ่อยในคืนเดียว",
    ],
  },
  {
    slug: "increase-milk-session-quality",
    title: "เพิ่มคุณภาพรอบปั๊มนมแบบทำได้จริง",
    summary: "เทคนิคง่ายๆ เพื่อให้รอบปั๊มมีประสิทธิภาพมากขึ้นและไม่เครียดเกินไป",
    category: "การให้นม/ปั๊มนม",
    readTime: "อ่าน 4 นาที",
    content: [
      "กำหนดเวลาให้ค่อนข้างคงที่ โดยเฉพาะรอบเช้า เพื่อให้ร่างกายจำจังหวะการหลั่งน้ำนม",
      "ประคบอุ่นและนวดเต้านมเบาๆ ก่อนเริ่มปั๊ม ช่วยกระตุ้น let-down reflex",
      "จดบันทึกปริมาณและช่วงเวลา เพื่อดู pattern ว่ารอบไหนได้ผลดีที่สุด",
      "ปรับกรวยปั๊มให้เหมาะขนาด และพักผ่อน/ดื่มน้ำให้เพียงพอ เพราะมีผลกับปริมาณน้ำนม",
    ],
  },
];

export function getHowToArticleBySlug(slug: string): HowToArticle | null {
  return HOW_TO_ARTICLES.find((item) => item.slug === slug) ?? null;
}

