package com.webchat.repository;

import com.webchat.document.MessageDoc;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MessageRepository extends MongoRepository<MessageDoc, String> {
    List<MessageDoc> findByConversationKeyOrderByCreatedAtAsc(String conversationKey);
    List<MessageDoc> findByConversationKeyAndCreatedAtAfterOrderByCreatedAtAsc(String conversationKey, java.time.Instant after);
}
