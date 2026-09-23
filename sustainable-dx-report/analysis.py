import json
import math
import os
import requests

# ==============================================================================
# 経産省ガイドラインver.2.7および環境省基準に基づく排出係数の設定
# ==============================================================================
CO2_COEFFICIENT_ELECTRICITY = 0.435  # kg-CO2/kWh (関西電力等の調整後排出係数目安)
CO2_COEFFICIENT_GAS = 2.230000          # kg-CO2/m3
CO2_COEFFICIENT_GASOLINE = 2.322000     # kg-CO2/L

# デジタル削減ロジック（Onaによる自動最適化の削減率目安）
WEB_REDUCTION_RATE = 0.50       # 通信量50%削減
CLOUD_REDUCTION_RATE = 0.35     # クラウドスペック適正化・夜間停止による35%削減
TRANSFER_COST_PER_MB = 0.015
CO2_PER_MB = 0.00029  # 1MB転送あたりのCO2(kg)

# 実行場所に関係なく、このスクリプトと同じフォルダに出力する（generate_pdf.js と同じ場所）
RESULT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'result.json')

def get_live_page_size_mb(url):
    """
    指定されたURLのトップページのデータサイズ（MB）をリアルタイムで取得する
    """
    try:
        # サーバー全体のデータを実際にダウンロードして正確なバイト数を計測
        headers = {'User-Agent': 'Sustainable-DX-Analyzer/1.0'}
        response = requests.get(url, headers=headers, timeout=10)
        
        # レスポンスデータの実際のバイト数を取得
        bytes_size = len(response.content)
        
        # バイトからメガバイト(MB)に変換
        size_mb = bytes_size / (1024 * 1024)
        
        # あまりに小さすぎる（エラーページなど）場合は、計測の最低値を 0.1 MB とする
        return max(size_mb, 0.1)
    except Exception as e:
        print(f"⚠️ URLのデータサイズ取得に失敗したため、平均値(2.5MB)を使用します: {e}")
        return 2.50

def run_analysis(target_url, monthly_access, office_kwh, office_billing_cost):
    print(f"[システム起動] {target_url} のリアルタイムデジタル負荷および拠点エネルギーを解析中...")
    
    # --- 1. 【機能拡張】実際のURLからデータサイズを動的に取得 ---
    measured_page_size_mb = get_live_page_size_mb(target_url)
    print(f"[計測結果] 実際のページサイズ: {measured_page_size_mb:.2f} MB")
    
    # 月間総通信量と現状の月間コスト・CO2
    total_monthly_mb = measured_page_size_mb * monthly_access
    current_digital_co2_monthly = total_monthly_mb * CO2_PER_MB
    current_digital_cost_monthly = total_monthly_mb * TRANSFER_COST_PER_MB
    
    # Ona(AI)最適化後の月間予測（50%削減）
    optimized_page_size_mb = measured_page_size_mb * (1 - WEB_REDUCTION_RATE)
    saved_digital_co2_monthly = current_digital_co2_monthly * WEB_REDUCTION_RATE
    saved_digital_cost_monthly = current_digital_cost_monthly * WEB_REDUCTION_RATE
    
    # --- 2. 拠点エネルギー領域（Scope 2）の計算 ---
    current_office_co2_monthly = office_kwh * CO2_COEFFICIENT_ELECTRICITY
    saved_office_co2_monthly = current_office_co2_monthly * 0.15
    saved_office_cost_monthly = office_billing_cost * 0.15

    # --- 3. コスト＆CO2の合算と年間試算 ---
    total_saved_co2_monthly = saved_digital_co2_monthly + saved_office_co2_monthly
    total_saved_cost_monthly = saved_digital_cost_monthly + saved_office_cost_monthly
    annual_saved_cost = total_saved_cost_monthly * 12

    report_data = {
        "target_url": target_url,
        "monthly_access": f"{monthly_access:,}",
        "current_page_size": f"{measured_page_size_mb:.2f} MB",
        "optimized_page_size": f"{optimized_page_size_mb:.2f} MB",
        "saved_co2_monthly": f"{total_saved_co2_monthly:.2f}",
        "saved_cost_monthly": f"{math.floor(total_saved_cost_monthly):,}",
        "annual_saved_cost": f"{math.floor(annual_saved_cost):,}",
        "breakdown": {
            "digital_cost_saved": f"{math.floor(saved_digital_cost_monthly):,}",
            "office_cost_saved": f"{math.floor(saved_office_cost_monthly):,}",
            "digital_co2_saved": f"{saved_digital_co2_monthly:.2f}",
            "office_co2_saved": f"{saved_office_co2_monthly:.2f}"
        }
    }
    
    # 指定フォルダ内に結果を出力
    with open(RESULT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, ensure_ascii=False, indent=4)
        
    print("[分析完了] リアルタイム計測を反映した result.json を更新しました。")

if __name__ == "__main__":
    # 実証実験として実際のURLを入力（例として検証用のショップURLを想定）
    run_analysis("https://example.com", 15000, 4500, 130000)
