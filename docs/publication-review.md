# v0.2.2 public-preview preparation

Review date: 2026-11-01 (Asia/Shanghai).

## Reviewed scope

- The four existing repository commits before publication-material changes, their parent chain, and all 87 unique historical blob versions were checked. Every historical blob was matched to reviewed local source material, including the initial generated README.
- Commit author addresses use GitHub no-reply addresses; the initial web commit's committer is GitHub's no-reply identity.
- The candidate source files were searched for private keys, common cloud/API token formats, production webhook patterns, selected personal-email patterns, and the actual random credentials used by the separate local demo. No matches were found in that review.
- Three completed CI job logs were checked for exposed private-demo credentials and key patterns. No matches were found. Literal credentials in CI source are fictional/disposable test fixtures.
- Only .env.example is included. Dependency/build directories, actual configuration, database files, local-demo login files and control scripts are outside the source release.
- Screenshots show fictional venues and test requests. PNG screenshots contain only image data/header/end chunks; the directory screenshot is a JFIF JPEG without EXIF or comment metadata.
- Direct runtime dependency names, locked versions and declared licenses are recorded in THIRD_PARTY_NOTICES.md. Dependencies are installed separately and retain their upstream licenses.

## Publication materials

English and Chinese landing READMEs, installation/upgrade instructions, privacy-aware issue forms, a PR template, contribution/security policies, screenshots and v0.2.2 preview notes are included. An obsolete account-specific repository-creation helper was removed from the current tree; prior commits remain visible as normal Git history.

Application behavior is unchanged by these publication-material updates. Linux build, database, HTTP and Docker recovery evidence is linked from QUALITY_STATUS.md. The current release commit's CI status is available under repository Actions.

## Limits

This is a bounded source/history review, not a proof that all possible secrets, vulnerabilities or ownership issues have been eliminated. No external adoption, public hosted demo, independent security certification or production support guarantee is claimed. Real applicant data and operational credentials must not be placed in issues or demo deployments.

中文：本次公开准备检查覆盖现有四次提交和全部 87 个历史文件版本、当前发布材料及三份 CI 日志；未发现匹配的真实密钥或独立本机演示凭据。截图和测试均使用虚构数据。这是有限范围检查，不等于全面安全认证或外部使用记录。
