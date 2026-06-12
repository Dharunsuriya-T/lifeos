package com.lifeos.backend.habit;

import com.lifeos.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "habit_logs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"habit_id", "completed_date"})
})
@Getter
@Setter
@NoArgsConstructor
public class HabitLog extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_id", nullable = false)
    private Habit habit;

    @Column(name = "completed_date", nullable = false)
    private LocalDate completedDate;

    @Column(name = "is_completed", nullable = false)
    private boolean isCompleted;
}
