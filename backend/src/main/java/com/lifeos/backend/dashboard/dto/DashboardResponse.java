package com.lifeos.backend.dashboard.dto;

import java.time.LocalDateTime;
import java.util.List;

public record DashboardResponse(
    long todayTasksCount,
    long completedTasksToday,
    long activeGoalsCount,
    int averageGoalProgress,
    int habitCompletionRate,
    int journalStreak,
    long activeProjectsCount,
    List<DeadlineDto> upcomingDeadlines
) {
    public record DeadlineDto(
        String title,
        String type, // TASK, PROJECT, ROADMAP_NODE
        LocalDateTime deadline
    ) {}
}
