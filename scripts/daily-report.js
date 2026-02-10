import admin from "firebase-admin";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// GitHub Secrets에서 환경변수로 넣어준 키(JSON)를 파싱합니다.
// eslint-disable-next-line no-undef
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const TZ_KR = "Asia/Seoul";

// [변경] 웹훅 주소를 serviceAccount 객체 안에서 꺼내옵니다.
const MATTERMOST_WEBHOOK_URL = serviceAccount.mattermost_webhook_url;
const TARGET_GROUP_ID = "서울15반";

async function run() {
    console.log("🚀 리포트 발송 시작...");

    const db = admin.firestore();
    // 스케줄러는 '어제' 데이터를 보냅니다.
    const targetDate = dayjs().tz(TZ_KR).subtract(1, "day");

    const startOfDay = targetDate.startOf("day").toDate();
    const endOfDay = targetDate.endOf("day").toDate();
    const dateStr = targetDate.format("MM/DD");

    try {
        const groupDoc = await db.collection("groups").doc(TARGET_GROUP_ID).get();

        if (!groupDoc.exists) {
            console.log(`❌ 그룹(${TARGET_GROUP_ID})을 찾을 수 없습니다.`);
            return;
        }

        const history = groupDoc.data().history || [];
        const targetOrders = history.filter((order) => {
            // Timestamp -> Date 변환
            const orderDate = order.orderedAt.toDate();
            return orderDate >= startOfDay && orderDate <= endOfDay;
        });

        if (targetOrders.length === 0) {
            console.log(`ℹ️ ${dateStr} 주문 내역이 없습니다.`);
            return;
        }

        let totalReport = `#### ☕ ${TARGET_GROUP_ID} 주문 내역\n`;
        targetOrders.forEach((order) => {
            totalReport += `- 🕒 ${dayjs(order.orderedAt.toDate()).tz(TZ_KR).format("HH:mm")}\n`;
            order.items.forEach((item) => {
                const options = item.option === 'ONLY' ? '' : `(${item.option})`;
                totalReport += `  - ${item.menuName}${options} x ${item.count}개\n`;
            });
            totalReport += `  - **💰 합계: ${order.totalPrice.toLocaleString()}원**\n\n`;
        });

        await axios.post(MATTERMOST_WEBHOOK_URL, {
            username: "SSAFY 커피봇",
            icon_url: "https://emojigraph.org/media/apple/hot-beverage_2615.png",
            text: `### 📢 ${dateStr} 커피 결제 리포트\n---\n${totalReport}\n---`,
        });
        console.log("✅ Mattermost 전송 성공!");

    } catch (error) {
        console.error("❌ 에러 발생:", error);
        // eslint-disable-next-line no-undef
        process.exit(1); // 에러 발생 시 GitHub Action 실패 처리
    }
}

run();