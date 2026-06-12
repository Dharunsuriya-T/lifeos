package com.lifeos.backend.analytics.dto;

import java.util.List;
import java.util.Map;

public record AnalyticsResponse(
    int growthScore,
    Map<String, Integer> goalEstimatedCompletionDays,
    List<TrendDto> growthTrends,
    List<String> reflectionInsights
) {
    public record TrendDto(
        String weekLabel,
        int score
    ) {}
}
