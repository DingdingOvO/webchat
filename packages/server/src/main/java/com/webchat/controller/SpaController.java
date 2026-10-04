package com.webchat.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 单端口部署下的 SPA 路由回退。
 *
 * <p>前端使用 History API 路由（/app/chat、/docs、/settings 等），这些路径在服务端并不存在
 * 对应的静态文件。若不做回退，用户「直接访问」或「在深层路由刷新页面」时，Spring 会尝试匹配
 * 静态资源失败并返回 404 —— 表现为「刷新一下页面就白屏」，但站内点击跳转却正常，很难排查。
 *
 * <p>nginx 部署（packages/frontend/nginx.conf）已经用 {@code try_files $uri /index.html} 处理，
 * 但 Spring 直接托管 dist 的单端口部署（application.properties 的 statics-locations）没有，
 * 这里补齐，保证两种部署方式行为一致。
 *
 * <p>注意匹配排除项：<br>
 * - {@code /api/**} 由各业务 Controller 处理，不应被回退吞掉；<br>
 * - 带扩展名的路径（如 *.js / *.css / *.png）是静态资源，缺失时应如实 404，
 * 否则会把「chunk 加载失败」伪装成 200 的 HTML，导致前端报 JSON/MIME 错误。
 */
@Controller
public class SpaController {

    /**
     * 匹配所有「看起来像前端路由」的路径：不含点号（即无文件扩展名）， 且不以 api / ws / actuator 开头。
     * 这些请求统一 forward 到 index.html，交给前端路由接管。
     */
    @GetMapping({"/{path:[^\\.]*}", "/{path:^(?!api|ws|actuator)[^\\.]*}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
