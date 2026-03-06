// scripts/crawlBanaMenus.js
import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * 바나프레소 메뉴 크롤링 스크립트
 * - 바나프레소 주문 페이지에 접속하여 매장 선택 후
 * - 옵션 마스터 API와 메뉴 데이터 API의 네트워크 응답을 가로채서
 * - 각 메뉴의 ICE/HOT별 옵션 그룹명(sTitle)을 추출
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

    // 옵션 마스터 & 메뉴 데이터 저장용
    let optionMasterRows = null;
    let menuDataRows = null;

    // ── 1. 네트워크 응답 가로채기: /query 엔드포인트 ──
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/query') && response.request().method() === 'POST') {
            try {
                const text = await response.text();
                const json = JSON.parse(text);
                if (json) {
                    const requestBody = response.request().postData();
                    const parsedBody = requestBody ? JSON.parse(requestBody) : null;
                    console.log(`📡 /query API 캡처`);
                    interceptedData.push({
                        url,
                        timestamp: new Date().toISOString(),
                        requestBody: parsedBody,
                        data: json,
                    });

                    // 옵션 마스터 API 감지 (queryHash 기반)
                    if (parsedBody && parsedBody.queryHash === '7426BEAF86B272A76AEE27580B296CF3') {
                        optionMasterRows = json.rows || [];
                        console.log(`  ✅ 옵션 마스터 데이터 캡처 완료 (${optionMasterRows.length}행)`);
                    }
                    // 메뉴 데이터 API 감지 (queryHash 기반)
                    if (parsedBody && parsedBody.queryHash === '91D8843AB9D3C73B28F1043252C574AF') {
                        menuDataRows = json.rows || [];
                        console.log(`  ✅ 메뉴 데이터 캡처 완료 (${menuDataRows.length}행)`);
                    }
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

        // ── 4. API 데이터가 로드될 때까지 대기 ──
        console.log('\n⏳ API 데이터 로딩 대기 중...');
        for (let retry = 0; retry < 30; retry++) {
            await new Promise(r => setTimeout(r, 1000));
            if (optionMasterRows && menuDataRows) break;
        }

        // ── 5. 옵션 그룹 매핑 구축 ──
        if (optionMasterRows && menuDataRows) {
            console.log('\n📊 옵션 그룹 매핑 구축 중...');

            // nGroupID → sTitle(그룹명) 매핑
            const groupMap = {};
            optionMasterRows.forEach(row => {
                const groupId = String(row[1]);
                const groupName = row[2];
                if (!groupMap[groupId]) groupMap[groupId] = groupName;
            });
            console.log(`  그룹 수: ${Object.keys(groupMap).length}`);
            console.log('  그룹 목록:', Object.entries(groupMap).map(([id, name]) => `${id}:${name}`).join(', '));

            // 옵션 상세 항목 (추가 메뉴 데이터 생성용)
            const optionDetails = {};
            optionMasterRows.forEach(row => {
                const groupId = String(row[1]);
                const groupName = row[2];
                const itemName = row[3];
                const price = row[4] || 0;
                if (!optionDetails[groupId]) optionDetails[groupId] = { groupName, items: [] };
                optionDetails[groupId].items.push({ name: itemName, price });
            });

            // ── 6. 각 메뉴의 ICE/HOT 옵션 그룹명 추출 ──
            console.log('\n📋 메뉴별 옵션 추출 중...');
            const menuOptions = menuDataRows.map(row => {
                const name = row[4];
                const optStr = row[9] || '';
                const parts = optStr.split(';').filter(s => s.trim());

                let optionsIce = [];
                let optionsHot = [];

                if (parts.length >= 1) {
                    optionsIce = [...new Set(
                        parts[0].split(',')
                            .filter(id => id.trim())
                            .map(id => groupMap[id.trim()])
                            .filter(Boolean)
                    )];
                }
                if (parts.length >= 2) {
                    optionsHot = [...new Set(
                        parts[1].split(',')
                            .filter(id => id.trim())
                            .map(id => groupMap[id.trim()])
                            .filter(Boolean)
                    )];
                }

                return { name, optionsIce, optionsHot };
            });

            // ── 7. 결과 저장 ──
            const output = {
                groupMap,
                optionDetails,
                menus: menuOptions,
            };
            const outputPath = './banapresso_options.json';
            fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
            console.log(`\n🎉 옵션 데이터 추출 완료!`);
            console.log(`📁 데이터 저장: ${outputPath}`);

            // 검증 출력
            const americano = menuOptions.find(m => m.name === '아메리카노');
            if (americano) {
                console.log('\n검증 - 아메리카노:');
                console.log('  ICE:', americano.optionsIce);
                console.log('  HOT:', americano.optionsHot);
            }
        } else {
            console.log('⚠️ API 데이터를 캡처하지 못했습니다.');
            console.log(`  옵션 마스터: ${optionMasterRows ? '있음' : '없음'}`);
            console.log(`  메뉴 데이터: ${menuDataRows ? '있음' : '없음'}`);
        }

        // ── 8. raw 데이터도 저장 ──
        const rawOutputPath = './banapresso_menus.json';
        fs.writeFileSync(rawOutputPath, JSON.stringify(interceptedData, null, 2), 'utf-8');
        console.log(`\n📁 raw API 데이터 저장: ${rawOutputPath}`);

    } catch (error) {
        console.error('❌ 크롤링 중 오류가 발생했습니다:', error);
    } finally {
        await browser.close();
    }
})();