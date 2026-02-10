import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// 초기화
admin.initializeApp();
dayjs.extend(utc);
dayjs.extend(timezone);

// 설정값 (webhook URL은 꼭 본인의 것으로 변경해주세요!)
const TZ_KR = "Asia/Seoul";
const MATTERMOST_WEBHOOK_URL = "https://meeting.ssafy.com/hooks/er9t5dnp37bfigyctzra7684uc";
const TARGET_GROUP_ID = "서울15반"; // 🎯 타겟 그룹 ID 고정

// ==========================================
// 🛠️ 공통 로직: 특정 날짜의 '서울15반' 주문 내역 전송
// ==========================================
async function sendReport(targetDate: dayjs.Dayjs) {
    const db = admin.firestore();
    const startOfDay = targetDate.startOf("day").toDate();
    const endOfDay = targetDate.endOf("day").toDate();
    const dateStr = targetDate.format("MM/DD");

    try {
        // 1. '서울15반' 문서 하나만 콕 집어서 가져오기 (비용 절약 & 속도 향상)
        const groupDoc = await db.collection("groups").doc(TARGET_GROUP_ID).get();

        if (!groupDoc.exists) {
            logger.error(`그룹(${TARGET_GROUP_ID})을 찾을 수 없습니다.`);
            return "GROUP_NOT_FOUND";
        }

        const groupData = groupDoc.data();
        // types.ts 구조에 따라 history 배열 가져오기
        const history = groupData?.history || [];

        // 2. 해당 날짜(targetDate)의 주문만 필터링
        const targetOrders = history.filter((order: any) => {
            const orderDate = order.orderedAt.toDate(); // Firestore Timestamp -> Date 변환
            return orderDate >= startOfDay && orderDate <= endOfDay;
        });

        // 3. 주문 내역이 없으면 종료
        if (targetOrders.length === 0) {
            logger.info(`${dateStr} ${TARGET_GROUP_ID} 주문 내역 없음`);
            return "NO_DATA";
        }

        // 4. 메시지 본문 생성
        let totalReport = `#### ☕ ${TARGET_GROUP_ID} 주문 내역\n`;

        targetOrders.forEach((order: any) => {
            totalReport += `- 🕒 주문 시간: ${dayjs(order.orderedAt.toDate()).tz(TZ_KR).format("HH:mm")}\n`;

            order.items.forEach((item: any) => {
                const options = item.option === 'ONLY' ? '' : `(${item.option})`;
                // 메뉴명, 옵션, 수량, 주문자 표시
                totalReport += `  - ${item.menuName}${options} x ${item.count}개\n`;
            });

            // 주문 합계 (천단위 콤마)
            totalReport += `  - **💰 합계: ${order.totalPrice.toLocaleString()}원**\n\n`;
        });

        // 5. Mattermost 전송 페이로드 준비
        const payload = {
            username: "SSAFY 커피봇", // 봇 이름
            icon_url: "https://emojigraph.org/media/apple/hot-beverage_2615.png", // 아이콘
            text: `### 📢 ${dateStr} 커피 결제 리포트 도착!\n---\n${totalReport}\n---`,
        };

        // 6. 전송
        await axios.post(MATTERMOST_WEBHOOK_URL, payload);
        logger.info(`Mattermost 전송 성공 (${dateStr})`);
        return "SUCCESS";

    } catch (error) {
        logger.error("Mattermost 전송 실패:", error);
        throw error;
    }
}

// ==========================================
// ⏰ 1. 스케줄러 (매일 아침 06:30 자동 실행)
// ==========================================
export const scheduledCoffeeReport = onSchedule(
    {
        schedule: "30 6 * * *", // 매일 06:30
        timeZone: TZ_KR,
        region: "asia-northeast3",
    },
    async (event) => {
        // 스케줄러는 '어제' 데이터를 요약해서 보냅니다.
        const yesterday = dayjs().tz(TZ_KR).subtract(1, "day");
        await sendReport(yesterday);
    }
);

// ==========================================
// 🧪 2. 테스트용 HTTP 트리거 (즉시 실행)
// ==========================================
export const testReportNow = onRequest(
    { region: "asia-northeast3" },
    async (req, res) => {
        // 테스트할 때는 '오늘' 데이터를 바로 확인합니다.
        const today = dayjs().tz(TZ_KR);

        try {
            const result = await sendReport(today);
            res.send(`
                <h1>테스트 결과: ${result}</h1>
                <p>타겟 그룹: ${TARGET_GROUP_ID}</p>
                <p>기준 날짜: ${today.format("YYYY-MM-DD")}</p>
                <p>결과가 SUCCESS라면 Mattermost를 확인해보세요!</p>
            `);
        } catch (e) {
            res.status(500).send(`에러 발생: ${e}`);
        }
    }
);