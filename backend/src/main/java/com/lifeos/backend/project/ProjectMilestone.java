package com.lifeos.backend.project;

import com.lifeos.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "project_milestones")
@Getter
@Setter
@NoArgsConstructor
public class ProjectMilestone extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "is_completed", nullable = false)
    private boolean isCompleted;

    @Column(name = "due_date")
    private LocalDateTime dueDate;
}
