# Helm 模板文件 — 引用 K8s 清单
{{- range $path, $_ := .Files.Glob "templates/**" }}
{{ $.Files.Get $path }}
---
{{- end }}
