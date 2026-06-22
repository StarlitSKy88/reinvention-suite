"""
To-G 项目机会评分引擎

输入：政府采购公告 / 人社局公告
输出：机会评分（0-100）+ 推荐行动
"""

import re
from datetime import datetime, timedelta
from typing import Any

import structlog

from src.scrapers.base import ScraperResult

logger = structlog.get_logger("scraper.opportunity_scorer")


# 评分维度权重
WEIGHTS = {
    "keyword_match": 30,      # 关键词匹配度
    "budget_size": 20,         # 预算金额
    "freshness": 15,           # 时效性
    "region_priority": 15,      # 地区优先级
    "buyer_type": 10,           # 采购方类型
    "competition": 10,          # 竞争度
}


class OpportunityScorer:
    """机会评分器"""

    # 高价值关键词
    HIGH_VALUE_KEYWORDS = [
        "再就业服务", "稳就业", "再就业培训",
        "AI求职", "智能招聘", "人工智能招聘",
        "35+", "35岁", "失业人员再就业",
    ]

    # 关键词权重（命中次数累加）
    KEYWORD_SCORES = {
        "再就业服务": 10,
        "稳就业": 8,
        "AI求职": 8,
        "35+失业": 6,
        "人力资源服务": 5,
        "再就业培训": 5,
        "招聘平台": 4,
        "公共就业服务": 4,
        "职业指导": 3,
        "就业培训": 3,
    }

    # 地区优先级（一线城市优先）
    REGION_PRIORITY = {
        "北京": 15, "上海": 15, "深圳": 13, "广州": 13,
        "杭州": 11, "成都": 10, "武汉": 9, "南京": 9,
        "苏州": 8, "西安": 7, "重庆": 7,
        # 默认 5 分
    }

    # 采购方优先级
    BUYER_TYPE_SCORES = {
        "人社局": 15,
        "就业服务中心": 15,
        "社保局": 12,
        "区政府": 10,
        "街道办事处": 8,
        "学校": 5,
        "其他": 3,
    }

    def score(self, opportunity: ScraperResult) -> dict:
        """
        评估机会质量

        Returns:
            {
                "score": 0-100,
                "factors": {各维度分数},
                "recommendation": "high/medium/low",
                "next_actions": ["..."]
            }
        """
        factors = {
            "keyword_match": self._score_keywords(opportunity),
            "budget_size": self._score_budget(opportunity),
            "freshness": self._score_freshness(opportunity),
            "region_priority": self._score_region(opportunity),
            "buyer_type": self._score_buyer(opportunity),
            "competition": self._score_competition(opportunity),
        }

        # 加权总分
        total = sum(
            factors[k] * (WEIGHTS[k] / 100)
            for k in factors
        )

        # 推荐
        if total >= 75:
            recommendation = "high"
            actions = [
                "立即指派 BD 联系采购方",
                "48 小时内提交意向",
                "安排现场拜访",
            ]
        elif total >= 50:
            recommendation = "medium"
            actions = [
                "3 天内联系采购方",
                "准备技术方案",
                "加入项目跟踪列表",
            ]
        else:
            recommendation = "low"
            actions = [
                "暂时观望",
                "周报汇总后再决定",
            ]

        return {
            "score": round(total),
            "factors": factors,
            "recommendation": recommendation,
            "next_actions": actions,
        }

    def _score_keywords(self, opp: ScraperResult) -> int:
        """关键词匹配评分（满分 100）"""
        text = opp.title + " " + opp.description
        score = 0
        for kw, points in self.KEYWORD_SCORES.items():
            if kw in text:
                score += points
        return min(score, 100)

    def _score_budget(self, opp: ScraperResult) -> int:
        """预算评分"""
        budget = opp.raw_data.get("budget")
        if not budget:
            return 30  # 无预算信息，中等分数

        # 提取数字
        match = re.search(r"(\d+(?:\.\d+)?)", str(budget))
        if not match:
            return 30

        amount_wan = float(match.group(1))

        if amount_wan >= 500:
            return 100
        elif amount_wan >= 200:
            return 80
        elif amount_wan >= 100:
            return 60
        elif amount_wan >= 50:
            return 40
        else:
            return 20

    def _score_freshness(self, opp: ScraperResult) -> int:
        """时效性评分"""
        publish_date = opp.raw_data.get("publish_date")
        if not publish_date:
            return 50

        try:
            # 解析日期
            if "今天" in publish_date or "今日" in publish_date:
                return 100
            elif "昨天" in publish_date:
                return 90

            # 尝试解析 YYYY-MM-DD 格式
            match = re.search(r"(\d{4})-(\d{2})-(\d{2})", publish_date)
            if match:
                date = datetime(
                    int(match.group(1)),
                    int(match.group(2)),
                    int(match.group(3)),
                )
                days_ago = (datetime.now() - date).days

                if days_ago <= 1:
                    return 100
                elif days_ago <= 7:
                    return 80
                elif days_ago <= 30:
                    return 60
                else:
                    return 20

        except Exception:
            pass

        return 30

    def _score_region(self, opp: ScraperResult) -> int:
        """地区评分"""
        for region, score in self.REGION_PRIORITY.items():
            if region in opp.location or region in opp.company:
                return score
        return 5

    def _score_buyer(self, opp: ScraperResult) -> int:
        """采购方评分"""
        for buyer_type, score in self.BUYER_TYPE_SCORES.items():
            if buyer_type in opp.company:
                return score
        return 3

    def _score_competition(self, opp: ScraperResult) -> int:
        """竞争度评分（越低竞争度越高分）"""
        # 简化版：基于关键词热门程度推断
        title = opp.title

        # 热门关键词 = 竞争激烈
        if "通用" in title or "综合" in title:
            return 30
        elif "AI" in title or "人工智能" in title:
            return 60  # AI 是热门但专业性强，竞争相对小
        elif "再就业" in title or "35+" in title:
            return 90  # 35+ 群体市场小众，竞争度低
        else:
            return 50


# 全局实例
scorer = OpportunityScorer()
