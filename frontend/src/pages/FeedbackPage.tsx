import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './FeedbackPage.module.css';

type FeedbackType = 'BUG' | 'SUGGESTION' | 'EXPERIENCE' | 'OTHER';
type DeploymentType = 'OFFICIAL' | 'SELF_HOSTED' | 'MODIFIED';

const TYPE_OPTIONS: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'BUG',         label: '报告 Bug',      icon: '🐛' },
  { value: 'SUGGESTION',  label: '功能建议',      icon: '💡' },
  { value: 'EXPERIENCE',  label: '使用体验',      icon: '📋' },
  { value: 'OTHER',       label: '其他',          icon: '🔧' },
];

const DEPLOY_OPTIONS: { value: DeploymentType; label: string }[] = [
  { value: 'OFFICIAL',    label: '官方/标准实例' },
  { value: 'SELF_HOSTED', label: '自行部署' },
  { value: 'MODIFIED',    label: '其他用户修改版' },
];

export default function FeedbackPage() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [type, setType] = useState<FeedbackType>('BUG');
  const [deployment, setDeployment] = useState<DeploymentType>('SELF_HOSTED');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [githubUser, setGithubUser] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { setError('请填写反馈描述'); return; }
    setError('');
    setSubmitting(true);

    try {
      const body: any = { type, deployment, title, description };
      if (steps.trim()) body.stepsToReproduce = steps;
      if (expected.trim()) body.expectedBehavior = expected;
      if (actual.trim()) body.actualBehavior = actual;
      if (githubUser.trim()) body.githubUsername = githubUser;
      if (contact.trim()) body.contact = contact;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '提交失败');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✅</div>
          <h1 className={styles.successTitle}>感谢你的反馈！</h1>
          <p className={styles.successDesc}>
            我们会认真阅读每一条反馈，持续改进 WebChat 的体验。
          </p>
          <div className={styles.successActions}>
            <button className={styles.btnPrimary} onClick={() => navigate('/')}>
              返回首页
            </button>
            <button className={styles.btnSecondary} onClick={() => setSubmitted(false)}>
              再填一条
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>W</Link>
          <div className={styles.headerText}>
            <h1 className={styles.h1}>WebChat 反馈</h1>
            <p className={styles.subtitle}>
              Bug 报告、功能建议、使用体验 — 你的每一条反馈都在帮助我们做得更好
            </p>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* 反馈类型 */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>反馈类型</legend>
            <div className={styles.typeGrid}>
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.typeBtn} ${type === opt.value ? styles.typeBtnActive : ''}`}
                  onClick={() => setType(opt.value)}
                >
                  <span className={styles.typeIcon}>{opt.icon}</span>
                  <span className={styles.typeLabel}>{opt.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* 部署形式 */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>你使用的是哪种形式的 WebChat？</legend>
            <div className={styles.radioGroup}>
              {DEPLOY_OPTIONS.map(opt => (
                <label key={opt.value} className={`${styles.radio} ${deployment === opt.value ? styles.radioActive : ''}`}>
                  <input
                    type="radio"
                    name="deployment"
                    value={opt.value}
                    checked={deployment === opt.value}
                    onChange={() => setDeployment(opt.value)}
                    className={styles.radioInput}
                  />
                  <span className={styles.radioDot} />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* GitHub 用户名 */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              GitHub 用户名 <span className={styles.optional}>（选填）</span>
            </label>
            <input
              className={styles.input}
              type="text"
              placeholder="你的 GitHub 用户名"
              value={githubUser}
              onChange={e => setGithubUser(e.target.value)}
            />
          </div>

          {/* 标题 */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              标题 <span className={styles.optional}>（选填）</span>
            </label>
            <input
              className={styles.input}
              type="text"
              placeholder={type === 'BUG' ? '简洁描述问题' : '简洁描述你的建议'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* 详细描述 */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              详细描述 <span className={styles.required}>*</span>
            </label>
            <textarea
              className={styles.textarea}
              rows={5}
              placeholder={type === 'BUG' ? '发生了什么？有什么影响？' : '详细描述你的想法...'}
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={10000}
            />
            <span className={styles.counter}>{description.length}/10000</span>
          </div>

          {/* Bug 相关字段 */}
          {type === 'BUG' && (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>复现步骤 <span className={styles.optional}>（选填）</span></label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  placeholder="1. 打开...\n2. 点击...\n3. 看到..."
                  value={steps}
                  onChange={e => setSteps(e.target.value)}
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>期望行为 <span className={styles.optional}>（选填）</span></label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    placeholder="本来应该怎样？"
                    value={expected}
                    onChange={e => setExpected(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>实际行为 <span className={styles.optional}>（选填）</span></label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    placeholder="实际发生了什么？"
                    value={actual}
                    onChange={e => setActual(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* 联系方式 */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              联系方式 <span className={styles.optional}>（选填，邮箱 / 其他）</span>
            </label>
            <input
              className={styles.input}
              type="text"
              placeholder="方便我们联系你确认问题"
              value={contact}
              onChange={e => setContact(e.target.value)}
            />
          </div>

          {/* 提交 */}
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? '提交中...' : '提交反馈'}
            </button>
            <Link to="/" className={styles.btnLink}>取消</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
