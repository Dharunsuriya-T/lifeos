package com.lifeos.backend.journal;

import com.lifeos.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JournalRepository extends JpaRepository<Journal, UUID> {
    List<Journal> findByUser(User user);
    Optional<Journal> findByUserAndEntryDate(User user, LocalDate date);
    List<Journal> findByUserAndUpdatedAtAfter(User user, LocalDateTime timestamp);
}
