package com.webchat.repository;

import com.webchat.document.MessageDoc;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MessageRepository extends MongoRepository<MessageDoc, String> {
    List<MessageDoc> findByConversationKeyOrderByCreatedAtAsc(String conversationKey);

    List<MessageDoc> findByConversationKeyAndCreatedAtAfterOrderByCreatedAtAsc(
            String conversationKey, java.time.Instant after);
}
