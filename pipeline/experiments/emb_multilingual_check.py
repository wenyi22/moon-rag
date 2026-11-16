# 比較英文模型 vs 多語模型在中文同義句 / 無關句上的餘弦相似度
import sys; sys.stdout.reconfigure(encoding="utf-8")
from sentence_transformers import SentenceTransformer, util
pairs = [("如何提升模型效能", "性能優化策略"), ("檢索增強生成可以減少幻覺", "RAG 透過外部資料降低模型胡亂編造"),
         ("向量資料庫用來找相似文件", "以嵌入向量搜尋語意相近的段落")]
neg = [("如何提升模型效能", "今天的晚餐是牛肉麵"), ("檢索增強生成可以減少幻覺", "台北明天會下雨"),
       ("向量資料庫用來找相似文件", "貓咪喜歡曬太陽")]
for name in ["all-MiniLM-L6-v2", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"]:
    m = SentenceTransformer(name)
    s = lambda ps: [float(util.cos_sim(*m.encode([a, b], normalize_embeddings=True))) for a, b in ps]
    p, n = s(pairs), s(neg)
    print(f"{name}\n  同義 {[round(x,3) for x in p]} 平均 {sum(p)/3:.3f}\n  無關 {[round(x,3) for x in n]} 平均 {sum(n)/3:.3f}\n  差距 {sum(p)/3-sum(n)/3:.3f}")
