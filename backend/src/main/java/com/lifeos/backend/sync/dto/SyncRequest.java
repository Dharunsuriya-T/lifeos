package com.lifeos.backend.sync.dto;

import java.time.LocalDateTime;
import java.util.List;

public record SyncRequest(
    LocalDateTime lastSyncTime,
    List<GoalDto> goals,
    List<RoadmapDto> roadmaps,
    List<RoadmapNodeDto> roadmapNodes,
    List<TaskDto> tasks,
    List<ProjectDto> projects,
    List<ProjectMilestoneDto> projectMilestones,
    List<LearningItemDto> learningItems,
    List<NoteDto> notes,
    List<JournalDto> journals,
    List<HabitDto> habits,
    List<HabitLogDto> habitLogs
) {}
