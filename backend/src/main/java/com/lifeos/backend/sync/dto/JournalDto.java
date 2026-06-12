package com.lifeos.backend.sync.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record JournalDto(
    UUID id,
    LocalDate entryDate,
    String wins,
    String challenges,
    String lessonsLearned,
    String gratitude,
    String mood,
    String energyLevel,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
