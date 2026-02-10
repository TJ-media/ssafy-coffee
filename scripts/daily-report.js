import admin from "firebase-admin";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ_KR = "Asia/Seoul";
const TARGET_GROUP_ID = "서울15반"; // ⚠️ DB ID 확인 필수

// GitHub Secrets 환경변수 사용
// eslint-disable-next-line no-undef
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
// eslint-disable-next-line no-undef
const MATTERMOST_WEBHOOK_URL = serviceAccount.mattermost_webhook_url || process.env.MATTERMOST_WEBHOOK_URL;

async function run() {
    console.log("🚀 [커피 룰렛 봇] 리포트 생성 시작...");

    const db = admin.firestore();

    // ==========================================
    // 1. 날짜 설정 (중요!)
    // ==========================================
    const now = dayjs().tz(TZ_KR);

    const targetDate = now;

    const startOfDay = targetDate.startOf("day");
    const endOfDay = targetDate.endOf("day");

    // JS Date 객체로 변환 (비교용)
    const startJsDate = startOfDay.toDate();
    const endJsDate = endOfDay.toDate();

    console.log(`📅 타겟 날짜(KST): ${targetDate.format("YYYY-MM-DD")}`);
    console.log(`🔎 그룹 ID: "${TARGET_GROUP_ID}"`);

    try {
        // 2. 그룹 데이터 가져오기
        const groupDoc = await db.collection("groups").doc(TARGET_GROUP_ID).get();

        if (!groupDoc.exists) {
            console.error(`❌ [오류] 그룹("${TARGET_GROUP_ID}")이 존재하지 않습니다.`);
            return;
        }

        const data = groupDoc.data();
        // ⭐️ 핵심 변경: history 대신 rouletteHistory 조회
        const rouletteHistory = data.rouletteHistory || [];

        console.log(`📊 전체 룰렛 기록: ${rouletteHistory.length}건`);

        // 3. 날짜 필터링 (해당 날짜에 게임한 기록 찾기)
        const targetGames = rouletteHistory.filter((game) => {
            let playedAt;

            // Timestamp 처리 안전장치
            if (game.playedAt && typeof game.playedAt.toDate === 'function') {
                playedAt = game.playedAt.toDate();
            } else if (game.playedAt) {
                playedAt = new Date(game.playedAt);
            } else {
                return false;
            }

            return playedAt >= startJsDate && playedAt <= endJsDate;
        });

        if (targetGames.length === 0) {
            console.log(`ℹ️ [결과] 해당 날짜에 진행된 룰렛 게임이 없습니다.`);
            return;
        }

        console.log(`✅ [결과] 전송할 게임 내역 ${targetGames.length}건 발견!`);

        // 4. 메시지 포맷팅 (제공해주신 데이터 구조 반영)
        let totalReport = "";

        targetGames.forEach((game, index) => {
            // 게임 시간
            const gameTime = game.playedAt && typeof game.playedAt.toDate === 'function'
                ? dayjs(game.playedAt.toDate()).tz(TZ_KR).format("HH:mm")
                : dayjs(game.playedAt).tz(TZ_KR).format("HH:mm");

            totalReport += `#### 🎲 Game ${index + 1} (⏰ ${gameTime})\n`;
            totalReport += `**👑 당첨자: ${game.winner}** 😭\n`;
            totalReport += `(참여자: ${game.participants.join(", ")})\n\n`;

            totalReport += `**🧾 주문 내역**\n`;

            // orderItems 순회
            game.orderItems.forEach((item) => {
                const options = item.option === 'ONLY' ? '' : `(${item.option})`;
                const orderedBy = item.orderedBy ? item.orderedBy.join(", ") : "알 수 없음";

                // 메뉴명 (옵션) x 수량 ... [주문자 이름]
                totalReport += `- ${item.menuName} ${options} x ${item.count}잔\n`;
                totalReport += `  └ 👤 ${orderedBy}\n`;
            });

            totalReport += `\n**💰 총 금액: ${game.totalPrice.toLocaleString()}원**\n`;
            totalReport += `---\n`;
        });

        // 5. Mattermost 전송
        if (MATTERMOST_WEBHOOK_URL) {
            await axios.post(MATTERMOST_WEBHOOK_URL, {
                username: "SSAFY 룰렛 봇",
                icon_url: "https://emojigraph.org/media/apple/game-die_1f3b2.png", // 주사위 아이콘
                text: `### 📢 ${targetDate.format("MM/DD(ddd)")} 커피 룰렛 결과\n---\n${totalReport}`,
            });
            console.log("🚀 Mattermost 전송 완료!");
        } else {
            console.error("❌ Webhook URL이 없습니다.");
        }

    } catch (error) {
        console.error("❌ 에러 발생:", error);
        // eslint-disable-next-line no-undef
        process.exit(1);
    }
}

run();