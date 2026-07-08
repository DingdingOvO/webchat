package com.webchat.repository;

import com.webchat.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findAllByOrderByCreatedAtDesc();
    List<Feedback> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Feedback> findByReadOrderByCreatedAtDesc(boolean read);
}
