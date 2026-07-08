package com.webchat.controller;

import com.webchat.model.Feedback;
import com.webchat.repository.FeedbackRepository;
import com.webchat.model.User;
import com.webchat.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackRepository feedbackRepo;
    private final AuthService authService;

    public FeedbackController(FeedbackRepository feedbackRepo, AuthService authService) {
        this.feedbackRepo = feedbackRepo;
        this.authService = authService;
    }

    /** 提交反馈 */
    @PostMapping
    public ResponseEntity<?> submit(@Valid @RequestBody FeedbackRequest req,
                                     @RequestHeader(value = "Authorization", required = false) String auth,
                                     HttpServletRequest request) {
        Feedback fb = new Feedback();
        fb.setType(req.type());
        fb.setDeployment(req.deployment());
        fb.setTitle(req.title());
        fb.setDescription(req.description());
        fb.setStepsToReproduce(req.stepsToReproduce());
        fb.setExpectedBehavior(req.expectedBehavior());
        fb.setActualBehavior(req.actualBehavior());
        fb.setGithubUsername(req.githubUsername());
        fb.setContact(req.contact());
        fb.setUserAgent(request.getHeader("User-Agent"));
        fb.setPageUrl(request.getHeader("Referer"));

        // 如果已登录，记录用户 ID
        if (auth != null && auth.startsWith("Bearer ")) {
            try {
                User user = authService.validateToken(auth.substring(7));
                fb.setUserId(user.getId());
            } catch (Exception ignored) {}
        }

        feedbackRepo.save(fb);

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "感谢你的反馈！我们会认真处理。",
                "id", fb.getId()
        ));
    }

    /** 反馈请求 DTO */
    public record FeedbackRequest(
            @NotBlank(message = "反馈类型不能为空")
            Feedback.Type type,

            @NotBlank(message = "部署形式不能为空")
            Feedback.Deployment deployment,

            @Size(max = 200, message = "标题不超过 200 字")
            String title,

            @NotBlank(message = "描述不能为空")
            @Size(max = 10000, message = "描述不超过 10000 字")
            String description,

            @Size(max = 10000, message = "长度超出限制")
            String stepsToReproduce,

            @Size(max = 5000, message = "长度超出限制")
            String expectedBehavior,

            @Size(max = 5000, message = "长度超出限制")
            String actualBehavior,

            @Size(max = 100, message = "用户名不超过 100 字")
            String githubUsername,

            @Size(max = 200, message = "联系方式不超过 200 字")
            String contact
    ) {}
}
