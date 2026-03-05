// scripts/crawlBanaMenus.js
import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * 바나프레소 메뉴 크롤링 스크립트
 * - /query API 응답을 가로채서 메뉴 데이터를 추출
 * - 매장 선택 → 메뉴 순회 → 모달 열기(HOT/ICE) → 모달 닫기
 * 
 * 실행 방법: node scripts/crawlBanaMenus.js
 */

/** 모달 감지 선택자 (.modal-detail 클래스 기반) */
const MODAL_SELECTOR = '.modal-detail';

(async () => {
    console.log('🔥 바나프레소 크롤링을 시작합니다...');

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // /query API 응답을 모두 저장할 배열
    const interceptedData = [];

    // ── 1. 네트워크 응답 가로채기: /query 엔드포인트 ──
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/query') && response.request().method() === 'POST') {
            try {
                const text = await response.text();
                const json = JSON.parse(text);
                if (json) {
                    const requestBody = response.request().postData();
                    console.log(`📡 /query API 캡처`);
                    interceptedData.push({
                        url,
                        timestamp: new Date().toISOString(),
                        requestBody: requestBody ? JSON.parse(requestBody) : null,
                        data: json,
                    });
                }
            } catch (e) {
                // JSON 파싱 에러 무시
            }
        }
    });

    try {
        // ── 2. 바나프레소 주문 페이지 접속 ──
        await page.goto('https://order.banapresso.com/', { waitUntil: 'networkidle2' });
        console.log('✅ 페이지 접속 완료');
        await new Promise(r => setTimeout(r, 1000));

        // ── 3. 매장 선택 (가격 데이터 포함을 위해) ──
        console.log('🏬 매장을 선택합니다...');

        // aria-label="매장선택" 또는 aria-label="매장변경" 링크 정확히 찾기
        const storeBtnPos = await page.evaluate(() => {
            const a = document.querySelector('a[aria-label="매장선택"]')
                || document.querySelector('a[aria-label="매장변경"]');
            if (!a) return null;
            const rect = a.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        });

        if (storeBtnPos) {
            await page.mouse.click(storeBtnPos.x, storeBtnPos.y);
            console.log('  매장선택 모달 열기 클릭 완료. 매장 목록 로딩 대기...');

            // 매장 목록(#tab_LIST li)이 나타날 때까지 최대 10초 대기
            let storeListItem = null;
            for (let retry = 0; retry < 20; retry++) {
                await new Promise(r => setTimeout(r, 500));
                storeListItem = await page.evaluate(() => {
                    const items = document.querySelectorAll('#tab_LIST li');
                    if (items.length > 0) {
                        const rect = items[0].getBoundingClientRect();
                        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, name: items[0].textContent.substring(0, 20) };
                    }
                    return null;
                });
                if (storeListItem) break;
            }

            if (storeListItem) {
                await page.mouse.click(storeListItem.x, storeListItem.y);
                await new Promise(r => setTimeout(r, 3000));
                console.log(`✅ 매장 선택 완료: ${storeListItem.name}`);
            } else {
                console.log('⚠️ 매장 목록 로딩 실패. 가격 없이 진행합니다.');
            }
        } else {
            console.log('⚠️ 매장 선택 버튼을 찾지 못했습니다. 진행합니다.');
        }

        // ── 4. 모든 메뉴 아이템 순회 ──
        // 전체 메뉴 개수 확인
        const totalMenus = await page.evaluate(() => {
            // 메뉴명이 있는 strong 태그를 기준으로 메뉴 아이템 찾기
            return document.querySelectorAll('ul li strong').length;
        });
        console.log(`\n📋 총 ${totalMenus}개 메뉴 발견. 순회를 시작합니다...`);

        for (let i = 0; i < totalMenus; i++) {
            try {
                // 1) 스크롤 + 메뉴 위치 확인
                const menuInfo = await page.evaluate((index) => {
                    const items = document.querySelectorAll('ul li strong');
                    const strong = items[index];
                    if (!strong) return null;

                    const li = strong.closest('li');
                    if (!li) return null;

                    li.scrollIntoView({ behavior: 'instant', block: 'center' });

                    const rect = li.getBoundingClientRect();
                    return {
                        name: strong.textContent.trim(),
                        x: rect.x + rect.width / 2,
                        y: rect.y + rect.height / 2
                    };
                }, i);

                if (!menuInfo) continue;

                await new Promise(r => setTimeout(r, 500));

                // 2) Puppeteer의 page.mouse.click으로 실제 클릭 (React 이벤트 트리거)
                await page.mouse.click(menuInfo.x, menuInfo.y);

                // 3) 모달이 열릴 때까지 충분히 대기 (애니메이션 + 렌더링)
                await new Promise(r => setTimeout(r, 2000));

                // 모달이 열렸는지 확인 (.modal-detail 클래스 기반)
                const isModalOpen = await page.evaluate(() => {
                    return !!document.querySelector('.modal-detail');
                });

                if (!isModalOpen) {
                    console.log(`  ⚠️ [${i + 1}/${totalMenus}] ${menuInfo.name} - 모달 미열림, 건너뜀`);
                    await page.keyboard.press('Escape');
                    await new Promise(r => setTimeout(r, 500));
                    continue;
                }

                console.log(`  ✅ [${i + 1}/${totalMenus}] ${menuInfo.name} - 모달 열림`);
                await new Promise(r => setTimeout(r, 500));

                // 4) HOT 버튼 클릭 시도
                const hotBtnPos = await page.evaluate(() => {
                    const btn = document.querySelector('button.hot');
                    if (!btn) return null;
                    const rect = btn.getBoundingClientRect();
                    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                });
                if (hotBtnPos) {
                    await page.mouse.click(hotBtnPos.x, hotBtnPos.y);
                    await new Promise(r => setTimeout(r, 600));
                }

                // 5) ICE 버튼 클릭 시도
                const iceBtnPos = await page.evaluate(() => {
                    const btn = document.querySelector('button.ice');
                    if (!btn) return null;
                    const rect = btn.getBoundingClientRect();
                    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                });
                if (iceBtnPos) {
                    await page.mouse.click(iceBtnPos.x, iceBtnPos.y);
                    await new Promise(r => setTimeout(r, 600));
                }

                // 6) 모달 닫기 - X 버튼 좌표로 클릭
                const closeBtnPos = await page.evaluate(() => {
                    const modal = document.querySelector('.modal-detail');
                    if (!modal) return null;
                    const closeBtn = modal.querySelector('article > div > button');
                    if (!closeBtn) return null;
                    const rect = closeBtn.getBoundingClientRect();
                    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                });

                if (closeBtnPos) {
                    await page.mouse.click(closeBtnPos.x, closeBtnPos.y);
                } else {
                    await page.keyboard.press('Escape');
                }

                // 7) 모달이 완전히 닫히고 React 상태가 안정화될 때까지 충분히 대기
                await new Promise(r => setTimeout(r, 1500));

            } catch (err) {
                console.log(`  ⚠️ [${i + 1}/${totalMenus}] 오류 발생: ${err.message}`);
                await page.keyboard.press('Escape');
                await new Promise(r => setTimeout(r, 500));
            }
        }

        // ── 5. 결과 저장 ──
        const outputPath = './banapresso_menus.json';
        fs.writeFileSync(outputPath, JSON.stringify(interceptedData, null, 2), 'utf-8');
        console.log(`\n🎉 크롤링 완료! 총 ${interceptedData.length}개의 API 응답 데이터를 캡처했습니다.`);
        console.log(`📁 데이터 저장 완료: ${outputPath}`);

    } catch (error) {
        console.error('❌ 크롤링 중 오류가 발생했습니다:', error);
    } finally {
        await browser.close();
    }
})();