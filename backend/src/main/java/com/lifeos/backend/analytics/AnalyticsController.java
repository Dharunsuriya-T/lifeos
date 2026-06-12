package com.lifeos.backend.analytics;

import com.lifeos.backend.analytics.dto.AnalyticsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public AnalyticsResponse getAnalytics() {
        return analyticsService.getAnalyticsData();
    }
}
