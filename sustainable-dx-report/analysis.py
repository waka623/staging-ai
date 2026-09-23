import json
import math
import os

# ==============================================================================
# 経産省ガイドラインver.2.7および環境省基準に基づく排出係数の設定（バグ修正済）
# ==============================================================================
# 【修正】単位のバグを修正し、正しく 0.435 (kg-CO2/kWh) に変更しました
CO2_COEFFICIENT_ELECTRICITY = 0.435  

CO2_COEFFICIENT_GAS = 2.230000          # kg-CO2/m3
CO2_COEFFICIENT_GASOLINE = 2.322000     # kg-CO2/L

# デジタル削減ロジック（Onaによる自動最適化の削減率目安）
WEB_REDUCTION_RATE = 0.50       # 通信量50%削減
CLOUD_REDUCTION_RATE = 0.35     # クラウドスペック適正化・夜間停止による35%削減
TRANSFER_COST_PER_MB = 0.015

# 実行場所に関係なく、このスクリプトと同じフォルダに出力する（generate_pdf.js と同じ場所）
RESULT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'result.json')

def run_analysis(target_url, monthly_access, office_kwh, office_billing_cost):
    # --- デジタル領域（Webフロントエンド）の計算 ---
    simulated_page_size_mb = 3.52 
    total_monthly_mb = simulated_page_size_mb * monthly_access
    
    # 1MB転送あたりのCO2目安を 0.29g-CO2 と仮定（0.00029gではなく0.29g = 0.00029kg）
    CO2_PER_MB = 0.00029  
    
    current_digital_co2_monthly = total_monthly_mb * CO2_PER_MB
    current_digital_cost_monthly = total_monthly_mb * TRANSFER_COST_PER_MB
    
    optimized_page_size_mb = simulated_page_size_mb * (1 - WEB_REDUCTION_RATE)
    saved_digital_co2_monthly = current_digital_co2_monthly * WEB_REDUCTION_RATE
    saved_digital_cost_monthly = current_digital_cost_monthly * WEB_REDUCTION_RATE
    
    # --- 拠点エネルギー領域（Scope 2）の計算 ---
    # 4,500 kWh * 0.435 = 1,957.5 kg-CO2 (月間総排出)
    current_office_co2_monthly = office_kwh * CO2_COEFFICIENT_ELECTRICITY
    
    # 1,957.5 * 0.15 = 293.625 kg-CO2 (15%削減ポテンシャルが正しく出ます)
    saved_office_co2_monthly = current_office_co2_monthly * 0.15
    saved_office_cost_monthly = office_billing_cost * 0.15

    # --- コスト＆CO2の合算と年間試算 ---
    total_saved_co2_monthly = saved_digital_co2_monthly + saved_office_co2_monthly
    total_saved_cost_monthly = saved_digital_cost_monthly + saved_office_cost_monthly
    annual_saved_cost = total_saved_cost_monthly * 12

    report_data = {
        "target_url": target_url,
        "monthly_access": f"{monthly_access:,}",
        "current_page_size": f"{simulated_page_size_mb:.2f} MB",
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
    
    with open(RESULT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, ensure_ascii=False, indent=4)
        
    print("[分析完了] result.json を更新しました。")

if __name__ == "__main__":
    run_analysis("https://example-shop.com", 15000, 4500, 130000)
