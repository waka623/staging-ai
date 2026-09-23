// スタンドアロンのNodeスクリプト（CommonJS）のため、Next.js用のESM前提ルールを無効化
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const esc = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function generateReportPDF() {
  let browser;
  try {
    const jsonPath = path.join(__dirname, 'result.json');
    if (!fs.existsSync(jsonPath)) throw new Error('result.json が見つかりません。');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    // テンプレート内は必ず ${esc(data.xxx)} で埋め込む
    const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>サステナブルDX 診断レポート</title>
    <style>
        @page { size: A4; margin: 0; }
        body { font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Noto Sans CJK JP', sans-serif; color: #2D3748; margin: 0; padding: 40px; background-color: #F7FAFC; -webkit-print-color-adjust: exact; }
        .header { border-bottom: 3px solid #38A169; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .title { color: #1A202C; font-size: 26px; margin: 0; font-weight: bold; }
        .url { color: #718096; font-size: 14px; margin-top: 5px; }

        /* 2コラムのメインカード */
        .summary-container { display: flex; gap: 20px; margin-bottom: 30px; }
        .card { flex: 1; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); color: white; }
        .card-cost { background: linear-gradient(135deg, #2B6CB0, #2B6CB0); } /* コスト削減：信頼のブルー */
        .card-co2 { background: linear-gradient(135deg, #2F855A, #38A169); }  /* 脱炭素：エコのグリーン */
        .card-label { font-size: 14px; opacity: 0.9; font-weight: 500; }
        .card-value { font-size: 32px; font-weight: bold; margin: 12px 0; }
        .card-sub { font-size: 13px; opacity: 0.85; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px; }

        /* 詳細テーブル */
        .section-title { font-size: 18px; color: #2D3748; border-left: 5px solid #2B6CB0; padding-left: 10px; margin-bottom: 15px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        th { background-color: #EDF2F7; text-align: left; padding: 14px; font-size: 14px; color: #4A5568; }
        td { padding: 14px; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
        .text-right { text-align: right; }
        .highlight-text { color: #E53E3E; font-weight: bold; }

        /* Onaのアクションプラン */
        .action-box { background-color: #EBF8FF; border-left: 5px solid #3182CE; padding: 20px; border-radius: 0 8px 8px 0; }
        .action-title { font-weight: bold; color: #2B6CB0; margin-bottom: 8px; font-size: 15px; }
        .action-list { margin: 0; padding-left: 20px; font-size: 13.5px; line-height: 1.6; color: #4A5568; }

        .footer { text-align: center; color: #A0AEC0; font-size: 11px; margin-top: 50px; border-top: 1px solid #E2E8F0; padding-top: 15px; }
    </style>
</head>
<body>

    <div class="header">
        <div>
            <h1 class="title">サステナブルDX 診断成果報告書</h1>
            <div class="url">対象URL: <strong>${esc(data.target_url)}</strong></div>
        </div>
        <div style="text-align: right; font-size: 12px; color: #718096;">経済産業省ガイドライン ver.2.7準拠</div>
    </div>

    <!-- メイン数値カード -->
    <div class="summary-container">
        <div class="card card-cost">
            <div class="card-label">💰 年間の既存固定費 削減見込み額</div>
            <div class="card-value">￥${esc(data.annual_saved_cost)} <span style="font-size: 16px;">/ 年</span></div>
            <div class="card-sub">月額換算で <strong>￥${esc(data.saved_cost_monthly)}</strong> のコストが翌月から浮きます</div>
        </div>
        <div class="card card-co2">
            <div class="card-label">🍀 月間の温室効果ガス（CFP）削減量</div>
            <div class="card-value">${esc(data.saved_co2_monthly)} <span style="font-size: 16px;">kg-CO2 / 月</span></div>
            <div class="card-sub">大企業へのScope 3提出データとしてそのまま利用可能</div>
        </div>
    </div>

    <!-- 詳細内訳 -->
    <div class="section-title">AI自動削減プランの具体策と内訳</div>
    <table>
        <thead>
            <tr>
                <th>削減対象セクター</th>
                <th>現状の負荷・コスト</th>
                <th>AI（Ona）による対策内容</th>
                <th class="text-right">削減できる金額 / 月</th>
                <th class="text-right">削減できるCO2 / 月</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>① Webフロントエンド</strong><br><span style="font-size: 12px; color: #718096;">(ECサイト通信量削減)</span></td>
                <td>ページサイズ: ${esc(data.current_page_size)}<br>月間 ${esc(data.monthly_access)}アクセス</td>
                <td>CO2.js連携による画像の自動WebP変換および不要なスクリプトのAIコード自動修正（転送量50%削減）</td>
                <td class="text-right highlight-text">￥${esc(data.breakdown.digital_cost_saved)}</td>
                <td class="text-right">${esc(data.breakdown.digital_co2_saved)} kg</td>
            </tr>
            <tr>
                <td><strong>② 拠点エネルギー</strong><br><span style="font-size: 12px; color: #718096;">(オフィス Scope 2)</span></td>
                <td>電気・インフラの使用実績より算出</td>
                <td>空調・照明マッピングの最適化、夜間待機電力のカットアドバイス（15%削減シミュレート）</td>
                <td class="text-right highlight-text">￥${esc(data.breakdown.office_cost_saved)}</td>
                <td class="text-right">${esc(data.breakdown.office_co2_saved)} kg</td>
            </tr>
        </tbody>
    </table>

    <!-- Onaの自動実行スケジュール -->
    <div class="action-box">
        <div class="action-title">🤖 Ona（AIエージェント）による来月の自動最適化タスク</div>
        <ul class="action-list">
            <li><strong>GitHub連携リポジトリのクリーンアップ</strong>：不要な肥大化JavaScriptをAIが自動でリファクタリングし、サイト表示速度を高速化します。</li>
            <li><strong>スマートメーター自動スキャン</strong>：翌月のCSVアップロードを受け、電力使用のさらなるピークカットポイントを自律的に抽出します。</li>
        </ul>
    </div>

    <div class="footer">
        提供：サステナブルDX自動化ソリューション | Powered by GitHub &amp; Ona Agent Engine
    </div>

</body>
</html>`;
    browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.pdf({ path: path.join(__dirname, 'Sustainable_DX_Report.pdf'), format: 'A4', printBackground: true });
    console.log('[PDF生成完了]');
  } catch (error) {
    console.error('PDF生成中にエラーが発生しました:', error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
}
generateReportPDF();
