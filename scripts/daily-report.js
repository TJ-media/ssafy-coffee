import admin from "firebase-admin";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// 플러그인 설정
dayjs.extend(utc);
dayjs.extend(timezone);

const TZ_KR = "Asia/Seoul";
const TARGET_GROUP_ID = "서울15반"; // ⚠️ Firestore 문서 ID와 100% 일치해야 함

// GitHub Secrets에서 서비스 계정 가져오기
// eslint-disable-next-line no-undef
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Firebase 초기화
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// 웹훅 URL (JSON 안에 있거나, 별도 환경변수에 있거나 둘 다 지원)
// eslint-disable-next-line no-undef
const MATTERMOST_WEBHOOK_URL = serviceAccount.mattermost_webhook_url || process.env.MATTERMOST_WEBHOOK_URL;

async function run() {
    console.log("🚀 [커피봇] 리포트 스크립트 시작");

    const db = admin.firestore();

    // ==========================================
    // 1. 날짜 범위 설정 (KST 기준)
    // ==========================================
    const now = dayjs().tz(TZ_KR);

    // 👇 [중요] 테스트할 때는 .subtract(1, "day")를 지우고 now만 남기세요!
    // 평소(자동실행)에는: const targetDate = now.subtract(1, "day");
    const targetDate = now;

    const startOfDay = targetDate.startOf("day");
    const endOfDay = targetDate.endOf("day");

    // 비교를 위해 Date 객체와 Timestamp 값(밀리초) 준비
    const startJsDate = startOfDay.toDate();
    const endJsDate = endOfDay.toDate();

    console.log(`📅 현재 서버 시간: ${now.format("YYYY-MM-DD HH:mm:ss")}`);
    console.log(`🎯 타겟 날짜(KST): ${targetDate.format("YYYY-MM-DD")}`);
    console.log(`   - 조회 시작: ${startOfDay.format("YYYY-MM-DD HH:mm:ss")}`);
    console.log(`   - 조회 종료: ${endOfDay.format("YYYY-MM-DD HH:mm:ss")}`);
    console.log(`🔎 타겟 그룹 ID: "${TARGET_GROUP_ID}"`);

    try {
        // ==========================================
        // 2. 데이터 가져오기
        // ==========================================
        const groupDoc = await db.collection("groups").doc(TARGET_GROUP_ID).get();

        if (!groupDoc.exists) {
            console.error(`❌ [오류] 그룹 문서("${TARGET_GROUP_ID}")를 찾을 수 없습니다! Firestore ID를 확인하세요.`);
            return;
        }
        console.log(`✅ 그룹 문서를 성공적으로 불러왔습니다.`);

        const data = groupDoc.data();
        const history = data.history || [];
        console.log(`📊 전체 히스토리 개수: ${history.length}건`);

        // ==========================================
        // 3. 정밀 필터링 (타입 안전 처리)
        // ==========================================
        const targetOrders = history.filter((order, index) => {
            let orderDate;

            // Firestore Timestamp 처리 (가장 중요!)
            if (order.orderedAt && typeof order.orderedAt.toDate === 'function') {
                orderDate = order.orderedAt.toDate();
            }
            // 문자열이나 일반 Date 객체인 경우
            else if (order.orderedAt) {
                orderDate = new Date(order.orderedAt);
            }
            else {
                console.warn(`⚠️ [${index}] 날짜 필드(orderedAt)가 없는 데이터 발견`);
                return false;
            }

            // 범위 비교
            const isMatch = orderDate >= startJsDate && orderDate <= endJsDate;

            // [디버그 로그] 최근 5건이거나 매칭된 경우 로그 출력
            if (index >= history.length - 5 || isMatch) {
                console.log(`   [${index}] 주문시간: ${dayjs(orderDate).tz(TZ_KR).format("MM/DD HH:mm:ss")} | 결과: ${isMatch ? "✅ 포함" : "❌ 제외"}`);
            }

            return isMatch;
        });

        if (targetOrders.length === 0) {
            console.log(`ℹ️ [결과] 해당 날짜의 주문 내역이 없습니다. (메시지 미전송)`);
            return;
        }

        console.log(`✅ [결과] 전송 대상 주문 ${targetOrders.length}건 확정!`);

        // ==========================================
        // 4. 메시지 생성 및 전송
        // ==========================================
        let totalReport = `#### ☕ ${TARGET_GROUP_ID} 주문 내역\n`;

        // 금액 합계 계산을 위해
        let dailyTotal = 0;

        targetOrders.forEach((order) => {
            dailyTotal += order.totalPrice;

            // 주문 시간 포맷팅
            let orderTimeObj = order.orderedAt && typeof order.orderedAt.toDate === 'function'
                ? order.orderedAt.toDate()
                : new Date(order.orderedAt);

            const timeStr = dayjs(orderTimeObj).tz(TZ_KR).format("HH:mm");

            totalReport += `- 🕒 **${timeStr}** (주문자: ${order.participants.join(", ")})\n`;

            order.items.forEach((item) => {
                const options = item.option === 'ONLY' ? '' : `(${item.option})`;
                totalReport += `  - ${item.menuName}${options} x ${item.count}개\n`;
            });
            totalReport += `  - **합계: ${order.totalPrice.toLocaleString()}원**\n\n`;
        });

        totalReport += `---\n**💰 총 결제 금액: ${dailyTotal.toLocaleString()}원**`;

        if (MATTERMOST_WEBHOOK_URL) {
            await axios.post(MATTERMOST_WEBHOOK_URL, {
                username: "SSAFY 커피봇",
                icon_url: "https://emojigraph.org/media/apple/hot-beverage_2615.png",
                text: `### 📢 ${targetDate.format("MM/DD(ddd)")} 커피 결제 리포트 도착!\n---\n${totalReport}`,
            });
            console.log("🚀 Mattermost 전송 완료!");
        } else {
            console.error("❌ Webhook URL이 설정되지 않았습니다.");
        }

    } catch (error) {
        console.error("❌ 치명적 에러 발생:", error);
        // eslint-disable-next-line no-undef
        process.exit(1);
    }
}

run();