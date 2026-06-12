package com.lifeos.backend.journal;

import com.lifeos.backend.common.BaseEntity;
import com.lifeos.backend.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "journals", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "entry_date"})
})
@Getter
@Setter
@NoArgsConstructor
public class Journal extends BaseEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    private String wins;

    private String challenges;

    @Column(name = "lessons_learned")
    private String lessonsLearned;

    private String gratitude;

    private String mood;

    @Column(name = "energy_level")
    private String energyLevel;
}
